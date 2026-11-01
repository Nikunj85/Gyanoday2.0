import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/** Builds the public base URL the browser should be sent back to. */
function resolveBaseUrl(request: Request, origin: string) {
  const forwardedHost = request.headers.get('x-forwarded-host') // original host behind a proxy / load balancer
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    // Some environments (Windows/WSL) report 0.0.0.0 / 127.0.0.1 - force localhost so the browser can open it.
    return origin.replace('0.0.0.0', 'localhost').replace('127.0.0.1', 'localhost')
  }
  if (forwardedHost) return `https://${forwardedHost}`
  return origin
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const baseUrl = resolveBaseUrl(request, origin)

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  // if "next" is in search params, use it as the redirection URL (same-site paths only)
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  const toLogin = (message: string) => {
    const url = new URL('/login', baseUrl)
    url.searchParams.set('message', message)
    return NextResponse.redirect(url.toString())
  }

  // Supabase can send the user back with an error (expired / already-used link).
  const providerError = searchParams.get('error_description') || searchParams.get('error')
  if (providerError && !code && !tokenHash) {
    if (next.startsWith('/reset-password')) {
      const url = new URL('/forgot-password', baseUrl)
      url.searchParams.set(
        'message',
        'This password reset link is invalid or has expired. Please request a new one.'
      )
      return NextResponse.redirect(url.toString())
    }
    return toLogin(
      'This confirmation link is invalid or has expired. If you already confirmed your email, please log in; otherwise register again.'
    )
  }

  const supabase = await createClient()
  let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null
  let failed = false

  if (code) {
    // OAuth (Google) and PKCE email-confirmation links.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    session = data?.session ?? null
    failed = !!error || !session
  } else if (tokenHash && type) {
    // Email-template links that carry a token hash. These also work when the link is opened on
    // a different browser/device than the one used to register.
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    session = data?.session ?? null
    failed = !!error || !session
  } else {
    failed = true
  }

  const isPasswordReset = next.startsWith('/reset-password')

  if ((failed || !session) && isPasswordReset) {
    const url = new URL('/forgot-password', baseUrl)
    url.searchParams.set(
      'message',
      'This password reset link is invalid or has expired. Please request a new one.'
    )
    return NextResponse.redirect(url.toString())
  }

  if (failed || !session) {
    // The e-mail itself is usually already confirmed by this point (e.g. the link was opened in
    // another browser, so there is no sign-in cookie). Send the student to log in instead of an error page.
    return toLogin('Your email is confirmed. Please log in to continue.')
  }

  // Password-reset links always land on the reset form (the recovery session is already active).
  if (isPasswordReset) {
    return NextResponse.redirect(`${baseUrl}${next}`)
  }

  // Smart Redirection Logic
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, class_id, role')
    .eq('id', session.user.id)
    .single()

  let redirectUrl = next

  if (userProfile?.role === 'parent') {
    // Parents don't have (or need) a class_id - send them straight to their own portal.
    redirectUrl = next === '/register' || next === '/' ? '/parent-dashboard' : next
  } else if (userProfile && userProfile.class_id) {
    // Profile already complete: skip the registration form.
    if (next === '/register' || next === '/' || next === '/login') {
      redirectUrl = '/dashboard'
    }
  } else {
    // New user / incomplete profile: finish registration.
    redirectUrl = '/register'
  }

  return NextResponse.redirect(`${baseUrl}${redirectUrl}`)
}
