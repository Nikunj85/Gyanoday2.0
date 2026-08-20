'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Flame, Loader2, Search, Sparkles, Target, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { getRecommendedTopics } from '@/app/actions/concept-actions'
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
  /** Full-chapter quiz launch, so this component reuses the same entry point styling. */
  onStartFullQuiz?: () => void
}

/**
 * Lets a student either take the standard full-chapter quiz, or pick a
 * specific topic/concept for targeted practice. Recommended topics are
 * pulled from their own history of weak areas across past attempts
 * (see concept-insight-service.ts) — this is the "recommends targeted
 * revision" part of the Cognitive Quiz Matrix feature.
 */
export function TopicQuizLauncher({ chapterId, userId, onStartFullQuiz }: TopicQuizLauncherProps) {
  const router = useRouter()
  const initQuiz = useQuizStore((s) => s.initQuiz)
  const [isOpen, setIsOpen] = useState(false)
  const [recommended, setRecommended] = useState<{ topic: string; timesFlagged: number }[]>([])
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
  const [customTopic, setCustomTopic] = useState('')
  const [launchingTopic, setLaunchingTopic] = useState<string | null>(null)

  // Fetch as soon as we know who the student is (not just when the sheet
  // opens) so the trigger button itself can show a live "you have N weak
  // spots to practice" badge — that's what makes the button worth tapping
  // instead of just a generic label.
  useEffect(() => {
    if (!userId || !chapterId) return
    setIsLoadingRecommended(true)
    getRecommendedTopics(userId, chapterId)
      .then(setRecommended)
      .finally(() => setIsLoadingRecommended(false))
  }, [userId, chapterId])

  const startTopicQuiz = (topic: string) => {
    const trimmed = topic.trim()
    if (!trimmed) return
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'group relative flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all active:scale-95 hover:shadow-md',
            'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500'
          )}
        >
          <Target size={16} className="shrink-0" />
          <span>Practice a Topic</span>
          {recommended.length > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-white/25 text-[11px] font-extrabold tabular-nums">
              {recommended.length}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[28px] p-0">
        {/* Header banner */}
        <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 border-b border-neutral-100 dark:border-neutral-800">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Target size={20} />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold">Targeted Practice</SheetTitle>
                <SheetDescription className="text-xs">
                  Drill a specific concept, or take the full chapter quiz.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-7">
          {/* Full chapter quiz — styled as a real option card, not an afterthought */}
          <button
            onClick={startFullQuiz}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all text-left group"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400 transition-colors">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                Full Chapter Quiz
              </p>
              <p className="text-xs text-neutral-400">Covers everything, like a regular test</p>
            </div>
            <ArrowRight
              size={16}
              className="text-neutral-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>

          {/* Recommended weak areas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-orange-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Recommended for you
              </p>
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
                  No weak areas flagged yet — take a quiz first and we&apos;ll recommend topics
                  here based on what trips you up.
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
                        onClick={() => startTopicQuiz(r.topic)}
                        disabled={!!launchingTopic}
                        className={cn(
                          'group relative flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition-all overflow-hidden',
                          'border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 disabled:opacity-60'
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 truncate">
                            {r.topic}
                          </p>
                          {r.timesFlagged > 1 && (
                            <p className="text-[11px] font-semibold text-indigo-400 dark:text-indigo-500 mt-0.5">
                              Missed {r.timesFlagged}x recently
                            </p>
                          )}
                        </div>
                        {isLaunching ? (
                          <Loader2 size={16} className="text-indigo-500 animate-spin shrink-0" />
                        ) : (
                          <ArrowRight
                            size={16}
                            className="text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0"
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Custom topic */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search size={14} className="text-neutral-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Or type your own
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Newton's Second Law"
                className="rounded-xl h-11"
                onKeyDown={(e) => e.key === 'Enter' && startTopicQuiz(customTopic)}
              />
              <button
                onClick={() => startTopicQuiz(customTopic)}
                disabled={!customTopic.trim() || !!launchingTopic}
                className="shrink-0 flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                {launchingTopic && launchingTopic === customTopic.trim() ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    Start
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
