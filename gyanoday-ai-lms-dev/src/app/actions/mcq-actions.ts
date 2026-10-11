'use server'

import { requireUser } from '@/lib/auth/guards'
import { mcqAiService } from '@/services/ai/mcq-ai-service'

export async function generateChapterMcqs(chapterId: string, userId?: string) {
  await requireUser()
  if (!chapterId) {
    throw new Error('Chapter ID is required')
  }

  const mcqs = await mcqAiService.generateMcqsFromPdfUrl(chapterId, userId)

  return mcqs
}
