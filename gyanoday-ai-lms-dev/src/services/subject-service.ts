import { createClient } from '@/lib/supabase/client'
import { getEquivalentClassIds, normalizeMedium } from '@/lib/class-utils'
import { Subject } from '@/types/subjects'

const supabase = createClient()

export const subjectService = {
  async getSubjects({
    page = 1,
    pageSize = 10,
    search = '',
    statusFilter = null as boolean | null,
    languageFilter = 'all' as string,
    classFilter = null as string | null,
    boardFilter = null as string | null,
    isAdmin = false as boolean, // Add admin flag
    // Student side: chapter.language identifies the curriculum medium.
    // AI output language is resolved separately from the subject name, so an
    // English subject in Gujarati-medium curriculum still remains visible.
    chapterLanguage = null as string | null,
  }) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Different query for admin vs student
    let query = supabase
      .from('subjects')
      .select(
        isAdmin
          ? 'id, name, language, board_id, board:boards(name), order_num, is_active, created_at, image_url, color_code'
          : 'id, name, language, board_id, board:boards(name), order_num, is_active, created_at, image_url, color_code, chapters!inner(class_id, language, is_visible)',
        { count: 'exact' }
      )
    if (search && search.trim().length > 0) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    if (statusFilter !== null) {
      query = query.eq('is_active', statusFilter)
    }

    if (languageFilter !== 'all') {
      query = query.eq('language', languageFilter)
    }
    if (!isAdmin && boardFilter) query = query.or(`board_id.eq.${boardFilter},board_id.is.null`)

    if (!isAdmin && chapterLanguage) {
      // Student side: same-named classes of every medium count as "my class"...
      if (classFilter) {
        const classIds = await getEquivalentClassIds(supabase, classFilter)
        query = query.in('chapters.class_id', classIds)
      }
      // ...and the chapter's language picks the medium.
      query = query.eq('chapters.is_visible', true)
    } else if (classFilter) {
      query = query.eq('chapters.class_id', classFilter)
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('order_num', { ascending: true })

    if (error) throw error

    let results: any[] = data || []
    if (!isAdmin && chapterLanguage) {
      const medium = normalizeMedium(chapterLanguage)
      results = results
        .map((subject) => {
          // `chapters.language` stores the medium/class curriculum (EN/HI/GU),
          // not necessarily the language in which this subject must be taught.
          // For example, a Gujarati-medium student's English subject has GU
          // chapters but AI-generated explanations must still be English.
          const matching = (subject.chapters || []).filter((chapter: any) => {
            const chapterMedium = normalizeMedium(chapter.language || 'en')
            return chapterMedium === medium || (!chapter.language && medium === 'en')
          })
          return { ...subject, chapters: matching }
        })
        .filter((subject) => (subject.chapters || []).length > 0)
    }

    return {
      data: results as Subject[],
      total: results.length === (data || []).length ? (count || 0) : results.length,
    }
  },

  async createSubject(newSubject: Omit<Subject, 'id' | 'created_at'>) {
    // Check for duplicates
    let duplicateQuery = supabase.from('subjects').select('id, name').eq('name', newSubject.name).eq('language', newSubject.language)
    duplicateQuery = newSubject.board_id ? duplicateQuery.eq('board_id', newSubject.board_id) : duplicateQuery.is('board_id', null)
    const { data: existing } = await duplicateQuery.maybeSingle()

    if (existing) {
      throw new Error(`A subject named "${newSubject.name}" already exists for this language.`)
    }

    const { data, error } = await supabase.from('subjects').insert([newSubject]).select().single()

    if (error) throw error
    return data
  },

  async updateSubject(id: string, updates: Partial<Subject>) {
    // Check for duplicates if name or language is being updated
    if (updates.name || updates.language || updates.board_id !== undefined) {
      // Get current subject data
      const { data: currentSubject } = await supabase
        .from('subjects')
        .select('name, language, board_id')
        .eq('id', id)
        .single()

      if (!currentSubject) {
        throw new Error('Subject not found')
      }

      const finalName = updates.name || currentSubject.name
      const finalLanguage = updates.language || currentSubject.language
      const finalBoardId = updates.board_id !== undefined ? updates.board_id : (currentSubject as any).board_id

      // Check if another subject exists with the same name and language
      let duplicateQuery = supabase.from('subjects').select('id, name').eq('name', finalName).eq('language', finalLanguage).neq('id', id)
      duplicateQuery = finalBoardId ? duplicateQuery.eq('board_id', finalBoardId) : duplicateQuery.is('board_id', null)
      const { data: existing } = await duplicateQuery.maybeSingle()

      if (existing) {
        throw new Error(`A subject named "${finalName}" already exists for this language.`)
      }
    }

    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteSubject(id: string) {
    const { error } = await supabase.from('subjects').delete().eq('id', id)

    if (error) throw error
    return true
  },

  async reorderSubjects(orders: { id: string; order_num: number }[]) {
    const promises = orders.map((item) =>
      supabase.from('subjects').update({ order_num: item.order_num }).eq('id', item.id)
    )

    const results = await Promise.all(promises)
    const error = results.find((r) => r.error)?.error
    if (error) throw error
    return true
  },

  async getAll() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data as Subject[]
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single()

    if (error) throw error
    return data as Subject
  },
}
