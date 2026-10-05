import { languageEnforcement, resolveContentLanguage } from '@/lib/ai/language'
import { buildPrompt } from '@/lib/ai/promptUtils'
import { McqQuestionSchema, McqSchema } from '@/lib/constants/mcq_keys'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { IncrementalJsonArrayExtractor } from '@/lib/utils/incremental-json-array-extractor'

import { chapterServerService } from '../chapter-server-service'
import { quizServerService } from '../quiz-server-service'
import { settingsService } from '../settings-server-service'

async function getGenerationLanguage(
  userId: string | undefined,
  chapterLanguage?: string | null,
  subjectLanguage?: string | null,
  subjectName?: string | null
) {
  // Chapter / subject language is authoritative (see lib/ai/language.ts).
  // The student's medium is only a last-resort fallback.
  let fallbackLanguage: string | null = null
  if (!chapterLanguage && !subjectLanguage && userId) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('language')
      .eq('id', userId)
      .maybeSingle()
    fallbackLanguage = data?.language || null
  }

  return resolveContentLanguage({ chapterLanguage, subjectLanguage, subjectName, fallbackLanguage })
}

/**
 * Builds the final MCQ prompt. The admin-editable template from `settings` is
 * used as the base, but two things are guaranteed in code so they cannot be
 * lost by editing the template:
 *   - topic focus (older templates have no {{topic_focus}} placeholder)
 *   - the output language (Hindi / Gujarati chapters must produce Hindi / Gujarati quizzes)
 */
function composeMcqPrompt(template: string, variables: Record<string, string>) {
  let prompt = buildPrompt(PromptKeys.PROMPT_MCQ_GENERATOR, template, variables)

  if (!template.includes('{{topic_focus}}')) {
    prompt += `\n\n${variables.topic_focus}`
  }

  prompt += languageEnforcement(variables.language as any, 'json')
  return prompt
}

async function buildStudentProfile(userId: string | undefined, chapterId: string): Promise<string> {
  if (!userId) {
    return 'New Student (No previous attempts). General diagnostic quiz required.'
  }
  try {
    const [recentAttempts, lastInsight] = await Promise.all([
      quizServerService.getRecentAttempts(userId, chapterId, 3),
      quizServerService.getLatestInsight(userId, chapterId),
    ])

    if (recentAttempts.length === 0) {
      return 'New Student (No previous attempts). General diagnostic quiz required.'
    }

    const profile = {
      attempt_count: recentAttempts.length,
      recent_scores: recentAttempts.map((a) => `${((a.score / a.total_questions) * 100).toFixed(1)}%`),
      weak_areas: lastInsight?.weak_areas || [],
    }
    return JSON.stringify(profile, null, 2)
  } catch (error) {
    console.error('[McqAiService] Error fetching student profile data:', error)
    return 'New Student (No previous attempts). General diagnostic quiz required.'
  }
}

function buildTopicFocus(topic?: string): string {
  if (!topic || !topic.trim()) {
    return 'Cover the entire chapter comprehensively, spreading questions across all its major sections.'
  }
  return `Focus specifically on this topic/concept only: "${topic.trim()}". Every question must relate directly to it — do not include questions from unrelated parts of the chapter.`
}

export const mcqAiService = {
  /**
   * Legacy, non-streaming generation. Kept as a fallback in case the
   * streaming/vector-store path errors out.
   */
  async generateMcqsFromPdfUrl(chapterId: string, userId?: string, topic?: string) {
    const [fileId, chapter] = await Promise.all([
      chapterServerService.getOrUploadChapterFileId(chapterId),
      chapterServerService.getChapterById(chapterId),
    ])

    if (!chapter || !chapter.pdf_url) {
      throw new Error('Chapter or PDF URL not found')
    }

    const { data: subject } = await supabaseAdmin
      .from('subjects')
      .select('language, name')
      .eq('id', chapter.subject_id)
      .maybeSingle()

    const [promptSetting, questionCountSetting, studentProfile, generationLanguage] = await Promise.all([
      settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_MCQ_GENERATOR),
      settingsService.getSettingBasedOnKey(PromptKeys.TOTAL_QUESTION_PER_TEST),
      buildStudentProfile(userId, chapterId),
      getGenerationLanguage(userId, chapter.language, subject?.language, subject?.name),
    ])

    const variables = {
      language: generationLanguage,
      student_profile: studentProfile,
      total_questions: questionCountSetting?.value || '10',
      topic_focus: buildTopicFocus(topic),
    }

    const prompt = composeMcqPrompt(promptSetting.value, variables)
      console.log(`[McqAiService] chapter=${chapterId} chapter.language=${chapter.language} subject.language=${subject?.language} subject.name=${subject?.name} -> generating in ${generationLanguage}`)

    return openAIService.generateResultWithSchema({
      fileId,
      prompt,
      schema: McqSchema,
      schemaName: 'mcq_questions',
    })
  },

  /**
   * Streaming generation. Yields each question the moment it's fully
   * generated (via file_search retrieval + incremental JSON parsing), so
   * the UI can let the student start on question 1 while the rest are
   * still being written — instead of a blank screen until everything is
   * ready. Yields a final 'done' event with the authoritative, schema-
   * validated full result once the stream completes.
   *
   * `topic` (optional) narrows generation to a single concept/topic within
   * the chapter, for targeted practice — see chapter-server-service's
   * quizzes.topic column and the unique index on
   * (chapter_id, user_id, topic), which keeps a topic-quiz as a distinct
   * quiz row from the full-chapter quiz.
   */
  async *streamMcqsFromPdfUrl(
    chapterId: string,
    userId?: string,
    topic?: string
  ): AsyncGenerator<
    | { type: 'question'; data: unknown }
    | { type: 'done'; data: unknown }
    | { type: 'error'; message: string }
  > {
    try {
      const chapter = await chapterServerService.getChapterById(chapterId)

      if (!chapter || !chapter.pdf_url) {
        yield { type: 'error', message: 'Chapter or PDF URL not found' }
        return
      }

      const { data: subject } = await supabaseAdmin
        .from('subjects')
        .select('language, name')
        .eq('id', chapter.subject_id)
        .maybeSingle()

      const [vectorStoreId, promptSetting, questionCountSetting, studentProfile, generationLanguage] = await Promise.all([
        chapterServerService.getOrCreateChapterVectorStoreId(chapterId, false, chapter),
        settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_MCQ_GENERATOR),
        settingsService.getSettingBasedOnKey(PromptKeys.TOTAL_QUESTION_PER_TEST),
        buildStudentProfile(userId, chapterId),
        getGenerationLanguage(userId, chapter.language, subject?.language, subject?.name),
      ])

      const variables = {
        language: generationLanguage,
        student_profile: studentProfile,
        total_questions: questionCountSetting?.value || '10',
        topic_focus: buildTopicFocus(topic),
      }

      const prompt = composeMcqPrompt(promptSetting.value, variables)

      const extractor = new IncrementalJsonArrayExtractor('questions')
      let fullBuffer = ''
      const seenQuestionIds = new Set<unknown>()

      for await (const chunk of openAIService.streamStructuredUsingFileSearch(
        vectorStoreId,
        prompt,
        McqSchema,
        'mcq_questions'
      )) {
        fullBuffer += chunk
        const newQuestions = extractor.push(chunk)
        for (const q of newQuestions) {
          const parsed = McqQuestionSchema.safeParse(q)
          if (parsed.success && !seenQuestionIds.has(parsed.data.id)) {
            seenQuestionIds.add(parsed.data.id)
            yield { type: 'question', data: parsed.data }
          }
        }
      }

      // Final authoritative parse — this is what's actually used for
      // metadata (difficulty, pass criteria context) and as the source of
      // truth, even though individual questions were already revealed above.
      let finalResult: unknown
      try {
        finalResult = JSON.parse(fullBuffer)
      } catch {
        yield { type: 'error', message: 'Failed to parse the generated quiz. Please try again.' }
        return
      }

      const validated = McqSchema.safeParse(finalResult)
      if (!validated.success) {
        yield { type: 'error', message: 'The generated quiz was malformed. Please try again.' }
        return
      }

      yield { type: 'done', data: { ...validated.data, topic: topic || null } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate the quiz.'
      yield { type: 'error', message }
    }
  },
}
