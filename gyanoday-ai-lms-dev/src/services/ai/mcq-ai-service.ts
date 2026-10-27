import { languageEnforcement, resolveStudentContentLanguage } from '@/lib/ai/language'
import { buildPrompt } from '@/lib/ai/promptUtils'
import { McqQuestionSchema, McqSchema } from '@/lib/constants/mcq_keys'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

import { chapterServerService } from '../chapter-server-service'
import { quizServerService } from '../quiz-server-service'
import { settingsService } from '../settings-server-service'

async function getGenerationLanguage(
  userId: string | undefined,
  subjectLanguage?: string | null,
  subjectName?: string | null
) {
  // The student's medium controls ordinary subjects; language subjects keep their own language.
  let fallbackLanguage: string | null = null
  if (userId) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('language')
      .eq('id', userId)
      .maybeSingle()
    fallbackLanguage = data?.language || null
  }

  return resolveStudentContentLanguage(fallbackLanguage || 'en', subjectName, subjectLanguage)
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
  if (variables.language === 'Hindi') {
    prompt += '\n\nSCRIPT VALIDATION: Write every question, every option, every explanation, and student_profile_summary in natural Hindi using Devanagari (हिन्दी). Latin-letter gibberish or Hindi transliteration is invalid. Use only chapter facts; if the source text is unreadable, do not invent questions.'
  } else if (variables.language === 'Gujarati') {
    prompt += '\n\nSCRIPT VALIDATION: Write every question, every option, every explanation, and student_profile_summary in natural Gujarati using Gujarati script (ગુજરાતી). Latin-letter gibberish or Gujarati transliteration is invalid. Use only chapter facts; if the source text is unreadable, do not invent questions.'
  } else {
    prompt += '\n\nWrite natural, grammatical English. Every question and option must be meaningful and directly supported by the chapter. Do not output random letters or corrupted text.'
  }
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
      getGenerationLanguage(userId, subject?.language, subject?.name),
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

      const fileId = await chapterServerService.getOrUploadChapterFileId(chapterId, false, chapter)
      const chapterWithFile = { ...chapter, file_id: fileId }
      let vectorStoreId: string | null = null
      try {
        vectorStoreId = await chapterServerService.getOrCreateChapterVectorStoreId(chapterId, false, chapterWithFile)
      } catch (vectorStoreError) {
        // The original PDF file is still usable even if vector indexing/cache setup fails.
        console.error('[McqAiService] Vector-store setup failed; quiz will use the PDF directly:', vectorStoreError)
      }
      const [promptSetting, questionCountSetting, studentProfile, generationLanguage] = await Promise.all([
        settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_MCQ_GENERATOR),
        settingsService.getSettingBasedOnKey(PromptKeys.TOTAL_QUESTION_PER_TEST),
        buildStudentProfile(userId, chapterId),
        getGenerationLanguage(userId, subject?.language, subject?.name),
      ])
      if (!promptSetting?.value) {
        yield { type: 'error', message: 'Quiz generation is not configured. Ask the administrator to add PROMPT_MCQ_GENERATOR in Settings.' }
        return
      }

      const variables = {
        language: generationLanguage,
        student_profile: studentProfile,
        total_questions: questionCountSetting?.value || '10',
        topic_focus: buildTopicFocus(topic),
      }

      const prompt = composeMcqPrompt(promptSetting.value, variables)

      let validated: any = null
      let lastError = 'The generated quiz was malformed. Please try again.'

      // Never stream unvalidated questions to the learner. A malformed or wrong-script
      // first attempt is discarded and regenerated once with the same chapter and language.
      for (let attempt = 0; attempt < 2; attempt++) {
        let fullBuffer = ''
        const retryPrompt = attempt === 0
          ? prompt
          : `${prompt}\n\nFINAL RETRY: Previous output was unusable. Generate clean, meaningful ${generationLanguage} content in the correct native script. Do not transliterate. Ensure each question is directly grounded in this chapter.`

        try {
          if (attempt === 0 && vectorStoreId) {
            for await (const chunk of openAIService.streamStructuredUsingFileSearch(
              vectorStoreId,
              retryPrompt,
              McqSchema,
              'mcq_questions'
            )) {
              fullBuffer += chunk
            }
          } else {
            // Retry through the original PDF file directly. This avoids repeating a
            // bad/empty vector-store retrieval when the first result is unusable.
            const directResult = await openAIService.generateResultWithSchema({
              fileId,
              prompt: retryPrompt,
              schema: McqSchema,
              schemaName: 'mcq_questions',
            })
            fullBuffer = JSON.stringify(directResult)
          }
        } catch (generationError) {
          lastError = generationError instanceof Error ? generationError.message : lastError
          continue
        }

        let parsed: unknown
        try {
          parsed = JSON.parse(fullBuffer)
        } catch {
          lastError = 'The generated quiz was not valid JSON.'
          continue
        }

        const result = McqSchema.safeParse(parsed)
        if (!result.success) {
          lastError = 'The generated quiz did not match the required question format.'
          continue
        }

        const learnerText = result.data.questions
          .map((q) => [q.question, q.options.A, q.options.B, q.options.C, q.options.D, q.explanation].join(' '))
          .join(' ')
        const letters = learnerText.match(/[\p{L}]/gu) || []
        const targetScript = generationLanguage === 'Hindi'
          ? (learnerText.match(/[\u0900-\u097F]/g) || []).length
          : generationLanguage === 'Gujarati'
            ? (learnerText.match(/[\u0A80-\u0AFF]/g) || []).length
            : (learnerText.match(/[A-Za-z]/g) || []).length
        const minimumScriptRatio = generationLanguage === 'English' ? 0.35 : 0.2
        if (letters.length > 0 && targetScript / letters.length < minimumScriptRatio) {
          lastError = `The AI returned quiz text in the wrong script for ${generationLanguage}. Please try again.`
          continue
        }

        validated = result.data
        break
      }

      if (!validated) {
        yield { type: 'error', message: lastError }
        return
      }

      for (const question of validated.questions) {
        const questionCheck = McqQuestionSchema.safeParse(question)
        if (questionCheck.success) yield { type: 'question', data: questionCheck.data }
      }
      yield { type: 'done', data: { ...validated, topic: topic || null } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate the quiz.'
      yield { type: 'error', message }
    }
  },
}
