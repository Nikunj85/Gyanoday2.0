import { createClient } from '@/lib/supabase/client'
import { AIInsight } from '@/types'

const supabase = createClient()

export const aiInsightService = {
  /**
   * Get all AI insights for a specific user.
   * @param userId The ID of the user to fetch insights for.
   * @param client Optional Supabase client (used for server-side calls). Falls back to default client.
   * @returns An array of AI insights.
   */
  async getInsightsByUserId(userId: string, client?: any): Promise<any[]> {
    if (!userId) return []

    const currentClient = client || supabase

    const { data, error } = await currentClient
      .from('ai_insights')
      .select('*, chapter:chapters(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching AI insights:', error)
      throw error
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
