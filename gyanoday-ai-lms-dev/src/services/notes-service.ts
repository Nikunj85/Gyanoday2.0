import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface StudentNote {
  id: string
  user_id: string
  chapter_id: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
}

export const notesService = {
  async getNotes(userId: string): Promise<StudentNote[]> {
    const { data, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data || []) as StudentNote[]
  },

  /** One note per (user, chapter) — enforced by a partial unique index
   * (see settings_update.sql). Returns null if the student hasn't written
   * one for this chapter yet. */
  async getNoteForChapter(userId: string, chapterId: string): Promise<StudentNote | null> {
    const { data, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .maybeSingle()

    if (error) throw error
    return (data as StudentNote) || null
  },

  /** Creates or replaces the single note for this chapter — this is what
   * backs the "Save Notes" modal on a chapter row. */
  async upsertChapterNote(userId: string, chapterId: string, content: string, title?: string) {
    const { data, error } = await supabase
      .from('student_notes')
      .upsert(
        { user_id: userId, chapter_id: chapterId, title: title || '', content },
        { onConflict: 'user_id,chapter_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data as StudentNote
  },

  async createNote(userId: string, title: string, content: string, chapterId?: string | null) {
    const { data, error } = await supabase
      .from('student_notes')
      .insert([{ user_id: userId, title, content, chapter_id: chapterId || null }])
      .select()
      .single()

    if (error) throw error
    return data as StudentNote
  },

  async updateNote(id: string, updates: { title?: string; content?: string }) {
    const { data, error } = await supabase
      .from('student_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as StudentNote
  },

  async deleteNote(id: string) {
    const { error } = await supabase.from('student_notes').delete().eq('id', id)
    if (error) throw error
  },
}

