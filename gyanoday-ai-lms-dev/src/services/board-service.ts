import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
export interface Board { id: string; name: string; code: string; is_active: boolean }

export const boardService = {
  async getAll(includeInactive = false): Promise<Board[]> {
    let query = supabase.from('boards').select('id,name,code,is_active').order('name')
    if (!includeInactive) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as Board[]
  },
  async create(input: { name: string; code: string }) {
    const { data, error } = await supabase.from('boards').insert({ name: input.name.trim(), code: input.code.trim().toUpperCase() }).select().single()
    if (error) throw error
    return data as Board
  },
  async update(id: string, input: { name: string; code: string; is_active: boolean }) {
    const { data, error } = await supabase.from('boards').update({ name: input.name.trim(), code: input.code.trim().toUpperCase(), is_active: input.is_active }).eq('id', id).select().single()
    if (error) throw error
    return data as Board
  },
  async remove(id: string) {
    const { error } = await supabase.from('boards').delete().eq('id', id)
    if (error) throw error
  },
}
