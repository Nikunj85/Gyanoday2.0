'use server'

import { z } from 'zod'

import { openAIService } from '@/lib/openai'
import { chapterServerService } from '@/services/chapter-server-service'

const TopicValidationSchema = z.object({
  isRelevant: z.boolean(),
  message: z.string().min(1),
})

/**
 * Checks whether a student's custom practice topic belongs to the currently
 * open chapter. This is deliberately separate from quiz generation so an
 * unrelated request can be stopped with a friendly explanation first.
 */
export async function validateTopicForChapter(chapterId: string, topic: string) {
  const trimmedTopic = topic.trim()

  if (!chapterId || !trimmedTopic) {
    return {
      isRelevant: false,
      message: 'Please enter a topic you want to practice.',
    }
  }

  const chapter = await chapterServerService.getChapterById(chapterId)

  const chapterContext = [
    `Chapter title: ${chapter.title || ''}`,
    `Subject: ${chapter.subject?.name || ''}`,
    `Description/summary: ${chapter.description || ''}`,
    `Smart notes: ${JSON.stringify(chapter.smart_notes || {})}`,
  ].join('\n')

  const result = await openAIService.generateTextResultWithSchema(
    `You are checking whether a student's requested practice topic belongs to the current school chapter.\n\n` +
      `${chapterContext}\n\n` +
      `Student requested topic: ${trimmedTopic}\n\n` +
      `Rules:\n` +
      `- Mark isRelevant true only when the requested topic is reasonably and directly connected to the chapter content.\n` +
      `- Mark it false when it is clearly from another subject, another chapter, general trivia unrelated to this chapter, or otherwise outside the chapter scope.\n` +
      `- Do not reject a topic merely because it is a narrower concept, synonym, example, formula, person, term, or application that could reasonably be covered by the chapter.\n` +
      `- If false, give a short polite message asking the student to choose a topic from the current chapter.\n` +
      `- If true, the message should be a short confirmation.`,
    TopicValidationSchema,
    'topic_relevance_check'
  )

  return result
}
