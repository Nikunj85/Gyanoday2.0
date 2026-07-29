import { buildPrompt } from '@/lib/ai/promptUtils'
import { McqSchema } from '@/lib/constants/mcq_keys'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'

import { chapterServerService } from '../chapter-server-service'
import { quizServerService } from '../quiz-server-service'
import { settingsService } from '../settings-server-service'

export const mcqAiService = {
  async generateMcqsFromPdfUrl(chapterId: string, userId?: string) {
    // 1. Fetch Chapter and FileId reliably
    const fileId = await chapterServerService.getOrUploadChapterFileId(chapterId)
    const chapter = await chapterServerService.getChapterById(chapterId)

    if (!chapter || !chapter.pdf_url) {
      throw new Error('Chapter or PDF URL not found')
    }

    // 2. Fetch Settings
    const PrmptType = PromptKeys.PROMPT_MCQ_GENERATOR
    const promptSetting = await settingsService.getSettingBasedOnKey(PrmptType)
    const questionCountSetting = await settingsService.getSettingBasedOnKey(
      PromptKeys.TOTAL_QUESTION_PER_TEST
    )

    // 3. Dynamic Difficulty & Weak Area Logic
    let studentProfile = 'New Student (No previous attempts). General diagnostic quiz required.'

    if (userId) {
      try {
        const recentAttempts = await quizServerService.getRecentAttempts(userId, chapterId, 3)
        const lastInsight = await quizServerService.getLatestInsight(userId, chapterId)

        if (recentAttempts.length > 0) {
          const profile = {
            attempt_count: recentAttempts.length,
            recent_scores: recentAttempts.map(
              (a) => `${((a.score / a.total_questions) * 100).toFixed(1)}%`
            ),
            weak_areas: lastInsight?.weak_areas || [],
          }
          studentProfile = JSON.stringify(profile, null, 2)
        }
      } catch (error) {
        console.error('[McqAiService] Error fetching student profile data:', error)
      }
    }

    const variables = {
      language: chapter.language || 'English',
      student_profile:
        studentProfile || 'New Student (No previous attempts). General diagnostic quiz required.',
      total_questions: questionCountSetting?.value || '10',
    }

    const prompt = buildPrompt(PrmptType, promptSetting.value, variables)

    const mcqs = await openAIService.generateResultWithSchema({
      fileId: fileId,
      prompt,
      schema: McqSchema,
      schemaName: 'mcq_questions',
    })

    return mcqs
  },
}
