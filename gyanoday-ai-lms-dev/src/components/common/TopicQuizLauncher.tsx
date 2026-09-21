'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Flame, Loader2, Search, Sparkles, Target, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { getRecommendedTopics } from '@/app/actions/concept-actions'
import { validateTopicForChapter } from '@/app/actions/topic-validation-actions'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useQuizStore } from '@/store/use-quiz-store'

interface TopicQuizLauncherProps {
  chapterId: string
  userId?: string
  onStartFullQuiz?: () => void
  variant?: 'gradient' | 'header-outline'
  className?: string
}

/**
 * Lets a student choose between the normal full-chapter quiz and targeted
 * practice. Custom topics are checked against the current chapter before
 * starting so unrelated requests are handled politely instead of generating
 * an irrelevant quiz.
 */
export function TopicQuizLauncher({
  chapterId,
  userId,
  onStartFullQuiz,
  variant = 'gradient',
  className,
}: TopicQuizLauncherProps) {
  const router = useRouter()
  const initQuiz = useQuizStore((s) => s.initQuiz)
  const [isOpen, setIsOpen] = useState(false)
  const [recommended, setRecommended] = useState<{ topic: string; timesFlagged: number }[]>([])
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
  const [customTopic, setCustomTopic] = useState('')
  const [launchingTopic, setLaunchingTopic] = useState<string | null>(null)
  const [practiceMode, setPracticeMode] = useState<'full' | 'topic'>('full')
  const [topicError, setTopicError] = useState('')
  const [isValidatingTopic, setIsValidatingTopic] = useState(false)

  useEffect(() => {
    if (!userId || !chapterId) return
    setIsLoadingRecommended(true)
    getRecommendedTopics(userId, chapterId)
      .then(setRecommended)
      .finally(() => setIsLoadingRecommended(false))
  }, [userId, chapterId])

  const startTopicQuiz = async (topic: string, skipValidation = false) => {
    const trimmed = topic.trim()
    if (!trimmed || launchingTopic || isValidatingTopic) return

    setTopicError('')

    if (!skipValidation) {
      try {
        setIsValidatingTopic(true)
        const result = await validateTopicForChapter(chapterId, trimmed)

        if (!result.isRelevant) {
          setTopicError(
            result.message ||
              'That topic does not appear to be part of this chapter. Please enter a topic from the current chapter.'
          )
          return
        }
      } catch (error) {
        console.error('Topic validation failed:', error)
        setTopicError('We could not check that topic right now. Please try again.')
        return
      } finally {
        setIsValidatingTopic(false)
      }
    }

    setLaunchingTopic(trimmed)
    initQuiz({ chapterId, isReviewMode: false, topic: trimmed })
    router.push('/quiz')
  }

  const startFullQuiz = () => {
    if (onStartFullQuiz) {
      onStartFullQuiz()
    } else {
      initQuiz({ chapterId, isReviewMode: false })
      router.push('/quiz')
    }
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) {
          setPracticeMode('full')
          setTopicError('')
          setCustomTopic('')
        }
      }}
    >
      <SheetTrigger asChild>
        <button
          className={cn(
            'group relative flex items-center justify-center gap-1.5 h-10 pl-3.5 pr-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 hover:shadow-md',
            variant === 'gradient' &&
              'text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500',
            variant === 'header-outline' &&
              'border-2 border-white text-white h-auto py-1.5 justify-center rounded-xl font-bold text-xs xl:text-sm hover:bg-white/10 whitespace-nowrap min-w-[140px] shadow-none',
            className
          )}
        >
          <span>Practice a Topic</span>
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[28px] p-0">
        <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 border-b border-neutral-100 dark:border-neutral-800">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Target size={20} />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold">Targeted Practice</SheetTitle>
                <SheetDescription className="text-xs">
                  Choose a full chapter quiz or practice one topic from this chapter.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1">
            <button
              type="button"
              onClick={() => {
                setPracticeMode('full')
                setTopicError('')
              }}
              className={cn(
                'rounded-xl px-4 py-3 text-sm font-extrabold transition-all',
                practiceMode === 'full'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              )}
            >
              Full Chapter Quiz
            </button>
            <button
              type="button"
              onClick={() => setPracticeMode('topic')}
              className={cn(
                'rounded-xl px-4 py-3 text-sm font-extrabold transition-all',
                practiceMode === 'topic'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              )}
            >
              Practice a Topic
            </button>
          </div>

          {practiceMode === 'full' ? (
            <button
              onClick={startFullQuiz}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all text-left group"
            >
              <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400 transition-colors">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Full Chapter Quiz</p>
                <p className="text-xs text-neutral-400">Covers everything in this chapter</p>
              </div>
              <ArrowRight
                size={16}
                className="text-neutral-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={14} className="text-orange-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Recommended for you</p>
                </div>

                {isLoadingRecommended ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-400 py-4">
                    <Loader2 size={14} className="animate-spin" />
                    Checking your past attempts…
                  </div>
                ) : recommended.length === 0 ? (
                  <div className="flex items-start gap-2.5 text-sm text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-dashed border-neutral-200 dark:border-neutral-800">
                    <Zap size={16} className="shrink-0 mt-0.5 text-neutral-300" />
                    <span>
                      No weak areas flagged yet — take a quiz first and we&apos;ll recommend topics here based on what trips you up.
                    </span>
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <AnimatePresence>
                      {recommended.map((r, idx) => {
                        const isLaunching = launchingTopic === r.topic
                        return (
                          <motion.button
                            key={r.topic}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, duration: 0.2 }}
                            onClick={() => void startTopicQuiz(r.topic, true)}
                            disabled={!!launchingTopic || isValidatingTopic}
                            className={cn(
                              'group relative flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition-all overflow-hidden',
                              'border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 disabled:opacity-60'
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 truncate">{r.topic}</p>
                              {r.timesFlagged > 1 && (
                                <p className="text-[11px] font-semibold text-indigo-400 dark:text-indigo-500 mt-0.5">
                                  Missed {r.timesFlagged}x recently
                                </p>
                              )}
                            </div>
                            {isLaunching ? (
                              <Loader2 size={16} className="text-indigo-500 animate-spin shrink-0" />
                            ) : (
                              <ArrowRight size={16} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                            )}
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} className="text-neutral-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Search a topic from this chapter</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value)
                      setTopicError('')
                    }}
                    placeholder="e.g. Newton's Second Law"
                    className="rounded-xl h-11"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void startTopicQuiz(customTopic)
                      }
                    }}
                  />
                  <button
                    onClick={() => void startTopicQuiz(customTopic)}
                    disabled={!customTopic.trim() || !!launchingTopic || isValidatingTopic}
                    className="shrink-0 flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    {isValidatingTopic || (launchingTopic && launchingTopic === customTopic.trim()) ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        Start
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
                {topicError && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    {topicError}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-neutral-400">
                  Practice is limited to the current chapter so your quiz stays focused.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
