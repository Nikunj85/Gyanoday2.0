import { openAIService } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Chapter } from '@/types'

type ChapterWithRelations = Chapter & {
  subject?: { name: string; color_code?: string }
  class?: { name: string }
}

export const chapterServerService = {
  /**
   * Retrieves the file_id for a chapter, uploading the PDF to OpenAI only
   * if it hasn't been uploaded before (or forceRefresh is set).
   *
   * Accepts an optional pre-fetched `chapter` to avoid a duplicate DB round
   * trip when the caller already has it (e.g. the streaming routes fetch the
   * chapter once and pass it through).
   */
  async getOrUploadChapterFileId(
    chapterId: string,
    forceRefresh: boolean = false,
    prefetchedChapter?: ChapterWithRelations
  ): Promise<string> {
    const chapter = prefetchedChapter || (await this.getChapterById(chapterId))

    if (!chapter.pdf_url) {
      throw new Error('This chapter does not have an associated PDF document.')
    }

    if (chapter.file_id && !forceRefresh) {
      return chapter.file_id
    }

    let fileId: string
    try {
      fileId = await openAIService.uploadFile(chapter.pdf_url)
    } catch {
      throw new Error('Failed to upload the chapter document for AI processing.')
    }

    try {
      // IMPORTANT: uses the service-role client (bypasses RLS). This write
      // is server-triggered caching metadata, not user data — a student
      // asking a question must be able to trigger this cache write even
      // though students have no chapters-table UPDATE permission under RLS.
      // Using the RLS-bound client here (as an earlier version of this file
      // did) causes it to silently fail for every non-admin user, meaning
      // the cache NEVER persists and every single message re-uploads the
      // file from scratch — a real, serious performance bug, not a
      // harmless fallback.
      await supabaseAdmin.from('chapters').update({ file_id: fileId }).eq('id', chapterId)
    } catch {
      // Only a genuine transient/network failure lands here now.
    }

    return fileId
  },

  /**
   * Retrieves (creating if necessary) an OpenAI vector store containing the
   * chapter's PDF, for use with the `file_search` tool. This is what makes
   * chat/quiz generation fast: the model retrieves only the relevant
   * passages instead of re-reading the entire PDF on every request.
   *
   * The vector store is created ONCE per chapter and cached in
   * chapters.vector_store_id — every subsequent request is a fast lookup,
   * not a re-upload/re-index.
   */
  async getOrCreateChapterVectorStoreId(
    chapterId: string,
    forceRefresh: boolean = false,
    prefetchedChapter?: ChapterWithRelations
  ): Promise<string> {
    const chapter = prefetchedChapter || (await this.getChapterById(chapterId))

    if (chapter.vector_store_id && !forceRefresh) {
      return chapter.vector_store_id
    }

    const fileId = await this.getOrUploadChapterFileId(chapterId, false, chapter)

    const vectorStoreId = await openAIService.createVectorStoreForFile(fileId, `chapter-${chapterId}`)

    try {
      // Same service-role reasoning as above — this MUST succeed for
      // students, not just admins, or every message re-indexes from scratch.
      await supabaseAdmin
        .from('chapters')
        .update({ vector_store_id: vectorStoreId })
        .eq('id', chapterId)
    } catch {
      // Non-critical — still usable this request.
    }

    return vectorStoreId
  },

  /**
   * Fetches a chapter by ID with optional retry logic for improved reliability.
   */
  async getChapterById(
    id: string,
    retries: number = 0,
    delay: number = 1000
  ): Promise<ChapterWithRelations> {
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

      return data as ChapterWithRelations
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
