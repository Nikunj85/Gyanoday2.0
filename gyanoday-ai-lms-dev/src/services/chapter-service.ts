import { createClient } from '@/lib/supabase/client'
import {
  chapterLanguageFilter,
  getEquivalentClassIds,
  normalizeMedium,
} from '@/lib/class-utils'
import { Chapter } from '@/types'

const supabase = createClient()

export const chapterService = {
  async getAll(subjectId?: string) {
    let query = supabase.from('chapters').select('*, board:boards(name)')

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
      .select(
        '*, subject:subjects(name, color_code, language), class:classes(name), board:boards(name)'
      )
      .eq('id', id)
      .single()

    if (error) throw error

    return data as Chapter & {
      subject?: {
        name: string
        color_code?: string
        language?: string
      }
      class?: { name: string }
      board?: { name: string }
    }
  },

  async getChapters({
    page = 1,
    pageSize = 10,
    search = '',
    subjectId = null,
    classId = null,
    classIds = null,
    boardId = null,
    isVisibleFilter = null,
    languageFilter = 'all',
    client = null,
  }: {
    page?: number
    pageSize?: number
    search?: string
    subjectId?: string | null
    classId?: string | null
    /** Several class rows treated as one class (same class name, different medium). */
    classIds?: string[] | null
    boardId?: string | null
    isVisibleFilter?: boolean | null
    languageFilter?: string
    client?: any
  }) {
    const currentClient = client || supabase

    let query = currentClient
      .from('chapters')
      .select(
        '*, subject:subjects(name), class:classes(name), board:boards(name)',
        { count: 'exact' }
      )

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (isVisibleFilter !== null) {
      query = query.eq('is_visible', isVisibleFilter)
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }

    if (classIds && classIds.length > 0) {
      query = query.in('class_id', classIds)
    } else if (classId) {
      query = query.eq('class_id', classId)
    }

    if (boardId) {
      query = query.or(`board_id.eq.${boardId},board_id.is.null`)
    }

    // Avoid adding a second .or(), which would replace the board filter.
    // Apply the language filter to fetched rows below when a board is selected.
    if (languageFilter && languageFilter !== 'all' && !boardId) {
      query = query.or(chapterLanguageFilter(languageFilter))
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await query
      .order('order_num', { ascending: true })
      .order('created_at', { ascending: true })
      .range(start, end)

    if (error) throw error

    let rows: any[] = data || []

    if (languageFilter && languageFilter !== 'all') {
      const medium = normalizeMedium(languageFilter)

      rows = rows.filter((chapter: any) => {
        const chapterMedium = normalizeMedium(chapter.language || 'en')
        return (
          chapterMedium === medium ||
          (!chapter.language && medium === 'en')
        )
      })
    }

    return {
      data: rows as (Chapter & {
        subject?: { name: string }
        class?: { name: string }
        board?: { name: string }
      })[],
      total: languageFilter !== 'all' ? rows.length : count || 0,
    }
  },

  async create(
    newChapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('chapters')
      .insert([newChapter])
      .select()
      .single()

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
    // Get the chapter to find its PDF URL.
    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('pdf_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching chapter for deletion:', fetchError)
    }

    // Delete the PDF from storage if it exists.
    if (chapter?.pdf_url) {
      try {
        const urlParts = chapter.pdf_url.split('/chapter-pdfs/')

        if (urlParts.length > 1) {
          const filePath = urlParts[1]

          const { error: storageError } = await supabase.storage
            .from('chapter-pdfs')
            .remove([decodeURIComponent(filePath)])

          if (storageError) {
            console.error(
              'Error deleting file from storage:',
              storageError
            )
          }
        }
      } catch (error) {
        console.error('Error processing file deletion:', error)
      }
    }

    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  async reorder(orders: { id: string; order_num: number }[]) {
    const promises = orders.map((item) =>
      supabase
        .from('chapters')
        .update({ order_num: item.order_num })
        .eq('id', item.id)
    )

    const results = await Promise.all(promises)
    const error = results.find((result) => result.error)?.error

    if (error) throw error
    return true
  },

  async getSubjectProgress(
    userId: string,
    subjectIds: string[],
    classId?: string | null,
    language?: string | null,
    boardId?: string | null
  ) {
    if (!subjectIds.length) return {}

    // Fetch visible chapters for the requested subjects.
    let query = supabase
      .from('chapters')
      .select('id, subject_id, language, board_id, subject:subjects(name)')
      .in('subject_id', subjectIds)
      .eq('is_visible', true)

    if (classId) {
      query = query.in(
        'class_id',
        await getEquivalentClassIds(supabase, classId)
      )
    }

    if (boardId) {
      query = query.or(`board_id.eq.${boardId},board_id.is.null`)
    }

    const { data: fetchedChapters, error: chaptersError } = await query

    if (chaptersError) throw chaptersError

    // `chapters.language` stores the curriculum MEDIUM (en/hi/gu) the chapter belongs to,
    // not the language the subject is taught in. A Gujarati-medium student's English or
    // Hindi subject therefore has `gu` chapters. Filter by the student's medium only
    // (same rule as subjectService.getSubjects) - never by the subject's own language.
    const studentMedium = normalizeMedium(language || 'en')

    const allChapters = (fetchedChapters || []).filter((chapter: any) => {
      const chapterMedium = normalizeMedium(chapter.language || 'en')
      return chapterMedium === studentMedium
    })

    // Fetch completed chapters for this user.
    const chapterIds = allChapters.map(
      (chapter: { id: string }) => chapter.id
    )

    let completedProgress: { chapter_id: string }[] = []

    if (chapterIds.length > 0) {
      const { data, error: progressError } = await supabase
        .from('user_chapter_progress')
        .select('chapter_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('chapter_id', chapterIds)

      if (progressError) throw progressError
      completedProgress = data || []
    }

    // Initialize progress for each requested subject.
    const progressMap: Record<
      string,
      { total: number; completed: number }
    > = {}

    subjectIds.forEach((id) => {
      progressMap[id] = { total: 0, completed: 0 }
    })

    // Count all matching chapters.
    allChapters.forEach(
      (chapter: { id: string; subject_id: string }) => {
        if (progressMap[chapter.subject_id]) {
          progressMap[chapter.subject_id].total++
        }
      }
    )

    // Map chapter IDs to their subject IDs.
    const chapterSubjectMap = new Map<string, string>()

    allChapters.forEach(
      (chapter: { id: string; subject_id: string }) => {
        chapterSubjectMap.set(chapter.id, chapter.subject_id)
      }
    )

    // Count completed chapters.
    completedProgress.forEach((progress) => {
      const subjectId = chapterSubjectMap.get(progress.chapter_id)

      if (subjectId && progressMap[subjectId]) {
        progressMap[subjectId].completed++
      }
    })

    return progressMap
  },
}