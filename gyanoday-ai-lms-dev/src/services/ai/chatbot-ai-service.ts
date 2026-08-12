import { buildPrompt } from '@/lib/ai/promptUtils'
import { filterHiddenReasoning, stripHiddenReasoning } from '@/lib/ai/thinkingFilter'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'

import { chapterServerService } from '../chapter-server-service'
import { settingsService } from '../settings-server-service'

export interface ChatbotVariables extends Record<string, string | undefined> {
  question: string
  language: string
  conversation_history?: string
  student_name?: string
  history?: string // Legacy support
}

export const chatbotAiService = {
  /**
   * Generates an answer using a chapter ID, reusing the file_id if it exists.
   */
  async generateAnswerFromChapterId(
    chapterId: string,
    variables: ChatbotVariables
  ): Promise<string> {
    // 1. Fetch prompt setting
    const promptType = PromptKeys.PROMPT_CHATBOT_ANSWER
    const setting = await settingsService.getSettingBasedOnKey(promptType)

    if (!setting) {
      throw new Error(`Chatbot configuration error: Prompt setting not found.`)
    }

    // Map the 'history' variable to 'conversation_history' if provided
    if (variables.history && !variables.conversation_history) {
      variables.conversation_history = variables.history
    }

    // Ensure conversation_history and student_name have default values to avoid buildPrompt errors
    const processedVariables = {
      ...variables,
      conversation_history: variables.conversation_history || 'No previous conversation history.',
      student_name: variables.student_name || 'Student',
    }

    // 2. Build prompt
    const prompt = buildPrompt(promptType, setting.value, processedVariables)
    // 3. Get file_id and generate answer
    try {
      // Attempt to get existing file_id or upload if missing
      const fileId = await chapterServerService.getOrUploadChapterFileId(chapterId)
      const rawAnswer = await openAIService.generateResultFromFileId(fileId, prompt)
      return stripHiddenReasoning(rawAnswer)
    } catch (aiError: any) {
      // Check for specific "404 Files ... were not found" error from OpenAI
      const errorMessage = aiError?.message || aiError?.toString() || ''

      if (errorMessage.includes('404') && errorMessage.includes('File')) {
        // File missing on OpenAI side (deleted?), force re-upload and update DB
        const newFileId = await chapterServerService.getOrUploadChapterFileId(chapterId, true)
        const rawAnswer = await openAIService.generateResultFromFileId(newFileId, prompt)
        return stripHiddenReasoning(rawAnswer)
      }

      throw aiError
    }
  },

  /**
   * Streaming variant of generateAnswerFromChapterId. Yields text chunks as
   * the AI produces them so the UI can render the answer "live" instead of
   * waiting for the full response. The model's private <thinking> block
   * (see the system prompt) is filtered out in real time — it is never
   * forwarded to the caller, even for a single chunk.
   */
  async *streamAnswerFromChapterId(
    chapterId: string,
    variables: ChatbotVariables,
    prefetchedChapter?: Awaited<ReturnType<typeof chapterServerService.getChapterById>>
  ): AsyncGenerator<string> {
    if (variables.history && !variables.conversation_history) {
      variables.conversation_history = variables.history
    }

    const processedVariables = {
      ...variables,
      conversation_history: variables.conversation_history || 'No previous conversation history.',
      student_name: variables.student_name || 'Student',
    }

    // Three independent lookups, run in parallel — this, plus the
    // vector-store cache being fixed to actually persist (see
    // chapter-server-service.ts), is most of what "time to first token"
    // was going toward.
    const [chapter, systemSetting, turnSetting, vectorStoreId] = await Promise.all([
      prefetchedChapter
        ? Promise.resolve(prefetchedChapter)
        : chapterServerService.getChapterById(chapterId),
      settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_SOCRATIC_TUTOR_SYSTEM),
      settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_CHATBOT_ANSWER),
      chapterServerService.getOrCreateChapterVectorStoreId(chapterId, false, prefetchedChapter),
    ])

    if (!systemSetting || !turnSetting) {
      throw new Error(`Chatbot configuration error: Prompt setting not found.`)
    }

    // STATIC part — the Socratic persona, rules, and output-schema
    // instructions, grounded in this specific chapter/subject/class. Stays
    // byte-identical across every turn of this chapter's conversation, so
    // the provider can cache it instead of reprocessing it every message.
    const instructions = buildPrompt(PromptKeys.PROMPT_SOCRATIC_TUTOR_SYSTEM, systemSetting.value, {
      chapter_title: chapter.title,
      subject_name: chapter.subject?.name || 'this subject',
      class_name: chapter.class?.name || 'this class',
      language: processedVariables.language,
      student_name: processedVariables.student_name,
    })

    // DYNAMIC part — only the actual question and conversation history,
    // which genuinely change every turn.
    const input = buildPrompt(PromptKeys.PROMPT_CHATBOT_ANSWER, turnSetting.value, processedVariables)

    // Raw model output — still wrapped in <internal_thought> /
    // <student_facing_response> tags per the system prompt's schema.
    // Uses file_search retrieval (fast — only relevant passages are pulled
    // in) instead of re-reading the entire chapter PDF on every message.
    async function* rawStream(): AsyncGenerator<string> {
      try {
        yield* openAIService.streamAnswerUsingFileSearch(vectorStoreId, input, { instructions })
      } catch (aiError: any) {
        const errorMessage = aiError?.message || aiError?.toString() || ''
        if (
          errorMessage.includes('404') ||
          errorMessage.includes('vector_store') ||
          errorMessage.includes('not found')
        ) {
          // Vector store missing/expired on OpenAI's side — rebuild once and retry.
          const newVectorStoreId = await chapterServerService.getOrCreateChapterVectorStoreId(
            chapterId,
            true,
            prefetchedChapter
          )
          yield* openAIService.streamAnswerUsingFileSearch(newVectorStoreId, input, { instructions })
          return
        }
        throw aiError
      }
    }

    // Filter is applied here, at the single point every streamed answer
    // passes through, so the student-facing side of the app can never
    // accidentally see unfiltered reasoning.
    yield* filterHiddenReasoning(rawStream())
  },

  /**
   * Helper for retry logic
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries <= 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.retryOperation(operation, retries - 1, delay * 2)
    }
  },

  /**
   * @deprecated Use generateAnswerFromChapterId instead
   */
  async generateAnswerFromPdfUrl(pdfUrl: string, variables: ChatbotVariables): Promise<string> {
    const promptType = PromptKeys.PROMPT_CHATBOT_ANSWER
    const setting = await settingsService.getSettingBasedOnKey(promptType)

    if (!setting) {
      throw new Error(`Prompt setting for ${promptType} not found.`)
    }

    // Ensure conversation_history and student_name have default values to avoid buildPrompt errors
    const processedVariables = {
      ...variables,
      conversation_history:
        variables.conversation_history || variables.history || 'No previous conversation history.',
      student_name: variables.student_name || 'Student',
    }

    const prompt = buildPrompt(promptType, setting.value, processedVariables)

    const answer = await openAIService.generateResultFromFile(pdfUrl, prompt)

    return stripHiddenReasoning(answer)
  },
}
