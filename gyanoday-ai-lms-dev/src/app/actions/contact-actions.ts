'use server'

import { requireAdmin } from '@/lib/auth/guards'
import { ContactRequestData, contactServerService } from '@/services/contact-server-service'

/**
 * Server action to submit contact form
 */
export async function submitContactForm(data: ContactRequestData) {
  try {
    // Basic validation
    if (!data.fullName || !data.email) {
      return { success: false, error: 'Name and email are required.' }
    }
    // Basic abuse protection: sane email shape and length limits.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim()) || String(data.email).length > 254) {
      return { success: false, error: 'Please enter a valid email address.' }
    }
    if (String(data.fullName).length > 120 || String(data.message ?? '').length > 5000) {
      return { success: false, error: 'Your message is too long.' }
    }

    const result = await contactServerService.saveContactRequest(data)
    return result
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while sending your message.',
    }
  }
}

/**
 * Server action to fetch contact requests for admin using supabaseAdmin
 */
export async function getContactRequestsAction(params: {
  page?: number
  pageSize?: number
  search?: string
}) {
  try {
    // Contact requests contain visitors' personal data — admins only.
    await requireAdmin()
    const result = await contactServerService.getContactRequests(params)
    return {
      success: true,
      data: result.data,
      total: result.total,
    }
  } catch (error: any) {
    console.error('[Actions] Error in getContactRequestsAction:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch contact requests.',
      data: [],
      total: 0,
    }
  }
}
