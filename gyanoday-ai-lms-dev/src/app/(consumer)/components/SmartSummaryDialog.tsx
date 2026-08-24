'use client'

import { CheckCircle2, Sparkles, Target, TrendingDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'

interface ChapterPerformance {
  attempts: number
  averagePct: number
  bestPct: number
  latestPct: number
}

interface WeakTopic {
  topic: string
  timesFlagged: number
}

interface SmartSummaryDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  themeColor?: string
  chapterPerformance?: ChapterPerformance
  weakTopics?: WeakTopic[]
}

type ViewMode = 'summary' | 'strengths'

export function SmartSummaryDialog({
  isOpen,
  onClose,
  title,
  description,
  themeColor = '#E58B99',
  chapterPerformance,
  weakTopics = [],
}: SmartSummaryDialogProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<ViewMode>('summary')

  useEffect(() => {
    if (isOpen) setMode('summary')
  }, [isOpen])

  if (!isOpen) return null

  const performance = chapterPerformance || { attempts: 0, averagePct: 0, bestPct: 0, latestPct: 0 }
  const hasAttempts = performance.attempts > 0

  const strengthMessage = !hasAttempts
    ? 'Take a chapter quiz to unlock your personalized strengths and weaknesses.'
    : performance.averagePct >= 80
      ? `You are showing strong understanding of this chapter, with an average quiz performance of ${performance.averagePct}%.`
      : performance.averagePct >= 60
        ? `You have a solid foundation in this chapter (${performance.averagePct}% average). A little more revision can make your understanding more consistent.`
        : `Your current chapter average is ${performance.averagePct}%. Focused revision and targeted practice can improve your confidence here.`

  const weaknesses = weakTopics.length
    ? weakTopics
    : hasAttempts && performance.averagePct < 75
      ? [{ topic: 'Core chapter concepts', timesFlagged: 1 }]
      : []

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm">
      <MotionWrapper
        animation="scaleIn"
        className="relative w-full max-w-[900px] max-h-[82vh] flex flex-col"
      >
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[32px] bg-white dark:bg-neutral-900 shadow-2xl border border-white/70 dark:border-neutral-800">
          <div className="relative shrink-0 border-b border-neutral-100 dark:border-neutral-800 px-6 md:px-9 pt-6 md:pt-7 pb-5">
            <button
              onClick={onClose}
              aria-label="Close smart summary"
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-20"
            >
              <X size={22} className="text-neutral-400" />
            </button>

            <div className="flex flex-col gap-4 pr-10 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-neutral-400">
                    Chapter Insights
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
                  {title || 'Chapter Summary'}
                </h2>
              </div>

              <div className="self-start sm:self-center shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMode('summary')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-extrabold transition-all ${
                    mode === 'summary'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Smart Summary
                </button>
                <button
                  type="button"
                  onClick={() => setMode('strengths')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-extrabold transition-all ${
                    mode === 'strengths'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Strengths & Weaknesses
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 md:px-9 py-6">
            {mode === 'summary' ? (
              <div className="max-w-3xl">
                <MarkdownRenderer
                  content={description || 'No summary available for this chapter yet.'}
                  className="text-neutral-600 dark:text-neutral-300 text-base md:text-lg leading-relaxed font-medium prose-p:text-neutral-600 dark:prose-p:text-neutral-300 prose-headings:text-neutral-900 dark:prose-headings:text-white"
                />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InsightMetric label="Average" value={`${performance.averagePct}%`} />
                  <InsightMetric label="Best score" value={`${performance.bestPct}%`} />
                  <InsightMetric label="Attempts" value={`${performance.attempts}`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={19} className="text-emerald-600" />
                      <h3 className="text-base font-black text-emerald-800 dark:text-emerald-300">Strengths</h3>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed font-medium text-emerald-900/80 dark:text-emerald-200/80">
                      {strengthMessage}
                    </p>
                    {hasAttempts && performance.bestPct >= performance.averagePct && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <Target size={14} />
                        Best recorded score: {performance.bestPct}%
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-rose-100 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown size={19} className="text-rose-600" />
                      <h3 className="text-base font-black text-rose-800 dark:text-rose-300">Weaknesses</h3>
                    </div>
                    {weaknesses.length ? (
                      <div className="flex flex-wrap gap-2">
                        {weaknesses.map((item) => (
                          <span
                            key={item.topic}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-sm font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                          >
                            {item.topic}
                            {item.timesFlagged > 1 && <span className="opacity-60">×{item.timesFlagged}</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm md:text-base leading-relaxed font-medium text-rose-900/70 dark:text-rose-200/70">
                        No recurring weak topics have been flagged yet. Keep practicing to build a stronger picture of your performance.
                      </p>
                    )}
                  </section>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 px-6 md:px-9 py-4 flex items-center justify-between gap-4" style={{ backgroundColor: themeColor }}>
            <p className="hidden sm:block text-sm font-bold text-white/90">
              Keep learning — your progress is tracked for this chapter.
            </p>
            <button
              onClick={onClose}
              className="ml-auto bg-white text-neutral-900 px-6 py-2.5 rounded-xl font-extrabold text-sm md:text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              {t('common.subject_header.start_to_learn', 'Continue Learning')}
            </button>
          </div>
        </div>
      </MotionWrapper>
    </div>
  )
}

function InsightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-neutral-900 dark:text-white">{value}</p>
    </div>
  )
}
