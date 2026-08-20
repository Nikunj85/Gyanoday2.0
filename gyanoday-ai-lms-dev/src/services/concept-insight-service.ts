import { createClient } from '@/lib/supabase/server'

export interface RecommendedTopic {
  topic: string
  timesFlagged: number
}

export const conceptInsightService = {
  /**
   * Aggregates weak_areas across every ai_insights row for this student +
   * chapter (one row per past quiz attempt) into a ranked list of concepts
   * to recommend for targeted practice — the "identifies weak concepts,
   * tracks conceptual gaps, recommends targeted revision" part of the
   * Cognitive Quiz Matrix feature.
   *
   * Simple frequency ranking: a concept flagged as weak across more past
   * attempts is recommended first, since it's a persistent gap rather than
   * a one-off mistake.
   */
  async getRecommendedTopics(
    userId: string,
    chapterId: string,
    limit: number = 5
  ): Promise<RecommendedTopic[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_insights')
      .select('weak_areas, created_at')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .limit(20) // recent history is enough — don't need every attempt ever made

    if (error || !data) {
      return []
    }

    const tally = new Map<string, number>()
    const displayForms = new Map<string, string>()

    for (const row of data) {
      const weakAreas: string[] = Array.isArray(row.weak_areas) ? row.weak_areas : []
      for (const raw of weakAreas) {
        const topic = raw.trim()
        if (!topic) continue
        // Case-insensitive dedupe (e.g. "Newton's Laws" vs "newton's laws"
        // showing up across different attempts should count as one topic).
        const key = topic.toLowerCase()
        tally.set(key, (tally.get(key) || 0) + 1)
        if (!displayForms.has(key)) displayForms.set(key, topic)
      }
    }

    const ranked: RecommendedTopic[] = Array.from(tally.entries())
      .map(([key, count]) => ({ topic: displayForms.get(key) || key, timesFlagged: count }))
      .sort((a, b) => b.timesFlagged - a.timesFlagged)
      .slice(0, limit)

    return ranked
  },
}
