import { NextRequest } from 'next/server'

import { chatbotAiService } from '@/services/ai/chatbot-ai-service'
import { chapterServerService } from '@/services/chapter-server-service'

export const runtime = 'nodejs'

interface StreamRequestBody {
  chapterId: string
  question: string
  history?: string
  studentName?: string
}

/**
 * Streams the chatbot's answer back to the client as plain text chunks,
 * as they are produced by the model, instead of waiting for the full
 * response (see AIChatBot.tsx for the client-side reader).
 */
export async function POST(req: NextRequest) {
  let body: StreamRequestBody
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const { chapterId, question, history = '', studentName = '' } = body

  if (!chapterId || !question) {
    return new Response('chapterId and question are required', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chapter = await chapterServerService.getChapterById(chapterId)

        if (!chapter?.pdf_url) {
          controller.enqueue(
            encoder.encode('This chapter does not have an associated document to answer from.')
          )
          controller.close()
          return
        }

        const language = chapter.language || 'en'

        for await (const chunk of chatbotAiService.streamAnswerFromChapterId(
          chapterId,
          {
            question,
            conversation_history: history,
            language,
            student_name: studentName,
          },
          chapter // avoid re-fetching the chapter a second time
        )) {
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while generating the chatbot response.'
        // Emit a marker the client can detect and surface as an error toast,
        // since headers are already committed once streaming has started.
        controller.enqueue(encoder.encode(`\n[[STREAM_ERROR]]${message}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
