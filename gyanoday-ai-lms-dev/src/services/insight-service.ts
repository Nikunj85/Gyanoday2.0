import { createClient } from '@/lib/supabase/client'

export interface InsightData {
  user_id: string
  chapter_id: string
  language: string
  insight_text: string
  weak_areas: string[] // JSONB
  score_context: {
    quiz_score: number
    avg_score: number
    attempts: number
    time: string
  }
}

const supabase = createClient()

export const insightService = {
  async saveInsight(data: InsightData) {
    const { error } = await supabase.from('ai_insights').insert([
      {
        user_id: data.user_id,
        chapter_id: data.chapter_id,
        language: data.language,
        insight_text: data.insight_text,
        weak_areas: data.weak_areas,
        score_context: data.score_context,
      },
    ])

    if (error) {
      console.error('Error saving insight:', error)
      throw error
    }
  },

  async getLatestInsight(userId: string, chapterId: string) {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching insight:', error)
      return null
    }

    return data
  },
}
