import { createClient } from '@/lib/supabase/client'
import { UserChapterProgress } from '@/types'

const supabase = createClient()

export const userProgressService = {
  async getProgress(userId: string, chapterIds: string[]) {
    if (!chapterIds.length) return []

    const { data, error } = await supabase
      .from('user_chapter_progress')
      .select('*')
      .eq('user_id', userId)
      .in('chapter_id', chapterIds)

    if (error) throw error
    return data as UserChapterProgress[]
  },
  async getAllUserProgress(userId: string, client?: any) {
    const currentClient = client || supabase
    const { data, error } = await currentClient
      .from('user_chapter_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data as UserChapterProgress[]
  },

  async toggleCompletion(userId: string, chapterId: string, isCompleted: boolean) {
    const { data: existing } = await supabase
      .from('user_chapter_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('user_chapter_progress')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from('user_chapter_progress').insert([
        {
          user_id: userId,
          chapter_id: chapterId,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        },
      ])

      if (error) throw error
    }
  },
}
