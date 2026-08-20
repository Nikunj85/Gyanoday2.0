'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { smartNotesAiService } from '@/services/ai/smart-notes-ai-service'

/**
 * Generates Smart Notes for a chapter and caches them on the `chapters`
 * row so the next student to open this chapter gets them instantly
 * instead of waiting on a fresh AI generation.
 *
 * This is triggered by any student opening the Smart Notes tab for a
 * chapter that doesn't have notes yet — it is NOT an admin content edit,
 * it's a system-level cache-fill (same category of write as caching a
 * chapter's `file_id`/`vector_store_id` in chapter-server-service.ts).
 * The `chapters` table's RLS only allows admins to UPDATE rows, so this
 * write goes through the service-role client (`supabaseAdmin`), the same
 * pattern already used for those other generated/cached columns — a
 * regular student session would have the RLS write silently rejected.
 */
export async function generateAndSaveSmartNotes(chapterId: string) {
  if (!chapterId) {
    throw new Error('Chapter ID is required')
  }

  const notes = await smartNotesAiService.generateSmartNotes(chapterId)

  const { error } = await supabaseAdmin
    .from('chapters')
    .update({ smart_notes: notes })
    .eq('id', chapterId)

  if (error) {
    throw new Error(`Failed to save Smart Notes: ${error.message}`)
  }

  return notes
}
