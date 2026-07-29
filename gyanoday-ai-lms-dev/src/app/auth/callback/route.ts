import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      // Smart Redirection Logic
      const { data: userProfile } = await supabase
        .from('users')
        .select('id, class_id')
        .eq('id', session.user.id)
        .single()

      let redirectUrl = next

      if (userProfile && userProfile.class_id) {
        // User exists and has completed profile
        // If they were headed to /register, send them to dashboard instead
        if (next === '/register') {
          redirectUrl = '/dashboard'
        }
      } else {
        // User user does not exist or has incomplete profile (New User)
        // Force redirect to /register to complete profile
        redirectUrl = '/register'
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let baseOrigin = origin
      if (isLocalEnv) {
        // In local development, some environments (like Windows/WSL) might report 0.0.0.0
        // We force localhost to ensure the browser can navigate correctly.
        baseOrigin = origin.replace('0.0.0.0', 'localhost').replace('127.0.0.1', 'localhost')
      }

      if (isLocalEnv) {
        return NextResponse.redirect(`${baseOrigin}${redirectUrl}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
      } else {
        return NextResponse.redirect(`${baseOrigin}${redirectUrl}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
