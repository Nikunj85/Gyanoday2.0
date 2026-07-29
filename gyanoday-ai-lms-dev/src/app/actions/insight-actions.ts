'use server'

import { insightAiService } from '@/services/ai/insight-ai-service'
import { insightServerService } from '@/services/insight-server-service'

export async function generateAndSaveInsight(
  userId: string,
  chapterId: string,
  score: number, // Correct answers
  totalQuestions: number,
  time: string,
  quizContext: Record<string, any>[] = []
) {
  try {
    // 1. Generate Insight using AI (fetching data internally)
    const aiResponse = await insightAiService.generateQuizInsight(
      userId,
      chapterId,
      score,
      totalQuestions,
      quizContext
    )

    // 2. Save to Supabase via Server Service
    await insightServerService.saveInsight({
      user_id: userId,
      chapter_id: chapterId,
      language: aiResponse.variableContext.language,
      insight_text: aiResponse.insight_text,
      weak_areas: aiResponse.weak_areas,
      score_context: {
        quiz_score: score,
        avg_score: aiResponse.derivedStats.avg_score,
        attempts: aiResponse.derivedStats.attempts,
        time: time,
      },
    })

    return aiResponse
  } catch (error: any) {
    if (
      error?.message?.includes('429') ||
      error?.status === 429 ||
      error?.response?.status === 429
    ) {
      return { _error: 'quota_exceeded' }
    }
    return { _error: 'generic' }
  }
}
