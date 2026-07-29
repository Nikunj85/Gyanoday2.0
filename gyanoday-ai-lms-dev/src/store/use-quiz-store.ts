import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { generateChapterMcqs } from '@/app/actions/mcq-actions'
import { QuizAttemptStats, QuizQuestion } from '@/types/quiz'

import { useUserStore } from './user-store'
const clearAllQuizStorage = () => {
  if (typeof window === 'undefined') return
  const keysToRemove: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && (key.startsWith('quiz_questions_') || key.startsWith('quiz_answers_'))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => sessionStorage.removeItem(key))
}

interface QuizState {
  // State
  questions: QuizQuestion[]
  currentIndex: number
  score: number
  timeInSeconds: number
  userAnswers: Record<number, string[]>
  isGenerating: boolean
  generationError: 'quota_exceeded' | 'generic' | null
  chapterId: string | null
  isReviewMode: boolean
  startTime: string | null
  prevStats?: {
    score: string
    total: string
    time: string
  }
  lastAttemptStats?: {
    score: number
    total: number
    time: string
    correctCount: number
    startedAt: string
    submittedAt: string
  } | null
  lastAttemptId: string | null
  lastInsightForAttemptId: string | null

  // Actions
  initQuiz: (params: {
    chapterId: string | null
    isReviewMode: boolean
    prevScore?: string
    prevTotal?: string
    prevTime?: string
  }) => void
  setLastAttemptStats: (stats: QuizState['lastAttemptStats']) => void
  setLastAttemptId: (id: string | null) => void
  setLastInsightForAttemptId: (id: string | null) => void
  loadOrGenerateQuiz: () => Promise<void>
  handleNext: (
    selectedIds: string[],
    onComplete: (stats: QuizAttemptStats & { finalTime: string }) => void
  ) => void
  handleBack: () => void
  setTimeInSeconds: (time: number) => void
  reset: () => void
}

const EMPTY_ARRAY: string[] = []

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      questions: [],
      currentIndex: 0,
      score: 0,
      timeInSeconds: 5 * 60,
      userAnswers: {},
      isGenerating: false,
      generationError: null,
      chapterId: null,
      isReviewMode: false,
      startTime: null,
      lastAttemptStats: null,
      lastAttemptId: null,
      lastInsightForAttemptId: null,

      initQuiz: ({ chapterId, isReviewMode, prevScore, prevTotal, prevTime }) => {
        set({
          questions: [],
          currentIndex: 0,
          score: 0,
          userAnswers: {},
          chapterId,
          isReviewMode,
          isGenerating: true,
          generationError: null,
          startTime: new Date().toISOString(),
          prevStats: isReviewMode
            ? {
                score: prevScore || '0',
                total: prevTotal || '0',
                time: prevTime || '0:00',
              }
            : undefined,
        })

        // Aggressively clear ALL quiz storage on fresh attempt
        if (!isReviewMode) {
          clearAllQuizStorage()
        }
      },

      loadOrGenerateQuiz: async () => {
        const { chapterId, isReviewMode, questions } = get()
        if (!chapterId || questions.length > 0) return

        const storageKey = `quiz_questions_${chapterId}`

        if (isReviewMode) {
          try {
            set({ isGenerating: true })
            const savedQuestions = sessionStorage.getItem(storageKey)

            if (savedQuestions) {
              const parsed: QuizQuestion[] = JSON.parse(savedQuestions)
              if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                set({ questions: parsed })

                // Restore userAnswers from questions' studentAnswers
                const restoredAnswers: Record<number, string[]> = {}
                parsed.forEach((q, idx) => {
                  if (q.studentAnswers) {
                    restoredAnswers[idx] = q.studentAnswers
                  }
                })
                set({ userAnswers: restoredAnswers })
                return
              }
            }
          } catch (e) {
            console.error('Failed to parse saved questions', e)
          } finally {
            set({ isGenerating: false })
          }
          return
        }

        try {
          set({ isGenerating: true })
          const user = useUserStore.getState().user
          const response = await generateChapterMcqs(chapterId, user?.id)
          if (response?.questions) {
            const transformedQuestions: QuizQuestion[] = response.questions.map((q: any) => ({
              id: q.id.toString(),
              text: q.question,
              type: q.answer_type,
              options: Object.entries(q.options).map(([key, val]) => ({
                id: key,
                label: key as string,
                text: val as string,
              })),
              correctAnswerIds: q.correct_options,
            }))
            set({ questions: transformedQuestions })
            sessionStorage.setItem(storageKey, JSON.stringify(transformedQuestions))
          }
        } catch (error: any) {
          console.error('Failed to generate quiz:', error)
          if (error?.message?.includes('429') || error?.status === 429) {
            set({ generationError: 'quota_exceeded' })
          } else {
            set({ generationError: 'generic' })
          }
        } finally {
          set({ isGenerating: false })
        }
      },

      handleNext: (selectedIds, onComplete) => {
        const {
          currentIndex,
          questions,
          userAnswers,
          isReviewMode,
          chapterId,
          timeInSeconds,
          startTime,
          prevStats,
        } = get()

        const updatedAnswers = { ...userAnswers, [currentIndex]: selectedIds }
        set({ userAnswers: updatedAnswers })

        if (currentIndex < questions.length - 1) {
          set({ currentIndex: currentIndex + 1 })
          return
        }

        // Quiz Finished - Finalize and Calculate
        const finalTimeMins = Math.floor(timeInSeconds / 60)
        const finalTimeSecs = timeInSeconds % 60
        const finalTime = `${finalTimeMins}:${finalTimeSecs.toString().padStart(2, '0')}`
        const submittedAt = new Date().toISOString()

        if (isReviewMode) {
          onComplete({
            score: Number(prevStats?.score || 0),
            correctCount: Number(prevStats?.score || 0),
            totalQuestions: Number(prevStats?.total || questions.length),
            startedAt: startTime || new Date().toISOString(),
            submittedAt,
            finalTime: prevStats?.time || '0:00',
          })
          return
        }

        // Calculate final score and update questions with student answers
        let finalScore = 0
        const updatedQuestions = questions.map((q, idx) => {
          const answers = updatedAnswers[idx] || []
          const correctIds = q.correctAnswerIds

          // To be correct, student must select ALL correct options and NO wrong ones.
          const isCorrect =
            answers.length === correctIds.length &&
            answers.every((id: string) => correctIds.includes(id))

          if (isCorrect) finalScore++

          return { ...q, studentAnswers: answers }
        })

        set({ questions: updatedQuestions, score: finalScore })

        // Save consolidated questions for review mode
        if (chapterId) {
          const storageKey = `quiz_questions_${chapterId}`
          sessionStorage.setItem(storageKey, JSON.stringify(updatedQuestions))
          // Clear legacy answers key if it exists
          sessionStorage.removeItem(`quiz_answers_${chapterId}`)
        }

        const stats = {
          score: finalScore,
          total: questions.length,
          time: finalTime,
          correctCount: finalScore,
          startedAt: startTime || new Date().toISOString(),
          submittedAt,
        }

        set({ lastAttemptStats: stats })

        onComplete({
          score: finalScore,
          correctCount: finalScore,
          totalQuestions: questions.length,
          startedAt: startTime || new Date().toISOString(),
          submittedAt,
          finalTime,
        })
      },

      setLastAttemptStats: (stats) => set({ lastAttemptStats: stats }),
      setLastAttemptId: (id: string | null) => set({ lastAttemptId: id }),
      setLastInsightForAttemptId: (id: string | null) => set({ lastInsightForAttemptId: id }),

      handleBack: () => {
        const { currentIndex } = get()
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 })
        }
      },

      setTimeInSeconds: (time) => set({ timeInSeconds: time }),

      reset: () => {
        clearAllQuizStorage()
        set({
          questions: [],
          currentIndex: 0,
          score: 0,
          timeInSeconds: 5 * 60,
          userAnswers: {},
          isGenerating: false,
          generationError: null,
          chapterId: null,
          isReviewMode: false,
          startTime: null,
          prevStats: undefined,
          lastAttemptStats: null,
          lastAttemptId: null,
          lastInsightForAttemptId: null,
        })
      },
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        chapterId: state.chapterId,
        isReviewMode: state.isReviewMode,
        prevStats: state.prevStats,
        startTime: state.startTime,
        lastAttemptStats: state.lastAttemptStats,
        lastAttemptId: state.lastAttemptId,
        lastInsightForAttemptId: state.lastInsightForAttemptId,
        // questions and userAnswers are large and handled separately or could be added here if desired
      }),
    }
  )
)
