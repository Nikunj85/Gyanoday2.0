'use client'

import { CheckCircle2, Clock, Target, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

interface QuizScoreCardProps {
  score: number
  total: number
  time: string
  passThreshold?: number // e.g. 0.6 = 60%
  topic?: string | null
  onReviewClick: () => void
}

export function QuizScoreCard({
  score,
  total,
  time,
  passThreshold = 0.6,
  topic,
  onReviewClick,
}: QuizScoreCardProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const passed = total > 0 && score / total >= passThreshold
  const incorrect = total - score

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-[32px] shadow-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
      {/* Header band */}
      <div
        className={cn(
          'px-8 pt-8 pb-6 text-center',
          passed
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10'
            : 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10'
        )}
      >
        {topic && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-black/20 text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-3">
            <Target size={12} />
            {topic}
          </div>
        )}
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg',
            passed ? 'bg-emerald-500' : 'bg-amber-500'
          )}
        >
          {passed ? (
            <CheckCircle2 className="text-white" size={36} />
          ) : (
            <Target className="text-white" size={36} />
          )}
        </div>
        <p className="text-5xl font-black text-neutral-900 dark:text-white tabular-nums">
          {percentage}%
        </p>
        <p
          className={cn(
            'mt-1 text-sm font-bold uppercase tracking-wide',
            passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          )}
        >
          {passed ? 'Great job!' : 'Keep practicing'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-neutral-800 border-t border-gray-100 dark:border-neutral-800">
        <div className="flex flex-col items-center py-4 gap-1">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{score}</p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Correct</p>
        </div>
        <div className="flex flex-col items-center py-4 gap-1">
          <XCircle size={16} className="text-red-400" />
          <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">
            {incorrect}
          </p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Missed</p>
        </div>
        <div className="flex flex-col items-center py-4 gap-1">
          <Clock size={16} className="text-neutral-400" />
          <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{time}</p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Time</p>
        </div>
      </div>

      {/* Review Answers */}
      <div className="p-4 border-t border-gray-100 dark:border-neutral-800">
        <button
          onClick={onReviewClick}
          className="w-full py-3.5 rounded-2xl border-2 border-primary/20 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
        >
          Review Answers
        </button>
      </div>
    </div>
  )
}
