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

      return response.output_parsed
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

      return response.output_parsed
    } catch (error) {
      console.error('Error generating AI response with schema:', error)
      throw error
    }
  }
}

// Singleton instance
export const openAIService = new OpenAIService()
