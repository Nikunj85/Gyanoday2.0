'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Supabase allows one auth e-mail per address every ~60 seconds.
const COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // The callback sends people back here with ?message=... when a reset link was invalid/expired.
  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get('message')
    if (message) setNotice(message)
  }, [])

  // Counts the wait down so the button can't be spammed (every click would be another 429).
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const sendLink = async () => {
    if (isLoading || cooldown > 0) return
    setError(null)

    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) {
      setError(
        t('common.auth.errors.email_invalid', { defaultValue: 'Please enter a valid email address' })
      )
      return
    }

    setIsLoading(true)
    try {
      // Where the e-mail link brings the student back to. Must be allowed under
      // Supabase > Authentication > URL Configuration > Redirect URLs.
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      })

      if (resetError) {
        const err = resetError as any
        const message = String(err?.message || '')
        const isRateLimited = err?.status === 429 || /rate limit|too many|after \d+ seconds/i.test(message)

        if (isRateLimited) {
          // "...you can only request this after 42 seconds" -> short wait; "email rate limit exceeded" -> hourly cap.
          const secondsMatch = message.match(/after (\d+) seconds/i)
          const hourlyCap = err?.code === 'over_email_send_rate_limit' || /email rate limit/i.test(message)

          setCooldown(secondsMatch ? Number(secondsMatch[1]) : COOLDOWN_SECONDS)
          setError(
            hourlyCap
              ? t('common.auth.reset.email_limit', {
                  defaultValue:
                    'Too many emails have been sent recently. Please try again after some time, or contact support.',
                })
              : t('common.auth.reset.rate_limited', {
                  defaultValue: 'Too many requests. Please wait a minute and try again.',
                })
          )
        } else {
          setError(
            t('common.auth.reset.send_failed', {
              defaultValue: "We couldn't send the reset link right now. Please try again.",
            })
          )
        }
        return
      }

      // Same message whether or not the email has an account (does not reveal who is registered).
      setSent(true)
      setCooldown(COOLDOWN_SECONDS)
    } catch {
      setError(
        t('common.auth.login.unexpected_error', {
          defaultValue: 'An unexpected error occurred. Please try again.',
        })
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendLink()
  }

  const waitLabel = t('common.auth.reset.resend_in', {
    defaultValue: 'Try again in {{seconds}}s',
    seconds: cooldown,
  })

  return (
    <div className="relative flex min-h-[calc(100vh-200px)] items-center justify-center overflow-hidden p-4 py-5 selection:bg-secondary selection:text-primary md:py-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 z-10 bg-primary/40 backdrop-blur-[2px]" />
        <img src="/auth.png" alt="" className="h-full w-full object-cover" />
      </div>

      <div className="relative z-20 w-full max-w-lg animate-fade-in rounded-3xl bg-white p-10 shadow-xl shadow-neutral-200/50 dark:bg-neutral-800 dark:shadow-none">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t('common.auth.reset.forgot_title', { defaultValue: 'Forgot your password?' })}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {t('common.auth.reset.forgot_subtitle', {
              defaultValue:
                "Enter your registered email address and we'll send you a link to set a new password.",
            })}
          </p>
        </div>

        {notice && !sent && (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            {notice}
          </div>
        )}

        {sent ? (
          <div className="space-y-5">
            <div className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
              {t('common.auth.reset.sent', {
                defaultValue:
                  'If an account exists for this email, a password reset link has been sent. Please check your inbox (and the spam folder).',
              })}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => void sendLink()}
              disabled={isLoading || cooldown > 0}
              className="w-full text-center text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
            >
              {cooldown > 0
                ? waitLabel
                : t('common.auth.reset.send_again', { defaultValue: "Didn't get it? Send again" })}
            </button>

            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              {t('common.auth.reset.back_to_login', { defaultValue: 'Back to login' })}
            </Link>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t('common.auth.form.email', { defaultValue: 'Email Address' })}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={t('common.auth.form.email_placeholder', {
                  defaultValue: 'Enter your email address',
                })}
                className={cn(
                  'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                  error && 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                )}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              disabled={isLoading || cooldown > 0}
              type="submit"
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : cooldown > 0 ? (
                waitLabel
              ) : (
                t('common.auth.reset.send_link', { defaultValue: 'Send reset link' })
              )}
            </button>

            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              <Link href="/login" className="font-bold text-primary hover:underline">
                {t('common.auth.reset.back_to_login', { defaultValue: 'Back to login' })}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}