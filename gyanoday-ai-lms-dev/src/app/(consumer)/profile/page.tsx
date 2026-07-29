'use client'

import { useFormik } from 'formik'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { useToast } from '@/components/ui/use-toast'
import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/user-store'
import { Language } from '@/types/users'

import { LogoutDialog } from '../components/LogoutDialog'
import { ProfileHeader } from '../components/ProfileHeader'
import { ProfileInfoCard } from '../components/ProfileInfoCard'

// Validation schema using Zod
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  school_name: z.string().min(2, 'School name is required'),
  class: z.string().min(1, 'Class is required'),
  language: z
    .string()
    .min(1, 'Language is required')
    .refine((val) => [Language.EN, Language.HI, Language.GU].includes(val as any), {
      message: 'Invalid language',
    }),
})

function ProfileContent() {
  const { t } = useTranslation()
  const { user, isLoading, refreshProfile, logout } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Redirect to Home if not authenticated (instead of Login)
  useEffect(() => {
    if (!isLoading && !user && !isLoggingOut) {
      router.push('/')
    }
  }, [user, isLoading, router, isLoggingOut])

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    setIsLoggingOut(true)

    // Wait for exit animation
    await new Promise((resolve) => setTimeout(resolve, 800))

    await logout()
    router.push('/login')
  }

  const confirmLogout = () => {
    setShowLogoutDialog(true)
  }

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      school_name: user?.school_name || '',
      class: user?.class?.name || '',
      language: user?.language || Language.EN,
    },
    validate: (values) => {
      const result = profileSchema.safeParse(values)
      if (result.success) return {}
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof typeof values
        errors[String(key)] = issue.message
      })
      return errors
    },
    enableReinitialize: true, // This allows the form to update when user data changes
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: values.name,
            school_name: values.school_name,
            language: values.language,
          })
          .eq('id', user?.id)

        if (error) throw error

        await refreshProfile()
        toast({
          title: t('common.profile_page.messages.profile_updated'),
          description: t('common.profile_page.messages.profile_updated_desc'),
        })
        setIsEditing(false)
      } catch (error: any) {
        toast({
          title: t('common.profile_page.messages.error'),
          description: error.message || t('common.profile_page.messages.update_failed'),
          variant: 'destructive',
        })
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '??'

  return (
    <main className="bg-background transition-colors duration-300 min-h-screen relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isLoggingOut && (
          <motion.div
            key="profile-content"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <MotionWrapper animation="fadeInDown" duration={1.2}>
              <ProfileHeader
                user={user}
                initials={initials}
                isEditing={isEditing}
                onEditClick={() => setIsEditing(true)}
              />
            </MotionWrapper>

            {/* Profile Sections */}
            <div className={`container mx-auto px-4 pt-10 ${isEditing ? 'pb-28' : 'pb-6'}`}>
              <MotionContainer className="flex flex-col items-center" staggerChildren={0.2}>
                {/* Detailed Info Sections */}
                <div className="w-full max-w-4xl space-y-2 mt-10">
                  <form onSubmit={formik.handleSubmit} className="space-y-2">
                    <MotionWrapper animation="fadeInUp">
                      <ProfileInfoCard title={t('common.profile_page.personal_info')}>
                        {/* Email Field (Read-only) */}
                        <div className="space-y-2">
                          <label className="text-primary dark:text-primary-hover font-semibold text-lg">
                            {t('common.profile_page.email')}
                          </label>
                          <div className="border-b-2 border-[#D1C7E8] dark:border-neutral-800 pb-1 text-neutral-500 dark:text-neutral-400 font-semibold text-lg overflow-hidden text-ellipsis min-h-[44px] flex items-center bg-transparent">
                            {user?.email || t('common.profile_page.messages.na')}
                          </div>
                        </div>
                        {/* Name Field */}
                        <div className="space-y-4">
                          <label className="text-primary dark:text-primary-hover font-semibold text-lg">
                            {t('common.profile_page.user_name')}
                          </label>
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full rounded-none border-t-0 border-x-0 border-b-2 ${
                                  formik.touched.name && formik.errors.name
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-[#D1C7E8] dark:border-neutral-700'
                                } focus:outline-none focus:border-philosophy dark:focus:border-lavender-mist px-0 h-10 text-lg bg-transparent font-semibold dark:text-white`}
                              />
                              {formik.touched.name && formik.errors.name && (
                                <p className="text-red-500 text-sm">{formik.errors.name}</p>
                              )}
                            </>
                          ) : (
                            <div className="border-b-2 border-[#D1C7E8] dark:border-neutral-800 pb-1 text-neutral-500 dark:text-neutral-400 font-semibold text-lg min-h-[44px] flex items-center">
                              {user?.name || t('common.profile_page.messages.na')}
                            </div>
                          )}
                        </div>
                      </ProfileInfoCard>
                    </MotionWrapper>

                    <MotionWrapper animation="fadeInUp" delay={0.2}>
                      <ProfileInfoCard title={t('common.profile_page.educational_info')}>
                        {/* Language Field (Read-only) */}
                        <div className="space-y-4">
                          <label className="text-primary dark:text-primary-hover font-semibold text-lg">
                            {t('common.profile_page.current_course_language')}
                          </label>
                          <div className="border-b-2 border-[#D1C7E8] dark:border-neutral-800 pb-1 text-neutral-500 dark:text-neutral-400 font-semibold text-lg min-h-[44px] flex items-center bg-transparent">
                            {user?.language === 'en'
                              ? t('common.languages.en')
                              : user?.language === 'hi'
                                ? t('common.languages.hi')
                                : user?.language === 'gu'
                                  ? t('common.languages.gu')
                                  : user?.language || t('common.languages.en')}
                          </div>
                        </div>

                        {/* Class Field (Read-only) */}
                        <div className="space-y-2">
                          <label className="text-primary dark:text-primary-hover font-semibold text-lg">
                            {t('common.profile_page.class')}
                          </label>
                          <div className="border-b-2 border-[#D1C7E8] dark:border-neutral-800 pb-1 text-neutral-500 dark:text-neutral-400 font-semibold text-lg min-h-[44px] flex items-center bg-transparent">
                            {user?.class?.name || t('common.profile_page.messages.na')}
                          </div>
                        </div>

                        {/* School Name Field */}
                        <div className="space-y-4">
                          <label className="text-primary dark:text-primary-hover font-semibold text-lg">
                            {t('common.profile_page.school_name')}
                          </label>
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                name="school_name"
                                value={formik.values.school_name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full rounded-none border-t-0 border-x-0 border-b-2 ${
                                  formik.touched.school_name && formik.errors.school_name
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-[#D1C7E8] dark:border-neutral-700'
                                } focus:outline-none focus:border-philosophy dark:focus:border-lavender-mist px-0 h-10 font-semibold text-lg bg-transparent dark:text-white`}
                              />
                              {formik.touched.school_name && formik.errors.school_name && (
                                <p className="text-red-500 text-sm">{formik.errors.school_name}</p>
                              )}
                            </>
                          ) : (
                            <div className="border-b-2 border-[#D1C7E8] dark:border-neutral-800 pb-1 text-neutral-500 dark:text-neutral-400 font-semibold text-lg min-h-[44px] flex items-center">
                              {user?.school_name || t('common.profile_page.messages.na')}
                            </div>
                          )}
                        </div>
                      </ProfileInfoCard>
                    </MotionWrapper>
                  </form>

                  <MotionWrapper
                    animation="fadeInUp"
                    delay={0.6}
                    className="pt-2 flex flex-col items-center transition-colors duration-300"
                  >
                    <button
                      onClick={confirmLogout}
                      className="group cursor-pointer flex items-center mt-4 gap-3 text-red-500 hover:text-red-600 font-black text-lg transition-all active:scale-95 py-3 px-8 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 group-hover:bg-red-100 dark:group-hover:bg-red-950/40 transition-colors duration-300">
                        <LogOut className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      {t('common.profile_page.logout')}
                    </button>
                  </MotionWrapper>
                </div>
              </MotionContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sticky Save / Cancel Bar (Always visible when editing) ── */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-700 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium hidden sm:block">
                {t('common.profile_page.unsaved_changes', 'You have unsaved changes')}
              </p>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    formik.resetForm()
                  }}
                  className="bg-neutral-100 cursor-pointer dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 dark:text-white"
                >
                  {t('common.profile_page.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => formik.handleSubmit()}
                  disabled={formik.isSubmitting}
                  className="bg-primary cursor-pointer hover:bg-primary/80 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formik.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('common.profile_page.save_changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Overlay */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-neutral-950 flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative bg-primary/10 p-6 rounded-3xl">
                <Loader2 className="w-12 h-12 text-primary animate-spin stroke-[2.5]" />
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h2 className="text-2xl font-black text-primary dark:text-white">
                {t('common.profile_page.messages.logging_out')}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                {t('common.profile_page.messages.please_wait')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}
