import { createClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/types/users'

const supabase = createClient()

export const userService = {
  async getUsers({
    page = 1,
    pageSize = 10,
    search = '',
    statusFilter = null as boolean | null,
    classFilter = null as string | null,
  }) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        name,
        role,
        class_id,
        language,
        school_name,
        phone,
        is_active,
        created_at,
        class:classes(name)
        `,
        { count: 'exact' }
      )
      .eq('role', UserRole.Student) // Filtering for students as requested

    if (search && search.length >= 2) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (statusFilter !== null) {
      query = query.eq('is_active', statusFilter)
    }

    if (classFilter && classFilter !== 'all') {
      query = query.eq('class_id', classFilter)
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      data: (data || []).map((user: any) => ({
        ...user,
        class: user.class ? { name: user.class.name } : null,
      })) as User[],
      total: count || 0,
    }
  },

  async createUser(newUser: Omit<User, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('users').insert([newUser]).select().single()

    if (error) throw error
    return data
  },

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteUser(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id)

    if (error) throw error
    return true
  },
}
