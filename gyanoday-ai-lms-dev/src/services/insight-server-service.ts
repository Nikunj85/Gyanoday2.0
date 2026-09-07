import { createClient } from '@/lib/supabase/server'

export interface InsightData {
  user_id: string
  chapter_id: string
  language: string
  insight_text: string
  weak_areas: string[]
  score_context: {
    quiz_score: number
    total_questions: number
    avg_score: number
    attempts: number
    time: string
  }
}

export const insightServerService = {
  async saveInsight(data: InsightData) {
    const supabase = await createClient()

    const { data: insertedData, error } = await supabase
      .from('ai_insights')
      .insert([
        {
          user_id: data.user_id,
          chapter_id: data.chapter_id,
          language: data.language,
          insight_text: data.insight_text,
          weak_areas: data.weak_areas,
          score_context: data.score_context,
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return insertedData
  },
}
