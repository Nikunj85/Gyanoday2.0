'use server'

import { mcqAiService } from '@/services/ai/mcq-ai-service'

export async function generateChapterMcqs(chapterId: string, userId?: string) {
  if (!chapterId) {
    throw new Error('Chapter ID is required')
  }

  const mcqs = await mcqAiService.generateMcqsFromPdfUrl(chapterId, userId)

  return mcqs
}
