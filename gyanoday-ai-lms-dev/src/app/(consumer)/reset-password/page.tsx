'use client'

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type LinkState = 'checking' | 'valid' | 'invalid'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()

  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Opening the e-mail link signs the student in with a short-lived "recovery" session
  // (done by /auth/callback). Without that session there is nothing to reset.
  useEffect(() => {
    let active = true

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (active) setLinkState(data?.user ? 'valid' : 'invalid')
      } catch {
        if (active) setLinkState('invalid')
      }
    }
    void checkSession()

    return () => {
      active = false
    }
  }, [supabase])

  // Same password rules as registration.
  const validate = (value: string): string | null => {
    if (value.length < 8)
      return t('common.auth.errors.pw_min', { defaultValue: 'Password must be at least 8 characters' })
    if (!/[A-Z]/.test(value))
      return t('common.auth.errors.pw_upper', {
        defaultValue: 'Password must contain at least one uppercase letter (A-Z)',
      })
    if (!/[a-z]/.test(value))
      return t('common.auth.errors.pw_lower', {
        defaultValue: 'Password must contain at least one lowercase letter (a-z)',
      })
    if (!/[0-9]/.test(value))
      return t('common.auth.errors.pw_number', { defaultValue: 'Password must contain at least one number' })
    if (!/[^A-Za-z0-9]/.test(value))
      return t('common.auth.errors.pw_special', {
        defaultValue: 'Password must contain at least one special character',
      })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const problem = validate(password)
    if (problem) return setError(problem)
    if (password !== confirm) {
      return setError(
        t('common.auth.reset.passwords_mismatch', { defaultValue: 'Passwords do not match' })
      )
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(
          /same|different/i.test(updateError.message)
            ? t('common.auth.reset.same_password', {
                defaultValue: 'Your new password must be different from the old one.',
              })
            : /session|jwt|expired/i.test(updateError.message)
              ? t('common.auth.reset.link_invalid', {
                  defaultValue: 'This reset link is invalid or has expired. Please request a new one.',
                })
              : updateError.message
        )
        return
      }

      // Make the student log in again with the new password.
      await supabase.auth.signOut()
      const message = t('common.auth.reset.success', {
        defaultValue: 'Your password has been updated. Please log in with your new password.',
      })
      router.push(`/login?message=${encodeURIComponent(message)}`)
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

  const inputClass =
    'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-12 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white'

  return (
    <div className="relative flex min-h-[calc(100vh-200px)] items-center justify-center overflow-hidden p-4 py-5 selection:bg-secondary selection:text-primary md:py-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 z-10 bg-primary/40 backdrop-blur-[2px]" />
        <img src="/auth.png" alt="" className="h-full w-full object-cover" />
      </div>

      <div className="relative z-20 w-full max-w-lg animate-fade-in rounded-3xl bg-white p-10 shadow-xl shadow-neutral-200/50 dark:bg-neutral-800 dark:shadow-none">
        {linkState === 'checking' && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {linkState === 'invalid' && (
          <div className="space-y-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t('common.auth.reset.invalid_title', { defaultValue: 'Link expired' })}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('common.auth.reset.link_invalid', {
                defaultValue: 'This reset link is invalid or has expired. Please request a new one.',
              })}
            </p>
            <Link
              href="/forgot-password"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              {t('common.auth.reset.request_new', { defaultValue: 'Request a new link' })}
            </Link>
          </div>
        )}

        {linkState === 'valid' && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {t('common.auth.reset.reset_title', { defaultValue: 'Set a new password' })}
              </h1>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {t('common.auth.reset.reset_subtitle', {
                  defaultValue:
                    'Use at least 8 characters with uppercase, lowercase, a number and a special character.',
                })}
              </p>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('common.auth.reset.new_password', { defaultValue: 'New password' })}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className={cn(inputClass, error && 'border-red-500')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('common.auth.reset.confirm_password', { defaultValue: 'Confirm new password' })}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className={cn(inputClass, error && 'border-red-500')}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                disabled={isLoading}
                type="submit"
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  t('common.auth.reset.update_password', { defaultValue: 'Update password' })
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}