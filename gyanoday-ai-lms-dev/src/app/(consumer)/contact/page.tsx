'use client'

import { useFormik } from 'formik'
import { BookOpen, Mail, MapPin, MessageSquare, Phone, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { submitContactForm } from '@/app/actions/contact-actions'
import { useToast } from '@/components/ui/use-toast'
import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'

import monkeytree from '../../../../public/monkeytree.png'

export default function Contact() {
  const { t } = useTranslation()
  const { toast } = useToast()

  // Localized Validation schema
  const contactSchema = z.object({
    fullName: z
      .string()
      .min(1, t('common.contact_page.validation.name_required'))
      .min(2, t('common.contact_page.validation.name_min')),
    email: z
      .string()
      .min(1, t('common.contact_page.validation.email_required'))
      .email(t('common.contact_page.validation.email_invalid')),
    class: z.string().min(1, t('common.contact_page.validation.class_required')),
    message: z
      .string()
      .min(1, t('common.contact_page.validation.message_required'))
      .min(10, t('common.contact_page.validation.message_min')),
  })

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      class: '',
      message: '',
    },
    validate: (values) => {
      const result = contactSchema.safeParse(values)
      if (result.success) return {}
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0])
        if (!errors[key]) {
          errors[key] = issue.message
        }
      })
      return errors
    },
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const result = await submitContactForm(values)

        if (result.success) {
          toast({
            title: t('common.contact_page.toast.success_title') || 'Message Sent! 🚀',
            description:
              t('common.contact_page.toast.success_desc') ||
              "We've received your message and will get back to you soon.",
            variant: 'default',
            className:
              'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 font-medium',
          })
          resetForm()
        } else {
          toast({
            title: t('common.contact_page.toast.error_title') || 'Oops!',
            description:
              result.error || t('common.contact_page.toast.error_desc') || 'Something went wrong.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: t('common.contact_page.toast.error_title') || 'Oops!',
          description:
            t('common.contact_page.toast.unexpected_error') || 'An unexpected error occurred.',
          variant: 'destructive',
        })
      } finally {
        setSubmitting(false)
      }
    },
  })

  // Auto-expand textarea logic
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    formik.handleChange(e)
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto'
    target.style.height = `${target.scrollHeight}px`
  }

  return (
    <main className="pt-10 md:pt-13 pb-10 w-full min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-0 md:px-0 lg:px-1 xl:px-20 2xl:px-10 mb-6 relative">
        {/* Main White Container */}
        <MotionWrapper
          animation="fadeInUp"
          duration={1.2}
          className="bg-background rounded-[48px] p-8 md:p-13 shadow-[0_10px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_50px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-neutral-800 relative overflow-visible transition-colors duration-300"
        >
          {/* Monkey Mascot Overlap */}
          <MotionWrapper
            animation="fadeInRight"
            delay={0.5}
            duration={1.5}
            className="absolute -top-50 -right-10 md:top-5 md:-right-4 w-32 md:w-56 h-auto pointer-events-none z-10 hidden md:block"
          >
            <Image
              src={monkeytree}
              alt="Monkey on tree"
              width={250}
              height={250}
              className="object-contain"
            />
          </MotionWrapper>

          {/* Header */}
          <MotionWrapper animation="fadeInUp" className="mb-12 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold dark:text-lavender-mist transition-colors duration-300">
              {t('common.contact_page.title')}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium transition-colors duration-300">
              {t('common.contact_page.subtext')}
            </p>
          </MotionWrapper>

          {/* Nested Card Grid */}
          <MotionWrapper
            animation="fadeInUp"
            delay={0.2}
            className="bg-background rounded-[32px] border border-gray-100 dark:border-neutral-800 p-5 md:p-10 shadow-[0_10px_50px_rgba(0,0,0,0.10)] dark:shadow-[0_10px_50px_rgba(0,0,0,0.5)] transition-colors duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
              {/* Left Column - Form */}
              <form
                onSubmit={formik.handleSubmit}
                className="space-y-3 lg:border-r lg:border-gray-300 lg:dark:border-neutral-800 lg:pr-26 pl-2 lg:pl-5"
              >
                <MotionContainer staggerChildren={0.1}>
                  <div className="space-y-6">
                    <MotionWrapper animation="fadeInUp">
                      <h2 className="text-philosophy dark:text-lavender-mist text-xl font-bold transition-colors duration-300">
                        {t('common.contact_page.student_info')}
                      </h2>
                    </MotionWrapper>
                    <div className="space-y-2">
                      {/* Full Name Field */}
                      <MotionWrapper animation="fadeInRight">
                        <div className="relative group">
                          <input
                            type="text"
                            name="fullName"
                            placeholder={t('common.contact_page.placeholders.full_name')}
                            value={formik.values.fullName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`w-full bg-ghost-white dark:bg-neutral-800 border ${
                              formik.touched.fullName && formik.errors.fullName
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-100 dark:border-neutral-700'
                            } pl-14 pr-14 py-4 rounded-xl focus:outline-none focus:border-philosophy/30 dark:focus:border-lavender-mist/30 transition-all text-primary-black dark:text-white placeholder-neutral-400`}
                          />
                          <User className="absolute text-philosophy dark:text-lavender-mist right-6 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-philosophy dark:group-focus-within:text-lavender-mist transition-colors" />
                        </div>
                        {formik.touched.fullName && formik.errors.fullName && (
                          <p className="text-red-500 text-sm ml-2">{formik.errors.fullName}</p>
                        )}
                      </MotionWrapper>

                      {/* Email Field */}
                      <MotionWrapper animation="fadeInRight" delay={0.1}>
                        <div className="relative group">
                          <input
                            type="email"
                            name="email"
                            placeholder={t('common.contact_page.placeholders.email')}
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`w-full bg-ghost-white dark:bg-neutral-800 border ${
                              formik.touched.email && formik.errors.email
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-100 dark:border-neutral-700'
                            } pl-14 pr-14 py-4 rounded-xl focus:outline-none focus:border-philosophy/30 dark:focus:border-lavender-mist/30 transition-all text-primary-black dark:text-white placeholder-neutral-400`}
                          />
                          <Mail className="absolute text-philosophy dark:text-lavender-mist right-6 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-philosophy dark:group-focus-within:text-lavender-mist transition-colors" />
                        </div>
                        {formik.touched.email && formik.errors.email && (
                          <p className="text-red-500 text-sm ml-2">{formik.errors.email}</p>
                        )}
                      </MotionWrapper>
                    </div>
                  </div>

                  <div className="space-y-6 lg:space-y-2 mt-6">
                    <MotionWrapper animation="fadeInUp">
                      <h2 className="text-philosophy dark:text-lavender-mist text-xl font-bold transition-colors duration-300">
                        {t('common.contact_page.academic_info')}
                      </h2>
                    </MotionWrapper>
                    <div className="space-y-2">
                      {/* Class Field */}
                      <MotionWrapper animation="fadeInRight" delay={0.2}>
                        <div className="relative group">
                          <input
                            type="text"
                            name="class"
                            placeholder={t('common.contact_page.placeholders.class')}
                            value={formik.values.class}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`w-full bg-ghost-white dark:bg-neutral-800 border ${
                              formik.touched.class && formik.errors.class
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-100 dark:border-neutral-700'
                            } pl-14 pr-14 py-4 rounded-xl focus:outline-none focus:border-philosophy/30 dark:focus:border-lavender-mist/30 transition-all text-primary-black dark:text-white placeholder-neutral-400`}
                          />
                          <BookOpen className="absolute text-philosophy dark:text-lavender-mist right-6 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-philosophy dark:group-focus-within:text-lavender-mist transition-colors" />
                        </div>
                        {formik.touched.class && formik.errors.class && (
                          <p className="text-red-500 text-sm ml-2">{formik.errors.class}</p>
                        )}
                      </MotionWrapper>

                      {/* Message Field */}
                      <MotionWrapper animation="fadeInRight" delay={0.3}>
                        <div className="relative group">
                          <textarea
                            name="message"
                            placeholder={t('common.contact_page.placeholders.message')}
                            rows={3}
                            value={formik.values.message}
                            onChange={handleTextareaChange}
                            onBlur={formik.handleBlur}
                            className={`w-full bg-ghost-white dark:bg-neutral-800 border ${
                              formik.touched.message && formik.errors.message
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-100 dark:border-neutral-700'
                            } pl-14 pr-14 py-4 rounded-xl focus:outline-none focus:border-philosophy/30 dark:focus:border-lavender-mist/30 transition-all text-primary-black dark:text-white placeholder-neutral-400 resize-none overflow-hidden`}
                          />
                          <MessageSquare className="absolute text-philosophy dark:text-lavender-mist right-6 top-6 w-5 h-5 group-focus-within:text-philosophy dark:group-focus-within:text-lavender-mist transition-colors" />
                        </div>
                        {formik.touched.message && formik.errors.message && (
                          <p className="text-red-500 text-sm ml-2">{formik.errors.message}</p>
                        )}
                      </MotionWrapper>
                    </div>
                  </div>

                  <MotionWrapper animation="scaleIn" delay={0.5} className="mt-6">
                    <button
                      type="submit"
                      className="bg-primary cursor-pointer hover:bg-primary-hover text-white px-3 py-2 lg:py-3 lg:px-5 rounded-md font-bold lg:text-lg text-base transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={formik.isSubmitting}
                    >
                      {formik.isSubmitting ? 'Sending...' : t('common.contact_page.send_message')}
                    </button>
                  </MotionWrapper>
                </MotionContainer>
              </form>

              {/* Right Column - Contact Info */}
              <div className="flex flex-col pl-0 pr-0 md:pl-0 md:pr-0 lg:pl-1 lg:pr-16 xl:pl-10 xl:pr-15 2xl:pl-15 2xl:pr-22 ">
                <MotionWrapper animation="fadeInUp">
                  <h2 className="text-philosophy dark:text-lavender-mist text-xl font-bold mb-6 transition-colors duration-300">
                    {t('common.contact_page.contact_info')}
                  </h2>
                </MotionWrapper>
                <MotionContainer
                  staggerChildren={0.2}
                  delayChildren={0.3}
                  className="space-y-5 flex-grow flex flex-col justify-start"
                >
                  <MotionWrapper animation="fadeInRight">
                    <Link
                      href="mailto:nikunjpoddar85@gmail.com"
                      className="bg-pale-cornflower-blue dark:bg-pale-cornflower-blue/20 hover:bg-pale-cornflower-blue/80 dark:hover:bg-pale-cornflower-blue/30 transition-colors p-6 rounded-[10px] flex items-center gap-6 group cursor-pointer text-left w-full block"
                    >
                      <div className="w-12 h-12 bg-white/50 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-philosophy dark:text-lavender-mist transition-colors duration-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-philosophy dark:text-lavender-mist font-bold transition-colors duration-300">
                          {t('common.contact_page.labels.email')}
                        </p>
                        <p className="text-philosophy/80 dark:text-lavender-mist/80 font-medium text-sm sm:text-md lg:text-base xl:text-lg 2xl:text-md transition-colors duration-300">
                          nikunjpoddar85@gmail.com
                        </p>
                      </div>
                    </Link>
                  </MotionWrapper>

                  <MotionWrapper animation="fadeInRight">
                    <Link
                      href="https://wa.me/919429205342"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-queen-pink dark:bg-queen-pink/20 hover:bg-queen-pink/80 dark:hover:bg-queen-pink/30 transition-colors p-6 rounded-[10px] flex items-center gap-6 group cursor-pointer text-left w-full block"
                    >
                      <div className="w-12 h-12 bg-white/50 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-philosophy dark:text-lavender-mist transition-colors duration-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-philosophy dark:text-lavender-mist font-bold transition-colors duration-300">
                          {t('common.contact_page.labels.phone')}
                        </p>
                        <p className="text-philosophy/80 dark:text-lavender-mist/80 font-medium transition-colors duration-300">
                          +91 94292 05342
                        </p>
                      </div>
                    </Link>
                  </MotionWrapper>

                  <MotionWrapper animation="fadeInRight">
                    <div className="bg-aero-blue dark:bg-aero-blue/20 hover:bg-aero-blue/80 dark:hover:bg-aero-blue/30 transition-colors p-6 rounded-[10px] flex items-center gap-6 group cursor-pointer text-left">
                      <div className="w-12 h-12 bg-white/50 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-philosophy dark:text-lavender-mist transition-colors duration-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-philosophy dark:text-lavender-mist font-bold transition-colors duration-300">
                          {t('common.contact_page.labels.location')}
                        </p>
                        <p className="text-philosophy/80 dark:text-lavender-mist/80 font-medium text-sm leading-tight transition-colors duration-300">
                          {t('common.contact_page.values.location')}
                        </p>
                      </div>
                    </div>
                  </MotionWrapper>
                </MotionContainer>
              </div>
            </div>
          </MotionWrapper>
        </MotionWrapper>
      </div>
    </main>
  )
}
