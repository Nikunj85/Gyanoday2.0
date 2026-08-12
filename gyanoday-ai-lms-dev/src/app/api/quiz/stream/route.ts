import { NextRequest } from 'next/server'

import { mcqAiService } from '@/services/ai/mcq-ai-service'

export const runtime = 'nodejs'

interface QuizStreamRequestBody {
  chapterId: string
  userId?: string
}

/**
 * Streams quiz generation as newline-delimited JSON (one JSON object per
 * line): a "question" event per question the instant it's ready, then a
 * final "done" event with the full, schema-validated quiz. This lets the
 * student start on question 1 immediately instead of staring at a blank
 * screen until all questions are generated.
 */
export async function POST(req: NextRequest) {
  let body: QuizStreamRequestBody
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const { chapterId, userId } = body

  if (!chapterId) {
    return new Response('chapterId is required', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of mcqAiService.streamMcqsFromPdfUrl(chapterId, userId)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate the quiz.'
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message }) + '\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
