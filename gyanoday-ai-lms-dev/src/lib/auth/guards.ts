import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/users'

/**
 * Server Actions and Route Handlers are public HTTP endpoints: middleware only protects
 * PAGES, not the actions/APIs they call. Every action that spends AI credits or uses the
 * service-role client must call one of these first.
 */

/** Returns the signed-in user or throws. */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  return user
}

/** The signed-in user must BE the user the request is about (stops passing someone else's id). */
export async function requireSelf(userId: string) {
  const user = await requireUser()
  if (!userId || user.id !== userId) throw new Error('Forbidden')
  return user
}

/** Returns the signed-in user only if they are an admin; throws otherwise. */
export async function requireAdmin() {
  const user = await requireUser()

  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!profile || profile.role !== UserRole.Admin) throw new Error('Admin access required')
  return user
}

/** True only for files stored in THIS project's public Supabase storage (blocks SSRF). */
export function isOwnStorageUrl(url: string | null | undefined): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || !base) return false
  try {
    const target = new URL(url)
    const origin = new URL(base)
    return (
      target.origin === origin.origin && target.pathname.startsWith('/storage/v1/object/')
    )
  } catch {
    return false
  }
}
