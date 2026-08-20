'use server'

import { conceptInsightService } from '@/services/concept-insight-service'

export async function getRecommendedTopics(userId: string, chapterId: string) {
  if (!userId || !chapterId) return []
  return conceptInsightService.getRecommendedTopics(userId, chapterId)
}
