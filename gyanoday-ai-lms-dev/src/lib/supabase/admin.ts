import { createClient } from '@supabase/supabase-js'

/**
 * Superuser Supabase client that bypasses RLS.
 * IMPORTANT: This client uses the SERVICE_ROLE_KEY and MUST ONLY be used on the server.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceRoleKey) {
  console.warn('[SupabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations may fail.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
