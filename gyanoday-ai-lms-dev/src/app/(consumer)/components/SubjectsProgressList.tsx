'use client'

import { BookOpen, CheckCircle2, ChevronRight, RotateCcw, ShieldCheck, Target, TrendingDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { SubjectProgressOverview } from '@/app/actions/student-progress-actions'

interface SubjectsProgressListProps {
  subjects: SubjectProgressOverview[]
}

function SignalList({
  items,
  empty,
  tone,
}: {
  items: string[]
  empty: string
  tone: 'strong' | 'weak' | 'revision'
}) {
  const dot =
    tone === 'strong'
      ? 'bg-emerald-500'
      : tone === 'weak'
        ? 'bg-rose-500'
        : 'bg-amber-500'

  return (
    <div className="space-y-1.5 min-w-0">
      {items.length ? (
        items.map((item) => (
          <div key={item} className="flex items-start gap-2 min-w-0">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dot} shrink-0`} />
            <span className="text-xs leading-4 text-neutral-600 dark:text-neutral-300 truncate" title={item}>
              {item}
            </span>
          </div>
        ))
      ) : (
        <span className="text-xs text-neutral-400 dark:text-neutral-500">{empty}</span>
      )}
    </div>
  )
}

export function SubjectsProgressList({ subjects }: SubjectsProgressListProps) {
  const { t } = useTranslation()
  const router = useRouter()

  if (subjects.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 text-sm text-neutral-400">
        {t('common.student_dashboard.subjects_list.empty', 'No subjects available yet.')}
      </div>
    )
  }

  const totalChapters = subjects.reduce((sum, subject) => sum + subject.totalCount, 0)
  const completedChapters = subjects.reduce((sum, subject) => sum + subject.completedCount, 0)
  const overallPct = totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0

  return (
    <section className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              <h4 className="text-base font-extrabold text-neutral-800 dark:text-neutral-100">
                {t('common.student_dashboard.subjects_list.title', 'Your Subjects')}
              </h4>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Track progress, strengths, weak areas and revision topics subject by subject.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-black text-neutral-800 dark:text-white">{overallPct}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Overall progress</div>
          </div>
        </div>

        <div className="h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400">
          <span>{completedChapters} of {totalChapters} chapters completed</span>
          <span>{totalChapters - completedChapters} remaining</span>
        </div>
      </div>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const color = subject.colorCode || '#7C6FE0'
          const progress = subject.progressPct

          return (
            <button
              key={subject.id}
              onClick={() => router.push(`/subjects/${subject.id}`)}
              className="w-full text-left rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 group"
            >
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(220px,1.1fr)_repeat(3,minmax(150px,1fr))_24px] gap-4 items-center">
                {/* Subject + progress */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-extrabold text-sm text-neutral-800 dark:text-neutral-100 truncate">
                      {subject.name}
                    </span>
                    <span className="ml-auto text-xs font-black text-neutral-500">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold text-neutral-400">
                    {subject.completedCount}/{subject.totalCount} chapters completed
                  </div>
                </div>

                {/* Strength */}
                <div className="min-w-0 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Strength</span>
                  </div>
                  <SignalList items={subject.strengths} empty="Keep practising to build a strength." tone="strong" />
                </div>

                {/* Weakness */}
                <div className="min-w-0 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-rose-700 dark:text-rose-400">
                    <TrendingDown size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Weakness</span>
                  </div>
                  <SignalList items={subject.weaknesses} empty="No weak chapter detected." tone="weak" />
                </div>

                {/* Revision */}
                <div className="min-w-0 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-amber-700 dark:text-amber-400">
                    <RotateCcw size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Revise Topics</span>
                  </div>
                  <SignalList items={subject.revisionTopics} empty="No revision topic yet." tone="revision" />
                </div>

                <ChevronRight size={18} className="hidden xl:block text-neutral-300 group-hover:text-primary transition-colors" />
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between text-[10px] font-bold text-neutral-400">
                <span className="flex items-center gap-1"><Target size={12} /> Subject mastery tracking</span>
                <span className="flex items-center gap-1">Open subject <ChevronRight size={12} /></span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
