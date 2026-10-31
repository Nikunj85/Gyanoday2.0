import { languageEnforcement, languageLabel } from '@/lib/ai/language'
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

/**
 * Questions about the WHOLE chapter (summary, overview, story, "explain this chapter"...) in
 * English / Hindi / Gujarati / Hinglish. A keyword search can't retrieve "the whole chapter",
 * so these are answered from the full PDF instead of a handful of retrieved passages.
 */
const WHOLE_CHAPTER_PATTERN = new RegExp(
  [
    'summar', 'overview', 'recap', 'revis', 'gist', 'in short', 'short me', 'short mein',
    '(whole|entire|full|complete|poora|pura|puri|pure)\\s+(chapter|lesson|paath|path)',
    '(explain|samjh|samajh|batao|bata)\\w*\\s+(the\\s+|this\\s+|is\\s+|ye\\s+|yeh\\s+)?(chapter|lesson|paath|path)\\b',
    '(chapter|lesson|paath)\\s+(ka|ki|ke|nu|na)\\b', 'about (this|the) chapter', 'story', 'kahani', 'kahaani',
    'saransh', 'sar\\s?ansh', 'sankshep', 'सारांश', 'संक्षेप', 'पूरा', 'पूरे', 'कहानी', 'अध्याय का',
    'સારાંશ', 'સાર\\b', 'આખો', 'પૂરો', 'વાર્તા', 'પાઠનો',
  ].join('|'),
  'i'
)

export function isWholeChapterQuestion(question: string | undefined): boolean {
  return !!question && WHOLE_CHAPTER_PATTERN.test(question)
}

/** Chapters whose PDF yields no searchable text (scanned). Skips file_search for them until restart. */
const chaptersWithoutSearchableText = new Set<string>()

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
      // Always a readable label ("Hindi"), never a raw code ("hi") in the prompt.
      language: languageLabel(variables.language),
      conversation_history: variables.conversation_history || 'No previous conversation history.',
      student_name: variables.student_name || 'Student',
    }

    // 2. Build prompt
    const prompt = buildPrompt(promptType, setting.value, processedVariables) + languageEnforcement(languageLabel(processedVariables.language), 'text')
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
      // Always a readable label ("Hindi"), never a raw code ("hi") in the prompt.
      language: languageLabel(variables.language),
      conversation_history: variables.conversation_history || 'No previous conversation history.',
      student_name: variables.student_name || 'Student',
    }

    // Three independent lookups, run in parallel — this, plus the
    // vector-store cache being fixed to actually persist (see
    // chapter-server-service.ts), is most of what "time to first token"
    // was going toward.
    const [chapter, systemSetting, turnSetting] = await Promise.all([
      prefetchedChapter
        ? Promise.resolve(prefetchedChapter)
        : chapterServerService.getChapterById(chapterId),
      settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_SOCRATIC_TUTOR_SYSTEM),
      settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_CHATBOT_ANSWER),
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
    }) + languageEnforcement(languageLabel(processedVariables.language), 'text') +
      `\n\nRESPONSE LANGUAGE POLICY (MANDATORY): The required answer language is ${processedVariables.language}, because this is a ${chapter.subject?.name || 'subject'} chapter. ` +
      `The student may type the question in English, Hindi, Gujarati or Hinglish (Hindi/Gujarati written in Latin letters) - understand it in any of these, but NEVER use the question's language to choose the answer language. ` +
      `Always answer in ${processedVariables.language}${processedVariables.language === 'Hindi' ? ' using natural Devanagari script' : processedVariables.language === 'Gujarati' ? ' using natural Gujarati script' : ' using natural English'}, even if the student writes or asks you to switch to another language. ` +
      `Do not transliterate, and do not produce generic answers unrelated to the retrieved chapter.` +
      `\n\nRETRIEVAL RULE (MANDATORY): Before answering, search the chapter document. The document is in the chapter's own language, so search using the chapter title and the key topic words of the question translated into that language as well as in English. ` +
      `Only say the information is missing if the search genuinely returned nothing relevant; broad questions such as "what is the story / summary of this chapter" must be answered from the retrieved passages.` +
      `\n\nACCESS RULE (MANDATORY): The chapter document is available to you in this conversation. NEVER say that you do not have access to the chapter or its content; if a detail is truly absent from it, say that only that specific detail is not covered in this chapter and help with what is covered.` +
      `\n\nMATH & CHEMISTRY FORMATTING (MANDATORY): Write math as LaTeX inside $...$ (inline) or $$...$$ (own line). ` +
      `Write EVERY chemical formula and chemical equation with mhchem inside $...$ or $$...$$, e.g. $$\\ce{2H2 + O2 -> 2H2O}$$, $\\ce{CO2}$, $\\ce{H2SO4}$, $$\\ce{CaCO3 ->[\\Delta] CaO + CO2 ^}$$, with state symbols such as $\\ce{NaCl(aq)}$ and reversible reactions written with <=>. ` +
      `Always balance equations and put each important equation on its own line. Never write equations as plain text such as H2O or H2 + O2 -> H2O, never use Unicode subscripts, and never put equations in code blocks.`

    // DYNAMIC part — only the actual question and conversation history,
    // which genuinely change every turn.
    const input =
      buildPrompt(PromptKeys.PROMPT_CHATBOT_ANSWER, turnSetting.value, processedVariables) +
      `\n\n[Context] Chapter: "${chapter.title}" | Subject: ${chapter.subject?.name || ''} | Answer language: ${processedVariables.language}`

    // Raw model output — still wrapped in <internal_thought> /
    // <student_facing_response> tags per the system prompt's schema.
    // Uses file_search retrieval (fast — only relevant passages are pulled
    // in) instead of re-reading the entire chapter PDF on every message.
    async function* rawStream(): AsyncGenerator<string> {
      const chapterRow = prefetchedChapter || chapter
      const hadCachedStore = !!chapterRow.vector_store_id
      let emittedAnyChunk = false

      // Search the chapter index. Returns false when the index has no usable text (stale / failed
      // index, or a scanned PDF) so the caller can read the PDF file directly instead.
      async function* searchStore(storeId: string): AsyncGenerator<string> {
        for await (const chunk of openAIService.streamAnswerUsingFileSearch(storeId, input, { instructions })) {
          emittedAnyChunk = true
          yield chunk
        }
      }

      const wholeChapter = isWholeChapterQuestion(processedVariables.question)

      if (!wholeChapter && !chaptersWithoutSearchableText.has(chapterId)) {
        try {
          let storeId: string | null = null
          try {
            storeId = await chapterServerService.getOrCreateChapterVectorStoreId(chapterId, false, chapterRow)
          } catch (error) {
            console.error('[ChatbotAiService] Vector-store setup failed; using direct chapter file:', error)
          }

          if (storeId) {
            try {
              yield* searchStore(storeId)
              if (emittedAnyChunk) return
              console.error('[ChatbotAiService] File search returned an empty response; falling back to direct PDF file.')
            } catch (aiError: any) {
              if (emittedAnyChunk) throw aiError
              const message = aiError?.message || String(aiError || '')
              console.error('[ChatbotAiService] File-search failed:', message)
              const staleOrEmpty =
                message === 'FILE_SEARCH_EMPTY' ||
                message.includes('404') ||
                message.includes('vector_store') ||
                message.includes('not found')
              if (staleOrEmpty && hadCachedStore) {
                // The saved index may be stale or built from a failed upload: rebuild it once.
                try {
                  const refreshedId = await chapterServerService.getOrCreateChapterVectorStoreId(chapterId, true, chapterRow)
                  yield* searchStore(refreshedId)
                  if (emittedAnyChunk) return
                } catch (refreshError: any) {
                  if (emittedAnyChunk) throw refreshError
                  console.error('[ChatbotAiService] Rebuilt index also unusable:', refreshError?.message || refreshError)
                  if (refreshError?.message === 'FILE_SEARCH_EMPTY') chaptersWithoutSearchableText.add(chapterId)
                }
              } else if (message === 'FILE_SEARCH_EMPTY') {
                // Fresh index and still nothing -> the PDF has no extractable text (scanned images).
                chaptersWithoutSearchableText.add(chapterId)
              }
            }
          }
        } catch (outer) {
          if (emittedAnyChunk) throw outer
        }
      }

      // Direct read of the PDF (handles scanned / image-only pages as well).
      const fileId = await chapterServerService.getOrUploadChapterFileId(chapterId, false, chapterRow)
      const wholeChapterNote = wholeChapter
        ? `\n\nThe student is asking about the WHOLE chapter. Read the entire attached document and give a complete, well-structured answer (main ideas in order, key terms, people/events or concepts, and any formulas/equations). Do not say you lack access.`
        : ''
      const directInput = `${input}${wholeChapterNote}\n\nAnswer only from the attached chapter document. If a specific detail is not present, say only that detail is not covered. Reply in ${processedVariables.language}.`
      yield* openAIService.streamResultFromFileId(fileId, `${instructions}\n\n${directInput}`)
    }

    // Filter is applied here, at the single point every streamed answer
    // passes through, so the student-facing side of the app can never
    // accidentally see unfiltered reasoning.
    //
    // RELIABILITY NOTE: the model is instructed to always start with
    // <internal_thought>. If generation gets cut off or malformed before
    // it ever reaches <student_facing_response>, the filter has nothing
    // safe to show — and previously that meant the student saw a
    // generic, unexplained "an error occurred" with zero chunks streamed.
    // Since NOTHING has been sent to the client yet in that case, it's
    // always safe to retry the whole generation once before giving up.
    let yieldedAnything = false
    for await (const chunk of filterHiddenReasoning(rawStream())) {
      yieldedAnything = true
      yield chunk
    }

    if (!yieldedAnything) {
      let retryYieldedAnything = false
      for await (const chunk of filterHiddenReasoning(rawStream())) {
        retryYieldedAnything = true
        yield chunk
      }

      if (!retryYieldedAnything) {
        yield "Sorry, I had trouble putting together a reply just now — could you ask that again?"
      }
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
      // Always a readable label ("Hindi"), never a raw code ("hi") in the prompt.
      language: languageLabel(variables.language),
      conversation_history:
        variables.conversation_history || variables.history || 'No previous conversation history.',
      student_name: variables.student_name || 'Student',
    }

    const prompt = buildPrompt(promptType, setting.value, processedVariables)

    const answer = await openAIService.generateResultFromFile(pdfUrl, prompt)

    return stripHiddenReasoning(answer)
  },
}