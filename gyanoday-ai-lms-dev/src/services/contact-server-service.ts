import { supabaseAdmin } from '@/lib/supabase/admin'

export interface ContactRequestData {
  fullName: string
  email: string
  class?: string
  message?: string
}

export interface ContactRequest {
  id: string
  full_name: string
  email: string
  std?: string
  message: string
  created_at: string
}

export const contactServerService = {
  /**
   * Saves a new contact request to the database.
   */
  async saveContactRequest(data: ContactRequestData): Promise<{ success: true }> {
    // Standard client is fine for insert if RLS allows it,
    // but using admin ensures it works during setup.
    const { error } = await supabaseAdmin.from('student_contacts').insert({
      full_name: data.fullName,
      email: data.email,
      std: data.class,
      message: data.message,
    })

    if (error) {
      console.error('[ContactServerService] Error saving contact request:', error)
      throw new Error(error.message)
    }

    return { success: true }
  },

  /**
   * Fetches contact requests using the admin client to bypass RLS.
   */
  async getContactRequests({
    page = 1,
    pageSize = 10,
    search = '',
  }: {
    page?: number
    pageSize?: number
    search?: string
  }) {
    let query = supabaseAdmin.from('student_contacts').select('*', { count: 'exact' })

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`
      )
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) {
      console.error('[ContactServerService] Error fetching contacts:', error)
      throw error
    }

    return {
      data: (data || []) as ContactRequest[],
      total: count || 0,
    }
  },
}
