import { buildPrompt } from '@/lib/ai/promptUtils'
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
      return await openAIService.generateResultFromFileId(fileId, prompt)
    } catch (aiError: any) {
      // Check for specific "404 Files ... were not found" error from OpenAI
      const errorMessage = aiError?.message || aiError?.toString() || ''

      if (errorMessage.includes('404') && errorMessage.includes('File')) {
        // File missing on OpenAI side (deleted?), force re-upload and update DB
        const newFileId = await chapterServerService.getOrUploadChapterFileId(chapterId, true)
        return await openAIService.generateResultFromFileId(newFileId, prompt)
      }

      throw aiError
    }
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

    return answer
  },
}
