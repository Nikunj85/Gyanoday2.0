'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { checkUserExists } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth-service'
import { classService } from '@/services/class-service'
import { boardService, Board } from '@/services/board-service'
import { useUserStore } from '@/store/user-store'
import { Language, User, UserRole } from '@/types/users'

import RegisterSkeleton from '../components/RegisterSkeleton'

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'common.auth.errors.name_min')
    .regex(/^[a-zA-Z\s.-]+$/, 'common.auth.errors.name_chars'),
  email: z.string().email('common.auth.errors.email_invalid'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'common.auth.errors.phone_invalid'),
  password: z
    .string()
    .min(8, 'common.auth.errors.pw_min')
    .regex(/[A-Z]/, 'common.auth.errors.pw_upper')
    .regex(/[a-z]/, 'common.auth.errors.pw_lower')
    .regex(/[0-9]/, 'common.auth.errors.pw_number')
    .regex(/[^A-Za-z0-9]/, 'common.auth.errors.pw_special')
    .optional()
    .or(z.literal('')),
  school_name: z.string().min(2, 'common.auth.errors.school_required').max(100, 'common.auth.errors.school_long'),
  class_id: z.string().min(1, 'common.auth.errors.class_required'),
  board_id: z.string().min(1, 'Please select your education board.'),
  language: z.nativeEnum(Language),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  // Validation messages are i18n keys; translate at render so they follow the chosen medium.
  const tr = (m?: string) => (m ? t(m, { defaultValue: m }) : '')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  // true when the visitor tried an email/phone that already has an account -> offer a Log in link
  const [accountExists, setAccountExists] = useState(false)
  const supabase = createClient()
  const setUser = useUserStore((state) => state.setUser)
  const user = useUserStore((state) => state.user)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError: setFieldError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      language: Language.EN,
      board_id: '',
    },
  })

  const selectedLanguage = watch('language')
  const selectedBoard = watch('board_id')
  const { data: boards = [], isLoading: isLoadingBoards } = useQuery({ queryKey: ['boards'], queryFn: () => boardService.getAll() })

  // Choosing the medium of instruction switches the page language right away, and the
  // class list is per-medium (Class 10 exists once for each), so clear any earlier pick.
  const previousMedium = useRef(selectedLanguage)
  const previousBoard = useRef(selectedBoard)
  useEffect(() => {
    if (previousBoard.current !== selectedBoard) setValue('class_id', '')
    previousBoard.current = selectedBoard
  }, [selectedBoard, setValue])
  useEffect(() => {
    if (selectedLanguage && (i18n.language || '').split('-')[0] !== selectedLanguage) {
      i18n.changeLanguage(selectedLanguage)
    }
    if (previousMedium.current !== selectedLanguage) {
      previousMedium.current = selectedLanguage
      setValue('class_id', '')
    }
  }, [selectedLanguage, i18n, setValue])

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes-list', selectedLanguage, selectedBoard],
    queryFn: () =>
      classService.getClasses({
        page: 1,
        pageSize: 100,
        statusFilter: true,
        languageFilter: selectedLanguage,
      }).then((result) => ({ ...result, data: result.data.filter((cls: any) => !selectedBoard || cls.board_id === selectedBoard) })),
  })

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          // Check if user exists in our database and has a completed profile
          const { data: userData } = await supabase
            .from('users')
            .select('id, class_id, board_id')
            .eq('id', session.user.id)
            .single()

          if (userData && userData.class_id) {
            // Profile exists and is complete, redirect to dashboard
            router.push('/dashboard')
          } else {
            // No profile or incomplete profile, pre-fill form
            setIsGoogleUser(true)
            setValue('email', session.user.email || '')
            setValue(
              'name',
              session.user.user_metadata?.name || session.user.user_metadata?.full_name || ''
            )
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router, supabase, setValue])

  const EMAIL_EXISTS_MSG = 'common.auth.errors.email_exists'
  const PHONE_EXISTS_MSG = 'common.auth.errors.phone_exists'

  // Live feedback as soon as the visitor leaves the email / phone field.
  const checkFieldOnBlur = async (field: 'email' | 'phone', rawValue: string) => {
    if (isGoogleUser) return
    const value = rawValue.trim()
    const valid =
      field === 'email'
        ? z.string().email().safeParse(value).success
        : /^[6-9]\d{9}$/.test(value)
    if (!valid) return

    try {
      const result = await checkUserExists(field === 'email' ? { email: value } : { phone: value })
      const exists = field === 'email' ? result.emailExists : result.phoneExists
      if (exists) {
        setFieldError(field, {
          type: 'manual',
          message: field === 'email' ? EMAIL_EXISTS_MSG : PHONE_EXISTS_MSG,
        })
        setAccountExists(true)
      }
    } catch {
      // Silent: the same check runs again on submit and reports real errors there.
    }
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null)
    setAccountExists(false)
    setIsLoading(true)

    // Supabase Auth stores emails lower-cased; compare and sign up with the same form.
    data = { ...data, email: data.email.trim().toLowerCase() }

    let authUserId: string | undefined
    let authSession: any = null

    try {
      // 1. Check (server-side, case-insensitive) whether this email or phone already has an account
      if (!isGoogleUser) {
        const { emailExists, phoneExists } = await checkUserExists({
          email: data.email,
          phone: data.phone,
        })

        if (emailExists || phoneExists) {
          if (emailExists) setFieldError('email', { type: 'manual', message: EMAIL_EXISTS_MSG })
          if (phoneExists) setFieldError('phone', { type: 'manual', message: PHONE_EXISTS_MSG })
          setError(emailExists ? EMAIL_EXISTS_MSG : PHONE_EXISTS_MSG)
          setAccountExists(true)
          setIsLoading(false)
          return
        }
      }

      if (!isGoogleUser) {
        // 2. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password || '',
          options: {
            data: {
              name: data.name,
              role: UserRole.Student,
            },
          },
        })

        if (authError) {
          if (/already|registered|exists/i.test(authError.message)) {
            setFieldError('email', { type: 'manual', message: EMAIL_EXISTS_MSG })
            setError(EMAIL_EXISTS_MSG)
            setAccountExists(true)
          } else {
            setError(authError.message)
          }
          setIsLoading(false)
          return
        }

        // With email confirmation on, Supabase does NOT return an error for an email that is
        // already registered (to avoid revealing which emails exist). It returns a fake user
        // with an empty `identities` list instead. Without this check the page used to say
        // "Registration successful!" for an existing account.
        if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
          setFieldError('email', { type: 'manual', message: EMAIL_EXISTS_MSG })
          setError(EMAIL_EXISTS_MSG)
          setAccountExists(true)
          setIsLoading(false)
          return
        }
        authUserId = authData.user?.id
        authSession = authData.session
      } else {
        // User is already authenticated (via Google), use their ID
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          setError(t('common.auth.errors.session_expired', 'Session expired. Please try again.'))
          setIsLoading(false)
          return
        }
        authUserId = session.user.id
        authSession = session
      }

      if (authUserId) {
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 3. Update user data into the users table
        const { error: userError } = await supabase
          .from('users')
          .update({
            name: data.name,
            phone: data.phone,
            school_name: data.school_name,
            class_id: data.class_id,
            board_id: data.board_id,
            language: data.language,
            is_active: true,
          })
          .eq('id', authUserId)

        if (userError) {
          console.error('Error inserting user profile:', userError)
          setError(t('common.auth.errors.save_failed', 'Registration failed: Could not save profile data.') + ' ' + userError.message)
          setIsLoading(false)
          return
        }

        // Fetch the full profile to set in store
        const { data: updatedProfile } = await supabase
          .from('users')
          .select(
            `
            id,
            email,
            name,
            role,
            class_id,
            board_id,
            language,
            school_name,
            phone,
            is_active,
            created_at,
            class:classes(name)
          `
          )
          .eq('id', authUserId)
          .single()

        if (updatedProfile) {
          setUser(updatedProfile as User)
        }

        // If session exists, it means email confirmation is disabled or user is already logged in (Google)
        if (authSession) {
          const next = searchParams.get('next')
          const redirectPath = next || '/dashboard'
          router.push(
            `${redirectPath}${redirectPath.includes('?') ? '&' : '?'}message=${encodeURIComponent(t('common.auth.errors.welcome', 'Registration successful! Welcome to Gyanoday AI.'))}`
          )
        } else {
          // Email confirmation is enabled for email/password signup
          const next = searchParams.get('next')
          const message =
            t('common.auth.errors.confirm_email', {
              defaultValue:
                'Registration successful! A confirmation email has been sent to {{email}}. Please confirm your email before logging in.',
              email: data.email,
            })
          const loginUrl = new URL('/login', window.location.origin)
          loginUrl.searchParams.set('message', message)
          if (next) loginUrl.searchParams.set('next', next)
          router.push(loginUrl.pathname + loginUrl.search)
        }
      }
    } catch (err: any) {
      setError(err.message || t('common.auth.login.unexpected_error', 'An unexpected error occurred.'))
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Redirect back to registration page to complete the profile
      await authService.signInWithGoogle(`${window.location.origin}/auth/callback?next=/register`)
    } catch (err: any) {
      console.error('Google Sign-Up Error:', err)
      setError(err.message || t('common.auth.login.google_failed', 'Failed to sign up with Google'))
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4 py-4 selection:bg-secondary selection:text-primary relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] z-10" />
        <img
          src="/auth.png"
          alt="Authentication background"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="w-full max-w-4xl animate-fade-in relative rounded-2xl bg-white p-8 shadow-xl shadow-neutral-200/50 dark:bg-neutral-800 dark:shadow-none z-20">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t('common.auth.register.title')}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {t('common.auth.register.subtitle')}
          </p>
        </div>

        <div className="">
          {checkingSession ? (
            <RegisterSkeleton />
          ) : (
            <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Email (1) */}
                <div className={cn(isGoogleUser && 'lg:col-span-1')}>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('common.auth.form.email')}
                  </label>
                  <input
                    {...register('email', {
                      onChange: () => {
                        if (errors.email?.type === 'manual') {
                          clearErrors('email')
                          setAccountExists(false)
                        }
                      },
                      onBlur: (e) => checkFieldOnBlur('email', e.target.value),
                    })}
                    type="email"
                    placeholder={t('common.auth.form.email_placeholder')}
                    disabled={isGoogleUser}
                    className={cn(
                      'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white disabled:opacity-70 disabled:bg-neutral-100 dark:disabled:bg-neutral-800',
                      errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                    )}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {tr(errors.email.message)}
                    </p>
                  )}
                </div>

                {/* Password (2) */}
                {!isGoogleUser && (
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
                          errors.password &&
                            'border-red-500 focus:border-red-500 focus:ring-red-500/5'
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
                      <p className="mt-1.5 text-xs font-medium text-red-500">
                        {tr(errors.password.message)}
                      </p>
                    )}
                  </div>
                )}

                {/* Name (3) */}
                <div className={cn(isGoogleUser && 'lg:col-span-2')}>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('common.auth.form.full_name')}
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder={t('common.auth.form.full_name_placeholder')}
                    className={cn(
                      'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                      errors.name && 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{tr(errors.name.message)}</p>
                  )}
                </div>

                {/* Phone (4) */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('common.auth.form.phone')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium select-none pointer-events-none">
                      +91
                    </div>
                    <input
                      {...register('phone', {
                        onChange: (e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                          e.target.value = val
                          if (errors.phone?.type === 'manual') clearErrors('phone')
                        },
                        onBlur: (e) => checkFieldOnBlur('phone', e.target.value),
                      })}
                      type="tel"
                      placeholder={t('common.auth.form.phone_placeholder')}
                      maxLength={10}
                      className={cn(
                        'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pl-14 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                        errors.phone && 'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                      )}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {tr(errors.phone.message)}
                    </p>
                  )}
                </div>

                {/* Language (5) */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('common.auth.form.medium')}
                  </label>
                  <div className="relative">
                    <select
                      {...register('language')}
                      className={cn(
                        'w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-10 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                        errors.language &&
                          'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                      )}
                    >
                      {/* Always shown in their own script so a student can find their medium. */}
                      <option value={Language.EN}>English</option>
                      <option value={Language.HI}>हिंदी</option>
                      <option value={Language.GU}>ગુજરાતી</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      size={20}
                    />
                  </div>
                  {errors.language && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {tr(errors.language.message)}
                    </p>
                  )}
                </div>

                {/* Education Board */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">Education Board</label>
                  <div className="relative">
                    <select {...register('board_id')} className={cn('w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-10 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white', errors.board_id && 'border-red-500') } disabled={isLoadingBoards}>
                      <option value="">Select your board</option>
                      {boards.map((board: Board) => <option key={board.id} value={board.id}>{board.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={20} />
                  </div>
                  {errors.board_id && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.board_id.message}</p>}
                </div>

                {/* Class (6) */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('common.auth.form.class')}
                  </label>
                  <div className="relative">
                    <select
                      {...register('class_id')}
                      className={cn(
                        'w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-10 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                        errors.class_id &&
                          'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                      )}
                      disabled={isLoadingClasses}
                    >
                      <option value="">{t('common.auth.form.select_class')}</option>
                      {classesData?.data.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      size={20}
                    />
                  </div>
                  {errors.class_id && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {tr(errors.class_id.message)}
                    </p>
                  )}
                </div>

                {/* School Name (7) */}
                <div className="lg:col-span-3">
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('common.auth.form.school')}
                  </label>
                  <input
                    {...register('school_name')}
                    type="text"
                    placeholder={t('common.auth.form.school_placeholder')}
                    className={cn(
                      'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white',
                      errors.school_name &&
                        'border-red-500 focus:border-red-500 focus:ring-red-500/5'
                    )}
                  />
                  {errors.school_name && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {tr(errors.school_name.message)}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <span>{tr(error || undefined)}</span>
                  {accountExists && (
                    <Link
                      href={`/login${searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next') as string)}` : ''}`}
                      className="shrink-0 rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                    >
                      {t('common.auth.login.submit')}
                    </Link>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  disabled={isLoading}
                  type="submit"
                  className="flex h-12 w-full lg:max-w-md cursor-pointer items-center justify-center rounded-xl bg-primary px-1 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>{t('common.auth.register.submit')}</>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            {
              /* Only show Google Sign Up if not already a Google User */
              !isGoogleUser && (
                <>
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
                      onClick={handleGoogleSignUp}
                      disabled={isLoading}
                      className="flex h-12 w-full lg:max-w-md cursor-pointer items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:shadow-md disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="h-5 w-5"
                      />
                      <span>{t('common.auth.register.google_signup')}</span>
                    </Button>
                  </div>
                </>
              )
            }

            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-7">
              {t('common.auth.register.have_account')}{' '}
              <Link
                href={`/login${searchParams.get('next') ? `?next=${searchParams.get('next')}` : ''}`}
                className="font-bold text-primary hover:underline"
              >
                {t('common.auth.register.signin_instead')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
