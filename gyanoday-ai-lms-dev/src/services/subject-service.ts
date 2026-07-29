import { createClient } from '@/lib/supabase/client'
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
    isAdmin = false as boolean, // Add admin flag
  }) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Different query for admin vs student
    let query = supabase
      .from('subjects')
      .select(
        isAdmin
          ? 'id, name, language, order_num, is_active, created_at, image_url, color_code'
          : 'id, name, language, order_num, is_active, created_at, image_url, color_code, chapters!inner(class_id)',
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

    if (classFilter) {
      query = query.eq('chapters.class_id', classFilter)
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('order_num', { ascending: true })

    if (error) throw error

    return {
      data: (data || []) as Subject[],
      total: count || 0,
    }
  },

  async createSubject(newSubject: Omit<Subject, 'id' | 'created_at'>) {
    // Check for duplicates
    const { data: existing } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('name', newSubject.name)
      .eq('language', newSubject.language)
      .maybeSingle()

    if (existing) {
      throw new Error(`A subject named "${newSubject.name}" already exists for this language.`)
    }

    const { data, error } = await supabase.from('subjects').insert([newSubject]).select().single()

    if (error) throw error
    return data
  },

  async updateSubject(id: string, updates: Partial<Subject>) {
    // Check for duplicates if name or language is being updated
    if (updates.name || updates.language) {
      // Get current subject data
      const { data: currentSubject } = await supabase
        .from('subjects')
        .select('name, language')
        .eq('id', id)
        .single()

      if (!currentSubject) {
        throw new Error('Subject not found')
      }

      const finalName = updates.name || currentSubject.name
      const finalLanguage = updates.language || currentSubject.language

      // Check if another subject exists with the same name and language
      const { data: existing } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('name', finalName)
        .eq('language', finalLanguage)
        .neq('id', id)
        .maybeSingle()

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
