'use server'

import { chatbotAiService } from '@/services/ai/chatbot-ai-service'
import { chapterServerService } from '@/services/chapter-server-service'

interface ChapterData {
  id: string
  pdf_url: string | null
  title: string
  language: string
}

/**
 * Helper to fetch Chapter Data with retry logic
 */
async function fetchChapterDataWithRetry(
  chapterId: string,
  retries: number = 3,
  delay: number = 1000
): Promise<ChapterData> {
  try {
    const chapter = (await chapterServerService.getChapterById(chapterId)) as ChapterData

    if (!chapter) {
      throw new Error('The selected chapter could not be found.')
    }

    return chapter
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return fetchChapterDataWithRetry(chapterId, retries - 1, delay * 2)
    }

    throw error
  }
}

/**
 * Server action to generate an answer from the chatbot based on a chapter ID and user question.
 * Implements a two-step process: fetch PDF URL -> call AI service.
 *
 * @param chapterId The ID of the chapter to analyze
 * @param question The user's question
 * @param history The conversation history
 */
export async function getChatbotResponse(
  chapterId: string,
  question: string,
  history: string = '',
  studentName: string = ''
) {
  try {
    if (!chapterId) {
      throw new Error('Chapter ID is required to process the request.')
    }

    // 1. Fetch Chapter Data (including PDF URL and Language) with retry logic

    const chapter = await fetchChapterDataWithRetry(chapterId)

    if (!chapter.pdf_url) {
      throw new Error('The selected chapter does not have an associated PDF document.')
    }

    const language = chapter.language || 'en'

    // 2. Pass retrieved URL and Chapter language to the AI service
    const answer = await chatbotAiService.generateAnswerFromChapterId(chapterId, {
      question,
      conversation_history: history,
      language,
      student_name: studentName,
    })

    return { success: true, answer }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while generating the chatbot response',
    }
  }
}
