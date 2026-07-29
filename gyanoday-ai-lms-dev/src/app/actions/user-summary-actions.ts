'use server'

import { createClient } from '@/lib/supabase/server'
import { userSummaryAiService } from '@/services/ai/user-summary-ai-service'
import { aiInsightService } from '@/services/ai-insight-service'
import { studentPerformanceService } from '@/services/student-performance-service'
import { userServerService } from '@/services/user-server-service'
import { ScoreSummary } from '@/types/users'

/**
 * Server action to generate an overall student performance summary.
 *
 * @param userId The ID of the student
 * @param language The preferred language for the summary
 */
export async function generateStudentOverallSummary(
  userId: string,
  language: string,
  studentName: string
) {
  try {
    if (!userId) {
      throw new Error('User ID is required to generate a summary.')
    }

    // 1. Fetch all AI insights for the user (using server client for consistency)
    const supabase = await createClient()
    const insights = await aiInsightService.getInsightsByUserId(userId, supabase)

    if (!insights || insights.length === 0) {
      return {
        success: true,
        summary: null,
      }
    }

    // 2. Fetch user's class_id via userServerService
    const userData = await userServerService.getUserById(userId)

    if (!userData || !userData.class_id) {
      throw new Error('User class information not found.')
    }

    // 3. Calculate performance metrics and generate AI summary in parallel
    const [performance, aiSummaryResult] = await Promise.all([
      studentPerformanceService.calculatePerformance(userId, userData.class_id, supabase),
      userSummaryAiService.generateOverallSummary(insights, language, studentName),
    ])

    const summaryData: ScoreSummary = {
      summary: aiSummaryResult.summary,
      overall_score: performance.overallScore,
      performance_label: performance.performanceLabel,
    }

    // 4. Save to database in users table via server service
    await userServerService.updateScoreSummary(userId, summaryData)

    return {
      success: true,
      summary: summaryData.summary,
      score: summaryData.overall_score,
      label: summaryData.performance_label,
    }
  } catch (error) {
    console.error('[generateStudentOverallSummary] ERROR:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while generating the student summary',
    }
  }
}
