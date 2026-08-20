'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { chapterService } from '@/services/chapter-service'
import { quizService } from '@/services/quiz-service'
import { useChapterStore } from '@/store/chapter-store'
import { useQuizStore } from '@/store/use-quiz-store'
import { useUserStore } from '@/store/user-store'

import { ExitConfirmationDialog } from '../components/ExitConfirmationDialog'
import { QuizCard } from '../components/QuizCard'
import { QuizCardSkeleton } from '../components/QuizCardSkeleton'
import { QuizHeader } from '../components/QuizHeader'
import { Timer } from '../components/Timer'

const EMPTY_ARRAY: string[] = []

function QuizContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useUserStore()

  const {
    questions,
    currentIndex,
    isGenerating,
    generationError,
    userAnswers,
    initQuiz,
    loadOrGenerateQuiz,
    handleNext: storeHandleNext,
    handleBack: storeHandleBack,
    setTimeInSeconds,
    reset: resetQuiz,
    chapterId,
    isReviewMode,
    prevStats,
  } = useQuizStore()

  const [showExitDialog, setShowExitDialog] = React.useState(false)
  const isNavigatingRef = React.useRef(false)

  const prevTime = prevStats?.time || '0:00'

  // Fetch Chapter Details
  const { data: chapter, isLoading: isChapterLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => chapterService.getById(chapterId!),
    enabled: !!chapterId,
  })

  // Navigation Protection
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isReviewMode && (questions.length > 0 || isGenerating) && !isNavigatingRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (!isReviewMode && (questions.length > 0 || isGenerating) && !isNavigatingRef.current) {
        window.history.forward()
        setShowExitDialog(true)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isReviewMode, questions.length, isGenerating])

  // State Protection & Initialization
  React.useEffect(() => {
    if (!chapterId && !isGenerating && questions.length === 0) {
      const subjectId = useChapterStore.getState().activeChapter?.subject_id
      if (subjectId) {
        router.replace(`/subjects/${subjectId}`)
      } else {
        router.replace('/student-dashboard')
      }
    }
  }, [chapterId, isGenerating, questions.length, router])

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Load or Generate Questions
  React.useEffect(() => {
    if (chapter && chapter.pdf_url) {
      loadOrGenerateQuiz()
    }
  }, [chapter, loadOrGenerateQuiz])

  const handleNext = async (selectedIds: string[]) => {
    // If it's genuinely the last question (nothing more is still streaming
    // in) and not review mode, set submitting state. If more questions are
    // still being generated, storeHandleNext will just advance instead of
    // finishing the quiz — don't show a submitting spinner for that case.
    const isLastQuestion =
      currentIndex === questions.length - 1 && !useQuizStore.getState().isGeneratingMore
    if (isLastQuestion && !isReviewMode) {
      setIsSubmitting(true)
    }

    storeHandleNext(selectedIds, async (stats) => {
      // PERSIST TO SUPABASE
      if (!isReviewMode && user && chapterId) {
        try {
          const attempt = await quizService.saveQuizAttempt(
            chapterId,
            user.id,
            stats,
            chapter?.title,
            useQuizStore.getState().topic || undefined
          )
          if (attempt?.id) {
            useQuizStore.getState().setLastAttemptId(attempt.id)
          }
        } catch (err) {
          setIsSubmitting(false) // Reset on error
        }
      }

      isNavigatingRef.current = true
      router.replace(`/result`)
    })
  }

  const handleBack = () => {
    storeHandleBack()
  }

  const handleQuit = () => {
    if (isReviewMode) {
      isNavigatingRef.current = true
      router.replace('/student-dashboard')
      return
    }
    setShowExitDialog(true)
  }

  const confirmExit = () => {
    const subjectUrl = `/subjects/${chapter?.subject_id}`
    isNavigatingRef.current = true
    setShowExitDialog(false)
    router.replace(subjectUrl)
  }

  const subjectColor = chapter?.subject?.color_code || 'var(--ariana-pink)'

  const currentSelections = React.useMemo(() => {
    return userAnswers[currentIndex] || EMPTY_ARRAY
  }, [userAnswers, currentIndex])

  if (isChapterLoading || isGenerating) {
    return (
      <main className="overflow-hidden pt-4 md:pt-1 md:pb-2 pb-20 bg-background transition-colors duration-300 min-h-screen">
        <div className="w-full bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 py-4 mb-4 px-4 shadow-sm animate-pulse">
          <div className="container mx-auto relative flex flex-col md:flex-row items-center justify-between gap-4 min-h-[60px]">
            <div className="h-10 w-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
            <div className="h-8 w-64 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
            <div className="h-10 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
          </div>
        </div>

        <div className="container mx-auto px-4">
          <MotionWrapper animation="fadeInUp" duration={0.8}>
            <QuizCardSkeleton />
          </MotionWrapper>
        </div>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <MotionWrapper animation="fadeInUp">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-neutral-800">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {generationError === 'quota_exceeded'
                ? t('common.quiz.error_title', 'Generation Limit Reached')
                : t('common.quiz.error_title', 'Oops!')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {generationError === 'quota_exceeded'
                ? t('common.quiz.quota_exceeded')
                : t('common.quiz.no_questions')}
            </p>
            <button
              onClick={() => router.replace(`/subjects/${chapter?.subject_id}`)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {t('common.quiz.go_back')}
            </button>
          </div>
        </MotionWrapper>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  // The student reached an index that hasn't streamed in yet (rare — only
  // happens if they answer faster than the remaining questions generate).
  // Show a brief inline loader instead of crashing on undefined.
  if (!currentQuestion) {
    return (
      <main className="overflow-hidden pt-4 md:pt-1 md:pb-2 pb-20 bg-background transition-colors duration-300 min-h-screen">
        <div className="container mx-auto px-4">
          <MotionWrapper animation="fadeInUp" duration={0.5}>
            <QuizCardSkeleton />
          </MotionWrapper>
        </div>
      </main>
    )
  }

  return (
    <main className="overflow-hidden pt-0 md:pt-0 md:pb-2 pb-20 transition-colors duration-300  flex flex-col relative">
      <QuizHeader
        title={chapter?.title}
        subjectColor={subjectColor}
        isReviewMode={isReviewMode}
        prevTime={prevTime}
        onQuit={handleQuit}
        onTimeUpdate={setTimeInSeconds}
      />

      {/* Quiz Section */}
      <div className="container mx-auto px-4 flex-grow mb-40">
        <MotionWrapper animation="fadeInUp" delay={0.2} key={currentIndex}>
          <QuizCard
            totalQuestions={questions.length}
            currentQuestionIndex={currentIndex}
            questionText={currentQuestion.text}
            questionImage={currentQuestion.questionImage}
            options={currentQuestion.options}
            type={currentQuestion.type}
            onNext={handleNext}
            onBack={handleBack}
            reviewMode={isReviewMode}
            initialSelections={currentSelections}
            primaryColor={subjectColor}
            correctAnswerIds={currentQuestion.correctAnswerIds}
            isSubmitting={isSubmitting}
          />
        </MotionWrapper>
      </div>

      {/* Footer Area with Giraffe */}
      <div className=" bottom-0 left-0 w-full z-10 pointer-events-none">
        {/* The colored strip at the bottom */}

        {/* Container for Giraffe and Bubble */}
        <div className="container mx-auto px-1 relative h-0">
          <MotionWrapper
            animation="fadeInLeft"
            delay={0.4}
            className="absolute bottom-2 left-0 md:left-8 flex items-end ml-0 md:ml-4"
          >
            <div className="relative flex items-center -mb-15 md:mb-8">
              {/* Giraffe Image */}
              <div className="w-20 h-20 md:w-28 md:h-28 transition-transform hover:scale-105 origin-bottom-left">
                <Image
                  src="/Giraffe.png"
                  alt="Giraffe mascot"
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>

              {/* Speech Bubble */}
              <div className="relative mb-12 ml-[-1px] md:ml-[10px] z-20">
                <div
                  className="text-white px-4 py-2 md:px-6 md:py-3 rounded-[24px] rounded-bl-none shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: subjectColor }}
                >
                  <span className="text-xs md:text-base font-bold text-white">
                    {t('common.quiz.believe_in_yourself')}
                  </span>
                </div>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </div>

      <ExitConfirmationDialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onConfirm={confirmExit}
        primaryColor={subjectColor}
      />
    </main>
  )
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" />
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  )
}
