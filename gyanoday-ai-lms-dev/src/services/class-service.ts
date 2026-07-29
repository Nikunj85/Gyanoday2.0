import { createClient } from '@/lib/supabase/client'
import { Class } from '@/types'

const supabase = createClient()

export const classService = {
  async getClasses({
    page = 1,
    pageSize = 10,
    search = '',
    statusFilter = null as boolean | null,
    languageFilter = 'all' as string,
  }) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('classes').select(
      `
        id,
        name,
        order_num,
        is_active,
        language,
        created_at,
        updated_at,
        students:users(count)
        `,
      { count: 'exact' }
    )

    if (search && search.length >= 2) {
      query = query.ilike('name', `%${search}%`)
    }

    if (statusFilter !== null) {
      query = query.eq('is_active', statusFilter)
    }

    if (languageFilter !== 'all') {
      query = query.eq('language', languageFilter)
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('order_num', { ascending: true })

    if (error) throw error

    return {
      data: (data || []).map((cls: any) => ({
        ...cls,
        students_count: cls.students?.[0]?.count || 0,
      })) as (Class & { students_count: number })[],
      total: count || 0,
    }
  },

  async createClass(newClass: Omit<Class, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('classes').insert([newClass]).select().single()

    if (error) throw error
    return data
  },

  async updateClass(id: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteClass(id: string) {
    const { error } = await supabase.from('classes').delete().eq('id', id)

    if (error) throw error
    return true
  },

  async reorderClasses(orders: { id: string; order_num: number }[]) {
    // Supabase doesn't support bulk updates easily with different values in a single query via JS client
    // unless using a RPC or multiple promises. For simplicity and since classes are few, we'll use multiple promises or a loop.
    // However, the best way for performance is a single RPC.
    // For now, let's use a loop or multiple calls if the list is small.

    const promises = orders.map((item) =>
      supabase.from('classes').update({ order_num: item.order_num }).eq('id', item.id)
    )

    const results = await Promise.all(promises)
    const error = results.find((r) => r.error)?.error
    if (error) throw error
    return true
  },
}
