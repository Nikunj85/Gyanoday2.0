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
        // This was previously missing — every downstream percentage
        // calculation (dashboard Strength/Weakness, chapter mastery
        // level, etc.) needs BOTH quiz_score and total_questions to
        // compute a %, so without this every insight ever saved was
        // functionally useless for that purpose despite having a real
        // score behind it.
        total_questions: totalQuestions ?? 0,
        avg_score: aiResponse.derivedStats.avg_score,
        attempts: aiResponse.derivedStats.attempts,
        time: time,
      } as Parameters<typeof insightServerService.saveInsight>[0]['score_context'],
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
