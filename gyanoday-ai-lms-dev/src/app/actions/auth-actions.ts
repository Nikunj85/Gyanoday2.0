'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export interface UserExistsResult {
  emailExists: boolean
  phoneExists: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[6-9]\d{9}$/

/**
 * Registration pre-check: is there already an account with this email / phone?
 *
 * It has to run on the server with the service-role client. The old check ran in the browser
 * while the visitor was logged out, and the `users` table's row-level security hides other
 * people's rows from them, so it could never find anyone and every duplicate got through.
 *
 * Emails are compared case-insensitively (Supabase Auth stores them lower-cased), and `%` / `_`
 * are escaped so an address like "john_doe@x.com" is matched literally.
 */
export async function checkUserExists(input: {
  email?: string
  phone?: string
}): Promise<UserExistsResult> {
  const email = (input.email || '').trim().toLowerCase()
  const phone = (input.phone || '').trim()

  const result: UserExistsResult = { emailExists: false, phoneExists: false }

  if (email && email.length <= 254 && EMAIL_RE.test(email)) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email.replace(/[\\%_]/g, (m) => `\\${m}`))
      .limit(1)

    if (error) throw new Error('Could not verify this email right now. Please try again.')
    result.emailExists = (data?.length ?? 0) > 0
  }

  if (phone && PHONE_RE.test(phone)) {
    const { data, error } = await supabaseAdmin.from('users').select('id').eq('phone', phone).limit(1)

    if (error) throw new Error('Could not verify this phone number right now. Please try again.')
    result.phoneExists = (data?.length ?? 0) > 0
  }

  return result
}
