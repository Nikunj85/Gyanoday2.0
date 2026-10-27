import { supabaseAdmin } from '@/lib/supabase/admin'

export interface ContactRequestData {
  fullName: string
  email: string
  class: string
  message: string
}

export interface ContactRequest {
  id: string
  full_name: string
  email: string | null
  std: string | null
  message: string | null
  created_at: string
}

interface GetContactRequestsParams {
  page?: number
  pageSize?: number
  search?: string
}

export const contactServerService = {
  /**
   * Saves a contact form submission in Supabase.
   * The Admin > Contacts page reads from the same student_contacts table.
   */
  async saveContactRequest(data: ContactRequestData) {
    const fullName = String(data.fullName ?? '').trim()
    const email = String(data.email ?? '').trim().toLowerCase()
    const studentClass = String(data.class ?? '').trim()
    const message = String(data.message ?? '').trim()

    if (!fullName || !email || !message) {
      return {
        success: false,
        error: 'Name, email, and message are required.',
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      }
    }

    const { error } = await supabaseAdmin
      .from('student_contacts')
      .insert({
        full_name: fullName,
        email,
        std: studentClass || null,
        message,
      })

    if (error) {
      console.error(
        '[ContactServerService] Failed to save contact request:',
        error
      )

      throw new Error('Failed to save your message. Please try again.')
    }

    return {
      success: true,
      message: 'Your message has been submitted successfully.',
    }
  },

  /**
   * Retrieves contact requests for the Admin > Contacts page.
   */
  async getContactRequests({
    page = 1,
    pageSize = 10,
    search = '',
  }: GetContactRequestsParams = {}): Promise<{
    data: ContactRequest[]
    total: number
  }> {
    const safePage = Math.max(1, Math.floor(page))
    const safePageSize = Math.min(
      100,
      Math.max(1, Math.floor(pageSize))
    )

    let query = supabaseAdmin
      .from('student_contacts')
      .select(
        'id, full_name, email, std, message, created_at',
        { count: 'exact' }
      )

    const searchTerm = search.trim()

    if (searchTerm) {
      const escapedSearch = searchTerm.replace(/[,%()]/g, '')
      const pattern = `%${escapedSearch}%`

      query = query.or(
        `full_name.ilike.${pattern},email.ilike.${pattern},message.ilike.${pattern}`
      )
    }

    const start = (safePage - 1) * safePageSize
    const end = start + safePageSize - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) {
      console.error(
        '[ContactServerService] Failed to fetch contact requests:',
        error
      )

      throw new Error('Failed to load contact requests.')
    }

    return {
      data: (data ?? []) as ContactRequest[],
      total: count ?? 0,
    }
  },
}
