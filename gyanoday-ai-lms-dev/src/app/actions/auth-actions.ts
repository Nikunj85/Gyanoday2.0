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
  /**
   * Set on the final "Create account" submit. If the email has a leftover Supabase Auth login but NO
   * profile (an account deleted before logins were removed with it), that dead login is removed so the
   * person can register again instead of hitting "already exists".
   */
  cleanupOrphan?: boolean
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

    if (!result.emailExists && input.cleanupOrphan) {
      await removeOrphanAuthUser(email)
    }
  }

  if (phone && PHONE_RE.test(phone)) {
    const { data, error } = await supabaseAdmin.from('users').select('id').eq('phone', phone).limit(1)

    if (error) throw new Error('Could not verify this phone number right now. Please try again.')
    result.phoneExists = (data?.length ?? 0) > 0
  }

  return result
}

/** Finds a Supabase Auth user id by email (SQL helper if installed, otherwise pages through Auth users). */
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc('find_auth_user_id_by_email', { p_email: email })
  if (!error) return (data as string | null) || null

  // Fallback when AUTH_DELETE_FIX.sql has not been run yet.
  const perPage = 1000
  for (let page = 1; page <= 20; page++) {
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (listError || !list) return null
    const match = list.users.find((u) => u.email?.toLowerCase() === email)
    if (match) return match.id
    if (list.users.length < perPage) break
  }
  return null
}

/** Deletes an Auth login that has no matching profile row. Never touches a login that has a profile. */
async function removeOrphanAuthUser(email: string): Promise<void> {
  const authId = await findAuthUserIdByEmail(email)
  if (!authId) return

  const { data: profile } = await supabaseAdmin.from('users').select('id').eq('id', authId).maybeSingle()
  if (profile) return // a real account - leave it alone

  const { error } = await supabaseAdmin.auth.admin.deleteUser(authId)
  if (error) console.error('[auth-actions] Could not remove orphan auth user:', error.message)
}
