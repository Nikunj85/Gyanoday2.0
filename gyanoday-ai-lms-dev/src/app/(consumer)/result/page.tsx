'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'

import { generateAndSaveInsight } from '@/app/actions/insight-actions'
import { toggleChapterCompletion } from '@/app/actions/user-progress-actions'
import { generateStudentOverallSummary } from '@/app/actions/user-summary-actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import * as variants from '@/lib/animations/variants'
import { chapterService } from '@/services/chapter-service'
import { insightService } from '@/services/insight-service'
import { userProgressService } from '@/services/user-progress-service'
import { useChapterStore } from '@/store/chapter-store'
import { useQuizStore } from '@/store/use-quiz-store'
import { useUserStore } from '@/store/user-store'

import { ResultCard } from '../../components/ResultCard'
import { ReviewAnswerDrawer } from '@/components/common/ReviewAnswerDrawer'

function ResultContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const { chapterId, lastAttemptStats, lastAttemptId, initQuiz, isReviewMode, topic, questions } =
    useQuizStore()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = React.useState(false)

  const score = lastAttemptStats?.score.toString() || '0'
  const total = lastAttemptStats?.total.toString() || '0'
  const time = lastAttemptStats?.time || '0:00'

  const { data: chapter, isLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => chapterService.getById(chapterId!),
    enabled: !!chapterId,
  })

  if (!lastAttemptStats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <MotionWrapper animation="fadeInUp">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-neutral-800">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('common.quiz_result.no_result_title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {t('common.quiz_result.no_result_desc')}
            </p>
            <button
              onClick={() => router.replace(`/dashboard`)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {t('common.quiz_result.go_back_to_subjects')}
            </button>
          </div>
        </MotionWrapper>
      </div>
    )
  }

  // State Protection
  React.useEffect(() => {
    if (!chapterId || !lastAttemptStats) {
      const subjectId = useChapterStore.getState().activeChapter?.subject_id
      if (subjectId) {
        router.replace(`/subjects/${subjectId}`)
      } else {
        router.replace('/dashboard')
      }
    }
  }, [chapterId, lastAttemptStats, router])

  const { user } = useUserStore()

  const { data: userProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['user-progress', user?.id, chapterId],
    queryFn: () => userProgressService.getProgress(user!.id, [chapterId!]),
    enabled: !!user?.id && !!chapterId,
  })
  const queryClient = useQueryClient()

  const [insight, setInsight] = React.useState<{
    insight_text: string
    weak_areas: string[]
  } | null>(null)
  const [isInsightLoading, setIsInsightLoading] = React.useState(false)
  const [insightError, setInsightError] = React.useState<'quota_exceeded' | 'generic' | null>(null)
  const hasFetched = React.useRef(false)

  React.useEffect(() => {
    const fetchInsight = async () => {
      if (
        !chapterId ||
        !user ||
        !chapter ||
        isInsightLoading ||
        hasFetched.current ||
        !lastAttemptId
      )
        return

      hasFetched.current = true
      setIsInsightLoading(true)
      setInsightError(null)

      try {
        const scoreNum = parseInt(score)
        const totalNum = parseInt(total)

        // 1. Check if insight was already generated for this attempt (via store flag)
        const alreadyGenerated = useQuizStore.getState().lastInsightForAttemptId === lastAttemptId

        if (alreadyGenerated) {
          // Just fetch the latest insight from DB — no need to regenerate
          try {
            const existingInsight = await insightService.getLatestInsight(user.id, chapterId)
            if (existingInsight) {
              setInsight(existingInsight)
              setIsInsightLoading(false)
              return
            }
          } catch (err) {
            console.warn('Failed to fetch existing insight, proceeding to generate', err)
          }
        }

        // 2. No insight for this attempt yet — generate a new one
        if (score && total && chapter) {
          let quizContext: any[] = []
          try {
            const questionsJson = sessionStorage.getItem(`quiz_questions_${chapterId}`)

            if (questionsJson) {
              const questions = JSON.parse(questionsJson)

              quizContext = questions.map((q: any) => {
                const studentAnswers = q.studentAnswers || []
                const userAnswer =
                  studentAnswers.length > 0
                    ? studentAnswers
                        .map((id: string) => q.options.find((opt: any) => opt.id === id)?.text)
                        .filter(Boolean)
                        .join(', ')
                    : 'Skipped'

                const correctAnswer =
                  q.options
                    .filter((opt: any) => q.correctAnswerIds.includes(opt.id))
                    .map((opt: any) => opt.text)
                    .join(', ') || 'Unknown'

                const isCorrect = studentAnswers.some((id: string) =>
                  q.correctAnswerIds.includes(id)
                )

                return {
                  question: q.text,
                  userAnswer,
                  correctAnswer,
                  isCorrect,
                }
              })
            }
          } catch (e) {
            console.error('Failed to load quiz context from session:', e)
          }

          const newInsight = await generateAndSaveInsight(
            user.id,
            chapterId,
            scoreNum,
            totalNum,
            time,
            quizContext
          )

          if (newInsight && '_error' in newInsight) {
            setInsightError(newInsight._error as any)
            // Mark as generated anyway so we don't infinitely retry on reload
            useQuizStore.getState().setLastInsightForAttemptId(lastAttemptId)
          } else if (newInsight) {
            setInsight({
              insight_text: (newInsight as any).insight_text,
              weak_areas: (newInsight as any).weak_areas,
            })

            // Mark this attempt as having an insight generated
            useQuizStore.getState().setLastInsightForAttemptId(lastAttemptId)

            // REFRESH Sidebar & Dashboard Data
            queryClient.invalidateQueries({ queryKey: ['chapter-attempts', user.id] })
            queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] })
            queryClient.invalidateQueries({ queryKey: ['student-progress'] })

            // Generate overall summary in background since we have new data
            generateStudentOverallSummary(user.id, user.language || 'en', user.name).then(
              (res: any) => {
                if (res.success && res.summary) {
                  useUserStore.getState().setOverallSummary(res.summary)
                  if (res.score) {
                    useUserStore.getState().setOverallScore(res.score)
                  }
                }
              }
            )
          } else {
            setInsightError('generic')
            useQuizStore.getState().setLastInsightForAttemptId(lastAttemptId)
          }
        }
      } catch (e) {
        console.error('Failed to load insight', e)
        hasFetched.current = false // Reset on failure so it can retry
      } finally {
        setIsInsightLoading(false)
      }
    }

    fetchInsight()
  }, [chapterId, user, chapter, score, total, lastAttemptId, queryClient])

  // 7-second timer for completion dialog
  React.useEffect(() => {
    // Bail out if data is still loading
    if (isProgressLoading) return

    // Only show if:
    // 1. Not in review mode
    // 2. We have a chapter and user
    // 3. The chapter is NOT already marked as completed
    // 4. Student has scored at least 80% (score >= 0.8 * total)
    const isCompleted = userProgress?.[0]?.is_completed
    const currentScore = lastAttemptStats?.score || 0
    const totalQuestions = lastAttemptStats?.total || 0
    const percentage = totalQuestions > 0 ? (currentScore / totalQuestions) * 100 : 0

    if (!chapterId || !user || isReviewMode || isCompleted || percentage < 80) return

    const timer = setTimeout(() => {
      setIsDialogOpen(true)
    }, 7000)

    return () => clearTimeout(timer)
  }, [chapterId, user, isReviewMode, userProgress, lastAttemptStats, isProgressLoading])

  const handleComplete = async () => {
    if (!user?.id || !chapterId) return

    setIsCompleting(true)
    try {
      const result = await toggleChapterCompletion(user.id, chapterId, true)
      if (result.success) {
        // REFRESH Sidebar & Dashboard Data
        queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] })
        queryClient.invalidateQueries({ queryKey: ['student-progress'] })

        toast({
          title: t('common.quiz_result.completion_dialog.success_title'),
          description: t('common.quiz_result.completion_dialog.success_desc'),
        })
        setIsDialogOpen(false)
      } else {
        toast({
          title: t('common.quiz_result.completion_dialog.error_title'),
          description: result.error || t('common.quiz_result.completion_dialog.error_desc'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: t('common.quiz_result.completion_dialog.error_title'),
        description: t('common.quiz_result.completion_dialog.unexpected_error'),
        variant: 'destructive',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleReTest = () => {
    if (chapterId) {
      initQuiz({
        chapterId,
        isReviewMode: false,
        topic, // retry the same topic-scoped quiz if this was one
      })
      router.replace(`/quiz`)
    } else {
      const subjectId = useChapterStore.getState().activeChapter?.subject_id
      if (subjectId) {
        router.replace(`/subjects/${subjectId}`)
      } else {
        router.replace('/dashboard')
      }
    }
  }

  const handleDashboard = () => {
    router.replace(`/subjects/${chapter?.subject_id}`)
  }

  // Opens an in-place drawer instead of navigating to a whole separate
  // "review mode" page render — the questions and the student's own
  // answers are already sitting in the store from the attempt just taken.
  const handleReview = () => {
    setIsReviewDrawerOpen(true)
  }

  const subjectColor = chapter?.subject?.color_code || 'var(--ariana-pink)'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="relative overflow-hidden pt-2 lg:pt-0  lg:pb-20 pb-10 bg-background transition-colors duration-300 min-h-screen">
      {/* Sub-Header Section */}
      <MotionWrapper animation="fadeInDown" duration={1.2}>
        <div className="w-full bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 py-6 mb-10 px-4 transition-colors duration-300 shadow-sm">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <h1
                className="text-xl md:text-2xl font-bold drop-shadow-sm"
                style={{ color: subjectColor }}
              >
                {chapter?.title || 'Ch:1 Linear Equations in Two Variables'}
              </h1>
            </div>
            <div className="shrink-0">
              <div
                className="px-6 py-2 rounded-xl border-2 bg-white dark:bg-neutral-800 transition-colors duration-300 shadow-sm"
                style={{ borderColor: `${subjectColor}33` }}
              >
                <span
                  className="font-bold text-2xl tabular-nums drop-shadow-sm"
                  style={{ color: subjectColor }}
                >
                  {time}
                </span>
              </div>
            </div>
          </div>
        </div>
      </MotionWrapper>

      {/* Result Section */}
      <div className="container mx-auto px-2 relative z-10 ">
        <MotionWrapper animation="fadeInUp" delay={0.2}>
          <ResultCard
            score={parseInt(score)}
            totalQuestions={parseInt(total)}
            onReview={handleReview}
            onPlayAgain={handleReTest}
            onDashboard={handleDashboard}
            primaryColor={subjectColor}
            insight={insight}
            isLoading={isInsightLoading}
            error={insightError}
          />
        </MotionWrapper>
      </div>

      <ReviewAnswerDrawer
        open={isReviewDrawerOpen}
        onOpenChange={setIsReviewDrawerOpen}
        questions={questions}
      />

      {/* Left Mascot - Monkey on branch */}
      <MotionWrapper
        animation="fadeInLeft"
        delay={0.4}
        className="absolute top-35 -left-4 pointer-events-none z-0 hidden xl:block"
      >
        <Image
          src="/monkeytree.png"
          alt="Monkey mascot"
          width={200}
          height={200}
          className="object-contain -scale-x-100 bottom-30"
        />
      </MotionWrapper>

      {/* Right Mascot - Giraffe reading */}
      <MotionWrapper
        animation="fadeInRight"
        delay={0.6}
        className="absolute bottom-30 right-0 pointer-events-none z-0 hidden xl:block"
      >
        <Image
          src="/Giraffe2.png"
          alt="Giraffe mascot"
          width={200}
          height={200}
          className="object-contain"
        />
      </MotionWrapper>

      {/* Completion Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent className="max-w-[400px] border-none bg-transparent p-0 shadow-none">
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={variants.springScale}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-neutral-800 relative overflow-hidden"
              >
                {/* Decorative background elements */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl"
                  style={{ backgroundColor: subjectColor }}
                />

                <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                  {/* Icon with animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${subjectColor}15` }}
                  >
                    <CheckCircle2 className="w-10 h-10" style={{ color: subjectColor }} />
                  </motion.div>

                  <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {t('common.quiz_result.completion_dialog.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-gray-600 dark:text-gray-400">
                      {t('common.quiz_result.completion_dialog.description')} "
                      <span className="font-bold" style={{ color: subjectColor }}>
                        {chapter?.title}
                      </span>
                      " {t('common.quiz_result.completion_dialog.as_completed')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="w-full flex flex-col sm:flex-row gap-3 pt-2">
                    <AlertDialogCancel
                      disabled={isCompleting}
                      className="flex-1 h-12 rounded-xl border-2 border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all font-semibold cursor-pointer"
                    >
                      {t('common.quiz_result.completion_dialog.no')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()
                        handleComplete()
                      }}
                      disabled={isCompleting}
                      className="flex-1 h-12 rounded-xl text-white shadow-lg hover:shadow-xl active:scale-95 transition-all font-semibold cursor-pointer border-none"
                      style={{ backgroundColor: subjectColor }}
                    >
                      {isCompleting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('common.quiz_result.completion_dialog.processing')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>{t('common.quiz_result.completion_dialog.yes')}</span>
                        </div>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </div>
              </motion.div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
    </main>
  )
}

export default function ResultPage() {
  const { t } = useTranslation()
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex items-center justify-center text-white/50 text-xl font-bold">
          Loading...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
