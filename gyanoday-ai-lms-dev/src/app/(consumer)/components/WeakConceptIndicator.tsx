'use client'

import { AlertCircle, CheckCircle2, HelpCircle, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MasteryLevel, SubjectProgressOverview, WeakConcept } from '@/app/actions/student-progress-actions'
import { cn } from '@/lib/utils'

interface WeakConceptIndicatorProps {
  subjects: SubjectProgressOverview[]
  weakConcepts: WeakConcept[]
  onPracticeTopic?: (topic: string, chapterId?: string) => void
}

const MASTERY_STYLES: Record<
  MasteryLevel,
  { dot: string; label: string; text: string }
> = {
  strong: { dot: 'bg-emerald-500', label: 'Strong understanding', text: 'text-emerald-600' },
  needs_practice: { dot: 'bg-amber-500', label: 'Needs practice', text: 'text-amber-600' },
  needs_revision: { dot: 'bg-red-500', label: 'Needs revision', text: 'text-red-500' },
  not_attempted: { dot: 'bg-neutral-300', label: 'Not attempted yet', text: 'text-neutral-400' },
}

export function WeakConceptIndicator({
  subjects,
  weakConcepts,
  onPracticeTopic,
}: WeakConceptIndicatorProps) {
  const { t } = useTranslation()

  // Only chapters that have actually been attempted are useful signal here
  // — "not attempted" chapters would just clutter the list.
  const flaggedChapters = subjects
    .flatMap((s) => s.chapters.map((c) => ({ ...c, subjectName: s.name, subjectColor: s.colorCode })))
    .filter((c) => c.masteryLevel === 'needs_revision' || c.masteryLevel === 'needs_practice')
    .sort((a, b) => (a.lastScorePct ?? 100) - (b.lastScorePct ?? 100))
    .slice(0, 6)

  if (flaggedChapters.length === 0 && weakConcepts.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 flex items-center gap-3">
        <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
        <p className="text-sm text-neutral-500">
          {t(
            'common.student_dashboard.weak_concepts.empty',
            'No weak spots flagged yet — keep taking quizzes and this will fill in.'
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown size={16} className="text-amber-500" />
        <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
          {t('common.student_dashboard.weak_concepts.title', 'Strengths & Weaknesses')}
        </h4>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5 text-[11px] font-semibold text-neutral-400">
        {(['strong', 'needs_practice', 'needs_revision'] as MasteryLevel[]).map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', MASTERY_STYLES[level].dot)} />
            {MASTERY_STYLES[level].label}
          </span>
        ))}
      </div>

      {/* Per-chapter mastery cards */}
      {flaggedChapters.length > 0 && (
        <div className="space-y-2 mb-5">
          {flaggedChapters.map((chapter) => {
            const style = MASTERY_STYLES[chapter.masteryLevel]
            return (
              <div
                key={chapter.id}
                className="flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', style.dot)} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 truncate">
                      {chapter.title}
                    </p>
                    <p className="text-[11px] text-neutral-400">{chapter.subjectName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {chapter.lastScorePct != null && (
                    <span className={cn('text-xs font-bold', style.text)}>
                      {chapter.lastScorePct}%
                    </span>
                  )}
                  <span className={cn('text-[11px] font-bold', style.text)}>{style.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Specific weak concepts */}
      {weakConcepts.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <HelpCircle size={13} className="text-neutral-400" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
              {t('common.student_dashboard.weak_concepts.topics_title', 'Topics to revisit')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakConcepts.map((wc) => (
              <button
                key={wc.topic}
                onClick={() => onPracticeTopic?.(wc.topic, wc.chapterId)}
                disabled={!onPracticeTopic}
                className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/40 hover:shadow-sm transition-all disabled:cursor-default"
              >
                <AlertCircle size={12} />
                {wc.topic}
                {wc.timesFlagged > 1 && (
                  <span className="opacity-60">×{wc.timesFlagged}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
