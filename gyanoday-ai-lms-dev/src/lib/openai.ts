import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'

type FilePromptWithSchema<T extends z.ZodTypeAny> = {
  pdfUrl?: string
  fileId?: string
  prompt: string
  schema: T
  schemaName: string
}

const models = {
  gpt4o: 'gpt-4o',
  gpt4oMini: 'gpt-4o-mini',
}

const defaultModel = models.gpt4o

export class OpenAIService {
  private openai: OpenAI | null = null

  private getClient(): OpenAI {
    if (this.openai) return this.openai

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in the environment variables.')
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    })

    return this.openai
  }

  /**
   * Creates an OpenAI vector store containing the given file and waits for
   * indexing to finish (createAndPoll). This is a one-time cost per chapter
   * (cached by the caller) — every subsequent question against the chapter
   * then uses fast retrieval instead of re-reading the whole document.
   */
  async createVectorStoreForFile(fileId: string, name: string): Promise<string> {
    const client = this.getClient()
    const store = await client.vectorStores.create({ name })
    await client.vectorStores.fileBatches.createAndPoll(store.id, {
      file_ids: [fileId],
    })
    return store.id
  }

  /**
   * Streaming answer using file_search retrieval instead of dumping the
   * whole document into context. This is the fast path — the model only
   * pulls in the passages relevant to the question, so it can start
   * generating output almost immediately instead of first "reading" the
   * entire chapter PDF on every request.
   */
  /**
   * Streaming answer using file_search retrieval, with the static
   * persona/rules kept in `instructions` (separate from the ever-changing
   * per-turn `input`). Providers cache the static prefix across turns in
   * the same conversation, cutting reprocessing time/cost — this is why
   * the persona text must stay byte-identical turn to turn, and only the
   * question/history goes in `input`.
   *
   * Uses gpt-4o-mini by default: a low-latency model variant, appropriate
   * here since Socratic replies are intentionally short (3-4 sentences),
   * not long-form generation where the larger model's extra depth matters
   * most (that's still used for quiz generation).
   */
  async *streamAnswerUsingFileSearch(
    vectorStoreId: string,
    input: string,
    options?: { instructions?: string; temperature?: number; model?: string }
  ): AsyncGenerator<string> {
    const client = this.getClient()
    const stream = await client.responses.create({
      model: options?.model || models.gpt4oMini,
      stream: true,
      temperature: options?.temperature ?? 0.2,
      instructions: options?.instructions,
      // Explicit, generous ceiling — the Socratic prompt asks for a
      // structured <internal_thought> before the visible reply, so this
      // rules out the reply ever being silently cut off mid-thought on a
      // longer turn.
      max_output_tokens: 1500,
      tools: [
        {
          type: 'file_search',
          vector_store_ids: [vectorStoreId],
          max_num_results: 8,
        },
      ],
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: input }],
        },
      ],
    })

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta' && 'delta' in event) {
        yield event.delta as string
      }
    }
  }

  /**
   * Streaming structured (schema-constrained) generation using file_search
   * retrieval. Yields raw text deltas as the model produces the JSON —
   * the caller is responsible for incrementally parsing them (see
   * IncrementalJsonArrayExtractor) to reveal individual items early, and for
   * doing a final full parse/validation once the stream completes.
   */
  async *streamStructuredUsingFileSearch<T extends z.ZodTypeAny>(
    vectorStoreId: string,
    prompt: string,
    schema: T,
    schemaName: string
  ): AsyncGenerator<string> {
    const client = this.getClient()
    const stream = await client.responses.create({
      model: models.gpt4o,
      stream: true,
      tools: [
        {
          type: 'file_search',
          vector_store_ids: [vectorStoreId],
          max_num_results: 8,
        },
      ],
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt }],
        },
      ],
      text: {
        format: zodTextFormat(schema, schemaName),
      },
    })

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta' && 'delta' in event) {
        yield event.delta as string
      }
    }
  }

  async uploadFile(pdfURL: string): Promise<string> {
    try {
      const client = this.getClient()
      const uploadedFile = await client.files.create({
        file: await fetch(pdfURL),
        purpose: 'assistants',
      })
      return uploadedFile.id
    } catch (error) {
      console.error('Error uploading file to OpenAI:', error)
      throw error
    }
  }

  /**
   * Streaming variant of generateResultFromFileId.
   * Yields text chunks as they arrive from OpenAI instead of waiting for the
   * full response, so the caller can forward each piece to the client
   * immediately (used for the chat "typed live" effect).
   */
  async *streamResultFromFileId(fileId: string, prompt: string): AsyncGenerator<string> {
    const client = this.getClient()
    const stream = await client.responses.create({
      model: models.gpt4o,
      stream: true,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_file',
              file_id: fileId,
            },
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
    })

    for await (const event of stream) {
      // The Responses API streaming protocol emits many event types
      // (response.created, response.output_text.delta, response.completed, ...).
      // We only care about the incremental text deltas.
      if (event.type === 'response.output_text.delta' && 'delta' in event) {
        yield event.delta as string
      }
    }
  }

  /**
   * Reads an image (as a data URL / base64 string) and asks the model to
   * transcribe any text visible in it. Used as the AI fallback step for OCR
   * when the free on-device engine produces low-confidence results.
   */
  async extractTextFromImage(imageDataUrl: string): Promise<string> {
    try {
      const client = this.getClient()
      const response = await client.responses.create({
        model: models.gpt4o,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  'Transcribe exactly the text visible in this image (handwritten or printed). ' +
                  'Return ONLY the transcribed text, with no extra commentary, no quotes, ' +
                  'and preserve line breaks and math notation as plain text where possible.',
              },
              {
                type: 'input_image',
                image_url: imageDataUrl,
                detail: 'high',
              },
            ],
          },
        ],
      })
      return (response.output_text || '').trim()
    } catch (error) {
      console.error('Error extracting text from image via AI OCR fallback:', error)
      throw error
    }
  }

  async generateResultFromFileId(fileId: string, prompt: string): Promise<string> {
    try {
      const client = this.getClient()
      const response = await client.responses.create({
        model: models.gpt4o,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                file_id: fileId,
              },
              {
                type: 'input_text',
                text: prompt,
              },
            ],
          },
        ],
      })
      return response.output_text || 'No summary generated.'
    } catch (error) {
      console.error('Error generating AI response from file ID:', error)
      throw error
    }
  }

  async generateResultFromFile(pdfURL: string, prompt: string): Promise<string> {
    try {
      const client = this.getClient()
      // 1️⃣ Upload PDF to OpenAI
      const uploadedFile = await client.files.create({
        file: await fetch(pdfURL),
        purpose: 'assistants',
      })

      // 2️⃣ Generate response using uploaded file
      const response = await client.responses.create({
        model: defaultModel,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                file_id: uploadedFile.id,
              },
              {
                type: 'input_text',
                text: prompt,
              },
            ],
          },
        ],
      })
      await this.getClient().files.delete(uploadedFile.id)
      return response.output_text || 'No summary generated.'
    } catch (error) {
      console.error('Error generating AI response from PDF:', error)
      throw error
    }
  }

  async generateResult(prompt: string): Promise<string> {
    try {
      const client = this.getClient()
      const response = await client.responses.create({
        model: defaultModel,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt,
              },
            ],
          },
        ],
      })

      return response.output_text || 'No summary generated.'
    } catch (error) {
      console.error('Error generating PDF summary:', error)
      throw error
    }
  }

  async generateResultWithSchema<T extends z.ZodTypeAny>(
    input: FilePromptWithSchema<T>
  ): Promise<z.infer<T>> {
    try {
      const client = this.getClient()
      let fileId = input.fileId

      // 1️⃣ Upload PDF to OpenAI if fileId is not provided
      if (!fileId) {
        if (!input.pdfUrl) {
          throw new Error('Either pdfUrl or fileId must be provided.')
        }
        const uploadedFile = await client.files.create({
          file: await fetch(input.pdfUrl),
          purpose: 'assistants',
        })
        fileId = uploadedFile.id
      }

      // 2️⃣ Generate response using fileId
      const response = await client.responses.parse({
        model: defaultModel,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                file_id: fileId,
              },
              {
                type: 'input_text',
                text: input.prompt,
              },
            ],
          },
        ],
        text: {
          format: zodTextFormat(input.schema, input.schemaName),
        },
      })

      if (!response.output_parsed) {
        throw new Error('OpenAI failed to parse the response into the requested schema.')
      }

      // 3️⃣ Only delete if we were the ones who uploaded it (no fileId provided)
      if (!input.fileId) {
        await this.getClient().files.delete(fileId)
      }

      // The OpenAI SDK infers this via its own internal InferZodType<T>,
      // which is structurally identical to our z.infer<T> but not provably
      // so to TypeScript across the two generic paths — safe cast, since
      // the null-check above already guarantees this is a real parsed value.
      return response.output_parsed as z.infer<T>
    } catch (error) {
      console.error('Error generating AI response with schema:', error)
      throw error
    }
  }



  async generateTextResultWithSchema<T extends z.ZodTypeAny>(
    prompt: string,
    schema: T,
    schemaName: string
  ): Promise<z.infer<T>> {
    try {
      const client = this.getClient()
      const response = await client.responses.parse({
        model: defaultModel,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt,
              },
            ],
          },
        ],
        text: {
          format: zodTextFormat(schema, schemaName),
        },
      })

            if (!response.output_parsed) {
        throw new Error('OpenAI failed to parse the response into the requested schema.')
      }

      return response.output_parsed as z.infer<T>
    } catch (error) {
      console.error('Error generating AI response with schema:', error)
      throw error
    }
  }
}

// Singleton instance
export const openAIService = new OpenAIService()
