import { createClient } from '@/lib/supabase/server'

export const userProgressServerService = {
  async toggleCompletion(userId: string, chapterId: string, isCompleted: boolean) {
    const supabase = await createClient()

    // 1. Check for existing progress
    const { data: existing } = await supabase
      .from('user_chapter_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .maybeSingle()

    if (existing) {
      // 2. Update existing
      const { error } = await supabase
        .from('user_chapter_progress')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // 3. Insert new
      const { error } = await supabase.from('user_chapter_progress').insert([
        {
          user_id: userId,
          chapter_id: chapterId,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        },
      ])

      if (error) throw error
    }
  },

  /**
   * Fetches all chapter completions for a user within a specified date range.
   * Useful for calculating weekly streaks.
   */
  async getWeeklyChapterCompletions(userId: string, startDate: string, endDate: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_chapter_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('completed_at', startDate)
      .lt('completed_at', endDate)

    if (error) {
      console.error('[userProgressServerService] Error fetching weekly completions:', error)
      throw new Error(`Failed to fetch weekly chapter completions: ${error.message}`)
    }

    return data || []
  },
}
