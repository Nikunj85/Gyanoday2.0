import { NextRequest } from 'next/server'

import { requireUser } from '@/lib/auth/guards'
import { chatbotAiService } from '@/services/ai/chatbot-ai-service'
import { chapterServerService } from '@/services/chapter-server-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveStudentContentLanguage } from '@/lib/ai/language'

export const runtime = 'nodejs'

interface StreamRequestBody {
  chapterId: string
  question: string
  history?: string
}

interface SubjectWithLanguage {
  name?: string
  language?: string
  color_code?: string
}

export async function POST(req: NextRequest) {
  let authenticatedUser: Awaited<ReturnType<typeof requireUser>>

  try {
    authenticatedUser = await requireUser()
  } catch {
    return new Response('Not authenticated', { status: 401 })
  }

  let body: StreamRequestBody

  try {
    body = await req.json()
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const {
    chapterId,
    question: rawQuestion,
    history: rawHistory = '',
  } = body

  if (
    !chapterId ||
    typeof rawQuestion !== 'string' ||
    !rawQuestion.trim()
  ) {
    return new Response('chapterId and question are required', {
      status: 400,
    })
  }

  const question = rawQuestion.slice(0, 2000)
  const history = String(rawHistory ?? '').slice(-8000)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chapter =
          await chapterServerService.getChapterById(chapterId)

        if (!chapter) {
          controller.enqueue(
            encoder.encode('Chapter not found.')
          )
          controller.close()
          return
        }

        if (!chapter.pdf_url) {
          controller.enqueue(
            encoder.encode(
              'This chapter does not have an associated document to answer from.'
            )
          )
          controller.close()
          return
        }

        // Load the authenticated student's own profile.
        const { data: profile, error: profileError } =
          await supabaseAdmin
            .from('users')
            .select('name, language, role')
            .eq('id', authenticatedUser.id)
            .maybeSingle()

        if (profileError) {
          console.error(
            '[api/chatbot/stream] Could not load student profile:',
            profileError
          )
        }

        // The service's current inferred subject type does not include
        // language. This local type safely supports it when the service
        // returns the language field.
        const subject = chapter.subject as
          | SubjectWithLanguage
          | null
          | undefined

        const studentMedium = profile?.language || 'en'
        const subjectName = subject?.name || ''
        const subjectLanguage = subject?.language || 'en'

        const language = resolveStudentContentLanguage(
          studentMedium,
          subjectName,
          subjectLanguage
        )

        const trustedStudentName = (
          profile?.name || 'Student'
        ).slice(0, 80)

        for await (const chunk of chatbotAiService.streamAnswerFromChapterId(
          chapterId,
          {
            question,
            conversation_history: history,
            language,
            student_name: trustedStudentName,
          },
          chapter
        )) {
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (error) {
        console.error(
          '[api/chatbot/stream] ERROR generating chatbot response:',
          error
        )

        const message =
          error instanceof Error && error.message
            ? error.message
            : 'An unexpected error occurred while generating the chatbot response.'

        controller.enqueue(
          encoder.encode(`\n[[STREAM_ERROR]]${message}`)
        )
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