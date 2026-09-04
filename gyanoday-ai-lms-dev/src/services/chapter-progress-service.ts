import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export const chapterProgressService = {
  /**
   * Flips the student's manual "mark for revision" star on a chapter.
   * Upserts into user_chapter_progress since that's already the
   * one-row-per-(user,chapter) table with the right RLS — a student may
   * not have a progress row yet for a chapter they haven't completed, so
   * this can't assume the row already exists.
   */
  async setNeedsRevision(userId: string, chapterId: string, needsRevision: boolean) {
    const { error } = await supabase
      .from('user_chapter_progress')
      .upsert(
        { user_id: userId, chapter_id: chapterId, needs_revision: needsRevision },
        { onConflict: 'user_id,chapter_id' }
      )

    if (error) throw error
  },
}
