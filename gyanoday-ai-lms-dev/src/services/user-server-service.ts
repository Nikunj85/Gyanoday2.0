import { createClient } from '@/lib/supabase/server'
import { ScoreSummary } from '@/types/users'

export const userServerService = {
  /**
   * Fetches a user by ID using the server client.
   *
   * @param userId The ID of the user
   */
  async getUserById(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()

    if (error) {
      console.error('[userServerService.getUserById] Error:', error)
      throw error
    }

    return data
  },

  /**
   * Updates a user's score summary in the database.
   * This runs on the server and uses the server client.
   *
   * @param userId The ID of the user to update
   * @param summaryData The ScoreSummary object to save
   */
  async updateScoreSummary(userId: string, summaryData: ScoreSummary) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .update({
        score_summary: summaryData,
      })
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('[userServerService.updateScoreSummary] Error:', error)
      throw error
    }

    return data
  },

  /**
   * Fetches all unique chapter insights for a student.
   *
   * @param userId The ID of the student
   */
  async getStudentInsights(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_insights')
      .select('*, chapter:chapters(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[userServerService.getStudentInsights] Error:', error)
      return []
    }

    if (!data) return []

    // Filter to get only the latest unique chapter insights
    const uniqueInsights = data.reduce((acc: any[], current: any) => {
      const exists = acc.find((item) => item.chapter_id === current.chapter_id)
      if (!exists) {
        acc.push(current)
      }
      return acc
    }, [])

    return uniqueInsights
  },
}
