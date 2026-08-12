import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { QuizAttemptStats, QuizQuestion } from '@/types/quiz'

import { useUserStore } from './user-store'

function transformQuestion(q: any): QuizQuestion {
  return {
    id: q.id.toString(),
    text: q.question,
    type: q.answer_type,
    options: Object.entries(q.options).map(([key, val]) => ({
      id: key,
      label: key as string,
      text: val as string,
    })),
    correctAnswerIds: q.correct_options,
  }
}
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
  // True from when question 1 arrives until the rest have finished
  // streaming in — lets the UI let the student start immediately while
  // more questions continue loading in the background.
  isGeneratingMore: boolean
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
      isGeneratingMore: false,
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
          isGeneratingMore: false,
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
          set({ isGenerating: true, isGeneratingMore: true })
          const user = useUserStore.getState().user

          const response = await fetch('/api/quiz/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapterId, userId: user?.id }),
          })

          if (!response.body) {
            throw new Error('No response body from quiz generation')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let lineBuffer = ''
          let sawAnyQuestion = false
          let streamError: string | null = null

          const processLine = (line: string) => {
            if (!line.trim()) return
            let event: any
            try {
              event = JSON.parse(line)
            } catch {
              return
            }

            if (event.type === 'question') {
              const question = transformQuestion(event.data)
              const current = get().questions
              // Guard against duplicates if the stream ever redelivers one.
              if (current.some((q) => q.id === question.id)) return

              const updated = [...current, question]
              set({ questions: updated })

              // As soon as the FIRST question exists, let the student start —
              // the rest continue loading in the background instead of
              // blocking the whole screen.
              if (!sawAnyQuestion) {
                sawAnyQuestion = true
                set({ isGenerating: false })
              }
              sessionStorage.setItem(storageKey, JSON.stringify(updated))
            } else if (event.type === 'done') {
              // Authoritative final list — reconcile in case ordering or a
              // dropped chunk left us with a mismatch versus the validated
              // full result.
              if (event.data?.questions) {
                const finalQuestions: QuizQuestion[] = event.data.questions.map(transformQuestion)
                set({ questions: finalQuestions })
                sessionStorage.setItem(storageKey, JSON.stringify(finalQuestions))
              }
            } else if (event.type === 'error') {
              streamError = event.message || 'generic'
            }
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            lineBuffer += decoder.decode(value, { stream: true })
            const lines = lineBuffer.split('\n')
            lineBuffer = lines.pop() || ''
            for (const line of lines) processLine(line)
          }
          if (lineBuffer.trim()) processLine(lineBuffer)

          if (streamError && !sawAnyQuestion) {
            const err = streamError as string
            if (err.includes('429') || err.toLowerCase().includes('quota')) {
              set({ generationError: 'quota_exceeded' })
            } else {
              set({ generationError: 'generic' })
            }
          }
        } catch (error: any) {
          console.error('Failed to generate quiz:', error)
          if (get().questions.length === 0) {
            if (error?.message?.includes('429') || error?.status === 429) {
              set({ generationError: 'quota_exceeded' })
            } else {
              set({ generationError: 'generic' })
            }
          }
        } finally {
          set({ isGenerating: false, isGeneratingMore: false })
        }
      },

      handleNext: (selectedIds, onComplete) => {
        const {
          currentIndex,
          questions,
          userAnswers,
          isReviewMode,
          isGeneratingMore,
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

        // Reached the last question that's loaded SO FAR — if more are
        // still streaming in from generation, advance to that (not-yet-
        // rendered) index anyway; the page shows a brief inline loader
        // until it arrives, rather than ending the quiz early.
        if (isGeneratingMore && !isReviewMode) {
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
          isGeneratingMore: false,
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
