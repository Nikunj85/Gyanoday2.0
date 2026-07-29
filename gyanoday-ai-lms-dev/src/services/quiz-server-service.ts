import { createClient } from '@/lib/supabase/server'

export const quizServerService = {
  /**
   * Fetches the most recent quiz attempts for a user and chapter.
   *
   * @param userId The ID of the student
   * @param chapterId The ID of the chapter
   * @param limit Maximum number of attempts to fetch
   */
  async getRecentAttempts(userId: string, chapterId: string, limit: number = 3) {
    const supabase = await createClient()

    // 1. Get the quiz ID for this chapter
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('chapter_id', chapterId)
      .maybeSingle()

    if (quizError || !quiz) {
      if (quizError) console.error('[quizServerService] Error fetching quiz:', quizError)
      return []
    }

    // 2. Get latest attempts for this quiz and user
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('score, total_questions, created_at')
      .eq('quiz_id', quiz.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (attemptsError) {
      console.error('[quizServerService] Error fetching attempts:', attemptsError)
      return []
    }

    return attempts || []
  },

  /**
   * Fetches the latest AI insight for a user and chapter to identify weak areas.
   *
   * @param userId The ID of the student
   * @param chapterId The ID of the chapter
   */
  async getLatestInsight(userId: string, chapterId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_insights')
      .select('insight_text, weak_areas')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.warn('[quizServerService] Error fetching insight:', error)
      return null
    }

    return data
  },

  /**
   * Fetches all quiz attempts for a user within a specified date range.
   * Useful for calculating weekly streaks.
   */
  async getWeeklyQuizAttempts(userId: string, startDate: string, endDate: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lt('created_at', endDate)

    if (error) {
      console.error('[quizServerService] Error fetching weekly attempts:', error)
      throw new Error(`Failed to fetch weekly quiz attempts: ${error.message}`)
    }

    return data || []
  },
}
