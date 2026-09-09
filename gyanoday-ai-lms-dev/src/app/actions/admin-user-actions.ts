'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { User, UserRole } from '@/types/users'

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!profile || profile.role !== UserRole.Admin) throw new Error('Admin access required')

  return user
}

async function repairInvalidSelfLinks() {
  const { data: links, error } = await supabaseAdmin
    .from('parent_student_links')
    .select('id, parent_id, student_id')

  if (error) throw error

  const invalid = (links || []).filter((link: any) => link.parent_id === link.student_id)
  if (!invalid.length) return

  for (const link of invalid) {
    const { error: deleteError } = await supabaseAdmin
      .from('parent_student_links')
      .delete()
      .eq('id', link.id)
    if (deleteError) throw deleteError

    // This is the exact bad state produced by the old admin flow: the same
    // user was promoted to parent and linked to themselves. Restore that
    // account to student so it appears in Student Management again.
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', link.student_id)
      .maybeSingle()

    if (userError) throw userError
    if (user?.role === UserRole.Parent) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: UserRole.Student })
        .eq('id', link.student_id)
      if (updateError) throw updateError
    }
  }
}

export async function getAdminStudents(params: {
  page?: number
  pageSize?: number
  search?: string
  statusFilter?: boolean | null
  classFilter?: string | null
}) {
  await assertAdmin()
  await repairInvalidSelfLinks()

  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 10))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const search = (params.search || '').trim()

  let query = supabaseAdmin
    .from('users')
    .select(
      `id, email, name, role, class_id, language, school_name, phone, is_active, created_at,
       class:classes(name)`,
      { count: 'exact' }
    )
    .eq('role', UserRole.Student)

  if (search.length >= 2) {
    const escaped = search.replace(/[%_,]/g, '')
    query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
  }

  if (params.statusFilter !== null && params.statusFilter !== undefined) {
    query = query.eq('is_active', params.statusFilter)
  }

  if (params.classFilter && params.classFilter !== 'all') {
    query = query.eq('class_id', params.classFilter)
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
}

export async function createAdminStudent(newUser: Omit<User, 'id' | 'created_at'>) {
  await assertAdmin()

  const payload = { ...newUser, role: UserRole.Student }
  const { data, error } = await supabaseAdmin.from('users').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateAdminStudent(id: string, updates: Partial<User>) {
  await assertAdmin()

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', id)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing || existing.role !== UserRole.Student) {
    throw new Error('Only student accounts can be edited here.')
  }

  const safeUpdates = { ...updates, role: UserRole.Student }
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAdminStudent(id: string) {
  await assertAdmin()

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', id)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing || existing.role !== UserRole.Student) {
    throw new Error('Only student accounts can be deleted here.')
  }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function searchParentCandidates(search: string, limit = 20) {
  await assertAdmin()

  const term = search.trim()
  if (term.length < 2) return []

  let query = supabaseAdmin
    .from('users')
    .select('id, email, name, role, class_id, language, school_name, phone, is_active, created_at')
    .neq('role', UserRole.Student)
    .neq('role', UserRole.Admin)
    .order('name', { ascending: true })
    .limit(Math.min(limit, 50))

  const escaped = term.replace(/[%_,]/g, '')
  query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as User[]
}

export async function searchStudentCandidates(search: string, limit = 20) {
  await assertAdmin()

  const term = search.trim()
  if (term.length < 2) return []

  let query = supabaseAdmin
    .from('users')
    .select('id, email, name, role, class_id, language, school_name, phone, is_active, created_at')
    .eq('role', UserRole.Student)
    .order('name', { ascending: true })
    .limit(Math.min(limit, 50))

  const escaped = term.replace(/[%_,]/g, '')
  query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as User[]
}

export async function promoteUserToParent(parentId: string, studentId?: string) {
  await assertAdmin()

  if (studentId && parentId === studentId) {
    throw new Error('A parent account must be different from the student account.')
  }

  const { data: parent, error: parentError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', parentId)
    .maybeSingle()

  if (parentError) throw parentError
  if (!parent) throw new Error('Parent account not found.')
  if (parent.role === UserRole.Student) {
    throw new Error(
      'This account is already a student. Use a separate parent account/email; one Supabase Auth email cannot represent two different users.'
    )
  }
  if (parent.role === UserRole.Admin) throw new Error('An admin account cannot be used as a parent.')

  if (parent.role !== UserRole.Parent) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: UserRole.Parent })
      .eq('id', parentId)
    if (error) throw error
  }
}

export async function createParentStudentLink(parentId: string, studentId: string) {
  await assertAdmin()

  if (!parentId || !studentId) throw new Error('Parent and student are required.')
  if (parentId === studentId) throw new Error('A parent cannot be linked to the same account as the student.')

  const [{ data: parent, error: parentError }, { data: student, error: studentError }] =
    await Promise.all([
      supabaseAdmin.from('users').select('id, role, is_active').eq('id', parentId).maybeSingle(),
      supabaseAdmin.from('users').select('id, role, is_active').eq('id', studentId).maybeSingle(),
    ])

  if (parentError) throw parentError
  if (studentError) throw studentError
  if (!parent) throw new Error('Parent account not found.')
  if (!student) throw new Error('Student account not found.')
  if (parent.role !== UserRole.Parent) throw new Error('Selected account is not a parent account.')
  if (student.role !== UserRole.Student) throw new Error('Selected account is not a student account.')

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('parent_student_links')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) throw new Error('This parent is already linked to this student.')

  const { error } = await supabaseAdmin
    .from('parent_student_links')
    .insert({ parent_id: parentId, student_id: studentId })
  if (error) throw error
}

export async function getAdminParentLinks() {
  await assertAdmin()

  const { data, error } = await supabaseAdmin
    .from('parent_student_links')
    .select(
      `id, parent_id, student_id, created_at,
       parent:users!parent_id(id, name, email),
       student:users!student_id(id, name, email, class:classes(name))`
    )
    .neq('parent_id', 'student_id')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function deleteAdminParentLink(linkId: string) {
  await assertAdmin()

  const { error } = await supabaseAdmin.from('parent_student_links').delete().eq('id', linkId)
  if (error) throw error
}
