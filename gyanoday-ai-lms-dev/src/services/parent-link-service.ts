import { createClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/types/users'

const supabase = createClient()

export interface ParentLink {
  id: string
  parent_id: string
  student_id: string
  created_at: string
  parent: { id: string; name: string; email: string } | null
  student: { id: string; name: string; email: string; class?: { name: string } | null } | null
}

export const parentLinkService = {
  /** Any existing user, regardless of current role — an admin promotes an
   * existing account (one that has already signed in at least once) to
   * `parent`, they aren't created from scratch here. */
  async searchUsers(search: string, limit = 20): Promise<User[]> {
    let query = supabase
      .from('users')
      .select('id, email, name, role, class_id, language, school_name, phone, is_active, created_at')
      .order('name', { ascending: true })
      .limit(limit)

    if (search && search.length >= 2) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as User[]
  },

  async promoteToParent(userId: string) {
    const { error } = await supabase.from('users').update({ role: UserRole.Parent }).eq('id', userId)
    if (error) throw error
  },

  async getAllLinks(): Promise<ParentLink[]> {
    const { data, error } = await supabase
      .from('parent_student_links')
      .select(
        `
        id,
        parent_id,
        student_id,
        created_at,
        parent:users!parent_id(id, name, email),
        student:users!student_id(id, name, email, class:classes(name))
        `
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as ParentLink[]
  },

  async createLink(parentId: string, studentId: string) {
    const { error } = await supabase
      .from('parent_student_links')
      .insert([{ parent_id: parentId, student_id: studentId }])

    if (error) throw error
  },

  async deleteLink(linkId: string) {
    const { error } = await supabase.from('parent_student_links').delete().eq('id', linkId)
    if (error) throw error
  },
}
