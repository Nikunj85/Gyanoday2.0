'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import Loader from '@/components/admin/Loader'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/store/admin-store'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, user } = useAdminStore()
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (user) {
      setIsNavigating(true)
      router.push('/mycp')
    }
  }, [user, router])

  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email')
    const savedPassword = localStorage.getItem('admin_password')
    const savedRememberMe = localStorage.getItem('admin_remember_me') === 'true'

    if (savedRememberMe && savedEmail && savedPassword) {
      setValue('email', savedEmail)
      setValue('password', savedPassword)
      setRememberMe(true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormValues) => {
    setError(null)
    const result = await login(data.email, data.password)

    if (result.error) {
      setError(result.error)
    } else {
      if (rememberMe) {
        localStorage.setItem('admin_email', data.email)
        localStorage.setItem('admin_password', data.password)
        localStorage.setItem('admin_remember_me', 'true')
      } else {
        localStorage.removeItem('admin_email')
        localStorage.removeItem('admin_password')
        localStorage.removeItem('admin_remember_me')
      }
      setIsNavigating(true)
      router.push('/mycp')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 selection:bg-secondary selection:text-primary">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-secondary/30 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-fade-in admin-card !p-8">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex items-center justify-center transition-transform hover:scale-105">
            <Image
              src="/gyanoday_Logo.png"
              alt="Gyanoday gyanoday_Logo"
              width={100}
              height={60}
              className="h-auto w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-black tracking-tight text-primary">Welcome Back</h1>
          <p className="mt-3 font-medium text-slate-500">Gyanoday AI Control Panel</p>
        </div>

        <div className="">
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="admin-label">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@gyanoday.com"
                className={cn('admin-input', errors.email && 'border-rose-500 ring-rose-500/10')}
              />
              {errors.email && (
                <p className="mt-1 text-xs font-bold text-rose-500">{errors.email.message}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="admin-label">Password</label>
                <button
                  type="button"
                  className="text-xs font-bold text-primary hover:underline underline-offset-4"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    'admin-input pr-12',
                    errors.password && 'border-rose-500 ring-rose-500/10'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-bold text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 transition-all checked:border-primary checked:bg-primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <svg
                    className="pointer-events-none absolute h-5 w-5 p-1 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-500">Remember Me</span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-600 border border-rose-100 animate-shake">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isSubmitting || isNavigating}
              className="admin-button-primary w-full !py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting || isNavigating ? (
                <>
                  <Loader size="h-5 w-5" />
                  Signing in to Dashboard ...
                </>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In to Dashboard <LogIn className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
          Powered by{' '}
          <a
            href="https://probietech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 underline transition-colors hover:text-primary"
          >
            Probietech
          </a>
        </p>
      </div>
    </div>
  )
}
