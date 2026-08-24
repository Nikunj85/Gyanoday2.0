'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth-service'
import { useUserStore } from '@/store/user-store'
import { User } from '@/types/users'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const supabase = createClient()
  const setUser = useUserStore((state) => state.setUser)
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    if (user) {
      const next = searchParams.get('next')
      if (next) {
        router.push(next)
      } else if (user.role === 'admin') {
        router.push('/mycp')
      } else if (user.role === 'parent') {
        router.push('/parent-dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, router, searchParams])

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  // Watch for changes in email and password to clear error messages
  const watchedEmail = watch('email')
  const watchedPassword = watch('password')

  useEffect(() => {
    if (error || resendSuccess) {
      setError(null)
      setResendSuccess(null)
    }
  }, [watchedEmail, watchedPassword])

  const handleResendConfirmation = async () => {
    const email = getValues('email')
    if (!email) {
      setError(
        t('common.auth.login.enter_email_first', {
          defaultValue: 'Please enter your email address first.',
        })
      )
      return
    }

    setIsResending(true)
    setError(null)
    setResendSuccess(null)

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (resendError) {
        setError(resendError.message)
      } else {
        setResendSuccess(t('common.auth.login.resend_success'))
      }
    } catch (err) {
      setError(
        t('common.auth.login.resend_failed', {
          defaultValue: 'Failed to resend confirmation email.',
        })
      )
    } finally {
      setIsResending(false)
    }
  }

  const onSubmit = async (data: LoginFormValues) => {
    setError(null)
    setResendSuccess(null)
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('email_not_confirmed')
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      if (authData.user) {
        // Fetch user data from users table to ensure they exist there too
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(
            `
            id,
            email,
            name,
            role,
            class_id,
            language,
            school_name,
            phone,
            is_active,
            score_summary,
            created_at,
            class:classes(name)
          `
          )
          .eq('id', authData.user.id)
          .single()

        if (userError || !userData) {
          console.error('Login error: User profile not found in users table', userError)
          setError(
            t('common.auth.login.profile_not_found', {
              defaultValue: 'User profile not found. Please contact support.',
            })
          )
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        // Set user in store
        setUser(userData as User)

        // Redirect based on 'next' param or role
        const next = searchParams.get('next')
        if (next) {
          router.push(next)
        } else if (userData.role === 'admin') {
          router.push('/mycp')
        } else if (userData.role === 'parent') {
          router.push('/parent-dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(
        t('common.auth.login.unexpected_error', {
          defaultValue: 'An unexpected error occurred. Please try again.',
        })
      )
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.signInWithGoogle(`${window.location.origin}/auth/callback?next=/register`)
    } catch (err: any) {
      console.error('Google Sign-In Error:', err)
      setError(
        err.message ||
          t('common.auth.login.google_failed', { defaultValue: 'Failed to sign in with Google' })
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4 py-5 md:py-16 selection:bg-secondary selection:text-primary relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] z-10" />
        <img
          src="/auth.png"
          alt="Authentication background"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="w-full max-w-lg animate-fade-in relative z-20 bg-white p-10 rounded-3xl shadow-xl shadow-neutral-200/50 dark:bg-neutral-800 dark:shadow-none">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t('common.auth.login.title')}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {t('common.auth.login.subtitle')}
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {message}
          </div>
        )}

        <div className="rounded-2xl ">
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t('common.auth.form.email')}
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder={t('common.auth.form.email_placeholder')}
                className={cn(
                  'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                  errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                )}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t('common.auth.form.password')}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('common.auth.form.password_placeholder')}
                  className={cn(
                    'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                    errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error === 'email_not_confirmed' ? (
                  <div className="flex flex-col space-y-2">
                    <p>{t('common.auth.login.email_not_confirmed')}</p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="ml-1 cursor-pointer font-bold text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isResending
                        ? t('common.auth.login.resending')
                        : t('common.auth.login.resend_confirmation')}
                    </button>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}

            {resendSuccess && (
              <div className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {resendSuccess}
              </div>
            )}

            <div className="flex justify-center">
              <button
                disabled={isLoading}
                type="submit"
                className="flex h-12 w-full lg:max-w-md cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>{t('common.auth.login.submit')}</>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="relative my-8 mx-auto w-full lg:max-w-md">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {t('common.auth.form.or_continue_with')}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex h-12 w-full lg:max-w-md cursor-pointer items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:shadow-md disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                <span>{t('common.auth.login.google_signin')}</span>
              </Button>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-5">
              {t('common.auth.login.no_account')}{' '}
              <Link
                href={`/register${searchParams.get('next') ? `?next=${searchParams.get('next')}` : ''}`}
                className="font-bold text-primary hover:underline"
              >
                {t('common.auth.login.create_account')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
