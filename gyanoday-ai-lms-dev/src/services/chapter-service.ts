import { createClient } from '@/lib/supabase/client'
import { Chapter } from '@/types'

const supabase = createClient()

export const chapterService = {
  async getAll(subjectId?: string) {
    let query = supabase.from('chapters').select('*')

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }

    const { data, error } = await query
      .order('order_num', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Chapter[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('chapters')
      .select('*, subject:subjects(name, color_code), class:classes(name)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Chapter & {
      subject?: { name: string; color_code?: string }
      class?: { name: string }
    }
  },

  async getChapters({
    page = 1,
    pageSize = 10,
    search = '',
    subjectId = null,
    classId = null,
    isVisibleFilter = null,
    languageFilter = 'all',
    client = null,
  }: {
    page?: number
    pageSize?: number
    search?: string
    subjectId?: string | null
    classId?: string | null
    isVisibleFilter?: boolean | null
    languageFilter?: string
    client?: any
  }) {
    const currentClient = client || supabase
    let query = currentClient
      .from('chapters')
      .select('*, subject:subjects(name), class:classes(name)', { count: 'exact' })

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (isVisibleFilter !== null) {
      query = query.eq('is_visible', isVisibleFilter)
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }

    if (classId) {
      query = query.eq('class_id', classId)
    }

    if (languageFilter && languageFilter !== 'all') {
      query = query.eq('language', languageFilter)
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await query
      .order('order_num', { ascending: true })
      .order('created_at', { ascending: true })
      .range(start, end)

    if (error) throw error

    return {
      data: data as (Chapter & { subject?: { name: string }; class?: { name: string } })[],
      total: count || 0,
    }
  },

  async create(newChapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('chapters').insert([newChapter]).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Chapter>) {
    const { data, error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    // 1. Get the chapter to find the PDF URL
    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('pdf_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching chapter for deletion:', fetchError)
      // If chapter not found, we can't delete it anyway, but let's proceed to try deleting by ID just in case
    }

    // 2. If there is a PDF, delete it from storage
    if (chapter?.pdf_url) {
      try {
        // Extract path from URL.
        // Expected format: .../storage/v1/object/public/chapter-pdfs/folder/file.pdf
        const urlParts = chapter.pdf_url.split('/chapter-pdfs/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]

          const { error: storageError } = await supabase.storage
            .from('chapter-pdfs')
            .remove([decodeURIComponent(filePath)])

          if (storageError) {
            console.error('Error deleting file from storage:', storageError)
          }
        }
      } catch (e) {
        console.error('Error processing file deletion:', e)
      }
    }

    const { error } = await supabase.from('chapters').delete().eq('id', id)

    if (error) throw error
    return true
  },

  async reorder(orders: { id: string; order_num: number }[]) {
    const promises = orders.map((item) =>
      supabase.from('chapters').update({ order_num: item.order_num }).eq('id', item.id)
    )

    const results = await Promise.all(promises)
    const error = results.find((r) => r.error)?.error
    if (error) throw error
    return true
  },

  async getSubjectProgress(userId: string, subjectIds: string[], classId?: string | null) {
    if (!subjectIds.length) return {}

    // 1. Get all chapters for these subjects to count totals
    let query = supabase
      .from('chapters')
      .select('id, subject_id')
      .in('subject_id', subjectIds)
      .eq('is_visible', true)

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data: allChapters, error: chaptersError } = await query

    if (chaptersError) throw chaptersError

    // 2. Get user's completed chapters
    const { data: completedProgress, error: progressError } = await supabase
      .from('user_chapter_progress')
      .select('chapter_id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('chapter_id', allChapters?.map((c: { id: string }) => c.id) || [])

    if (progressError) throw progressError

    // 3. Aggregate results
    const progressMap: Record<string, { total: number; completed: number }> = {}

    // Initialize map
    subjectIds.forEach((id) => {
      progressMap[id] = { total: 0, completed: 0 }
    })

    // Count totals
    allChapters?.forEach((chapter: { id: string; subject_id: string }) => {
      if (progressMap[chapter.subject_id]) {
        progressMap[chapter.subject_id].total++
      }
    })

    // Count completed (need to map back to subject)
    // Create a lookup for chapter -> subject
    const chapterSubjectMap = new Map<string, string>()
    allChapters?.forEach((c: { id: string; subject_id: string }) => {
      chapterSubjectMap.set(c.id, c.subject_id)
    })

    completedProgress?.forEach((p: { chapter_id: string }) => {
      const subjectId = chapterSubjectMap.get(p.chapter_id)
      if (subjectId && progressMap[subjectId]) {
        progressMap[subjectId].completed++
      }
    })

    return progressMap
  },
}
