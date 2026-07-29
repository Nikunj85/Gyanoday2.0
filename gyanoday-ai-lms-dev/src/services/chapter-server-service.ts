import { openAIService } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { Chapter } from '@/types'

export const chapterServerService = {
  /**
   * Retrieves the file_id for a chapter.
   * If the file_id is missing or forceRefresh is true, it uploads the PDF to OpenAI and saves the new file_id.
   */
  async getOrUploadChapterFileId(
    chapterId: string,
    forceRefresh: boolean = false
  ): Promise<string> {
    try {
      // 1. Fetch chapter details
      const chapter = await this.getChapterById(chapterId)

      if (!chapter.pdf_url) {
        throw new Error('This chapter does not have an associated PDF document.')
      }

      // 2. Return existing file_id if available AND not forcing refresh
      if (chapter.file_id && !forceRefresh) {
        return chapter.file_id
      }

      // 3. Upload file if file_id is missing or forcing refresh
      let fileId: string
      try {
        fileId = await openAIService.uploadFile(chapter.pdf_url)
      } catch (uploadError) {
        throw new Error('Failed to upload the chapter document for AI processing.')
      }

      // 4. Save the new file_id using admin client (bypassing RLS)
      try {
        const supabaseAdmin = await createClient()
        const { error } = await supabaseAdmin
          .from('chapters')
          .update({ file_id: fileId })
          .eq('id', chapterId)
      } catch (dbError) {
        // Silent failure for DB update (non-critical)
      }

      return fileId
    } catch (error) {
      throw error
    }
  },

  /**
   * Fetches a chapter by ID with optional retry logic for improved reliability.
   */
  async getChapterById(
    id: string,
    retries: number = 0,
    delay: number = 1000
  ): Promise<
    Chapter & { subject?: { name: string; color_code?: string }; class?: { name: string } }
  > {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*, subject:subjects(name, color_code), class:classes(name)')
        .eq('id', id)
        .single()

      if (error) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
          return this.getChapterById(id, retries - 1, delay * 2)
        }
        throw new Error(`Failed to fetch chapter details: ${error.message}`)
      }

      return data as Chapter & {
        subject?: { name: string; color_code?: string }
        class?: { name: string }
      }
    } catch (error) {
      if (retries > 0) {
        console.warn(
          `[ChapterServerService] Exception occurred for chapter ${id}, retrying... (${retries} left)`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.getChapterById(id, retries - 1, delay * 2)
      }
      throw error
    }
  },
}
