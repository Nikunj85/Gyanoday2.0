'use client'

import {
  BookOpen,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Target,
  TrendingDown,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChapterSignal, RevisionSignal, SubjectProgressOverview } from '@/app/actions/student-progress-actions'
import { cn } from '@/lib/utils'

interface SubjectsProgressListProps {
  subjects: SubjectProgressOverview[]
}

type SignalKind = 'strong' | 'weak' | 'revision'

/**
 * One strength/weakness/revision row. Clicking it opens an inline detail
 * panel showing the actual numbers behind it — score %, attempt count,
 * which chapter — computed from real quiz history
 * (student-progress-actions.ts), not a placeholder. Only one detail panel
 * is open at a time per card.
 */
function SignalRow({
  id,
  label,
  detail,
  tone,
  isOpen,
  onToggle,
  onOpenChapter,
}: {
  id: string
  label: string
  detail: React.ReactNode
  tone: SignalKind
  isOpen: boolean
  onToggle: () => void
  onOpenChapter?: () => void
}) {
  const dot =
    tone === 'strong' ? 'bg-emerald-500' : tone === 'weak' ? 'bg-rose-500' : 'bg-amber-500'

  return (
    <div className="min-w-0">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="w-full flex items-start gap-2 min-w-0 text-left group/row"
      >
        <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', dot)} />
        <span
          className={cn(
            'text-xs leading-4 text-neutral-600 dark:text-neutral-300 truncate group-hover/row:text-neutral-900 dark:group-hover/row:text-white transition-colors',
            isOpen && 'font-bold text-neutral-900 dark:text-white'
          )}
          title={label}
        >
          {label}
        </span>
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 ml-3.5 pl-2 border-l-2 border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1"
        >
          {detail}
          {onOpenChapter && (
            <button
              onClick={onOpenChapter}
              className="font-bold text-primary hover:underline"
            >
              Open chapter →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SignalGroup({
  items,
  empty,
  tone,
  openKey,
  onToggle,
  onOpenChapter,
  renderDetail,
  renderLabel,
  keyOf,
}: {
  items: (ChapterSignal | RevisionSignal)[]
  empty: string
  tone: SignalKind
  openKey: string | null
  onToggle: (key: string) => void
  onOpenChapter: (chapterId?: string) => void
  renderDetail: (item: any) => React.ReactNode
  renderLabel: (item: any) => string
  keyOf: (item: any) => string
}) {
  if (items.length === 0) {
    return <span className="text-xs text-neutral-400 dark:text-neutral-500">{empty}</span>
  }

  return (
    <div className="space-y-2">
      {items.map((item: any) => {
        const key = keyOf(item)
        return (
          <SignalRow
            key={key}
            id={key}
            label={renderLabel(item)}
            detail={renderDetail(item)}
            tone={tone}
            isOpen={openKey === key}
            onToggle={() => onToggle(key)}
            onOpenChapter={item.chapterId ? () => onOpenChapter(item.chapterId) : undefined}
          />
        )
      })}
    </div>
  )
}

export function SubjectsProgressList({ subjects }: SubjectsProgressListProps) {
  const { t } = useTranslation()
  const router = useRouter()
  // Track which single item is expanded, per card, as `${subjectId}:${itemKey}`.
  const [openItem, setOpenItem] = useState<string | null>(null)

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
              Track progress, strengths, weak areas and revision topics subject by subject. Tap
              any item for the numbers behind it.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-black text-neutral-800 dark:text-white">{overallPct}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Overall progress
            </div>
          </div>
        </div>

        <div className="h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400">
          <span>
            {completedChapters} of {totalChapters} chapters completed
          </span>
          <span>{totalChapters - completedChapters} remaining</span>
        </div>
      </div>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const color = subject.colorCode || '#7C6FE0'
          const progress = subject.progressPct
          const openKey = openItem?.startsWith(`${subject.id}:`) ? openItem.split(':')[1] : null

          const toggle = (key: string) => {
            const full = `${subject.id}:${key}`
            setOpenItem((prev) => (prev === full ? null : full))
          }
          const openChapter = (chapterId?: string) => {
            router.push(chapterId ? `/subjects/${subject.id}?chapter=${chapterId}` : `/subjects/${subject.id}`)
          }

          return (
            <div
              key={subject.id}
              className="w-full rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40 p-4 transition-all duration-200 hover:border-primary/20 group"
            >
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(220px,1.1fr)_repeat(3,minmax(150px,1fr))_24px] gap-4 items-start">
                {/* Subject + progress */}
                <button
                  onClick={() => openChapter()}
                  className="min-w-0 text-left"
                >
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
                </button>

                {/* Strength */}
                <div className="min-w-0 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Strength</span>
                  </div>
                  <SignalGroup
                    items={subject.strengths}
                    empty="Keep practising to build a strength."
                    tone="strong"
                    openKey={openKey}
                    onToggle={toggle}
                    onOpenChapter={openChapter}
                    keyOf={(c: ChapterSignal) => `s-${c.chapterId}`}
                    renderLabel={(c: ChapterSignal) => c.title}
                    renderDetail={(c: ChapterSignal) => (
                      <p>
                        Scored <span className="font-bold text-emerald-600">{c.scorePct}%</span> ·{' '}
                        {c.attempts} {c.attempts === 1 ? 'attempt' : 'attempts'}
                      </p>
                    )}
                  />
                </div>

                {/* Weakness */}
                <div className="min-w-0 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-rose-700 dark:text-rose-400">
                    <TrendingDown size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Weakness</span>
                  </div>
                  <SignalGroup
                    items={subject.weaknesses}
                    empty="No weak chapter detected."
                    tone="weak"
                    openKey={openKey}
                    onToggle={toggle}
                    onOpenChapter={openChapter}
                    keyOf={(c: ChapterSignal) => `w-${c.chapterId}`}
                    renderLabel={(c: ChapterSignal) => c.title}
                    renderDetail={(c: ChapterSignal) => (
                      <p>
                        Scored <span className="font-bold text-rose-600">{c.scorePct}%</span> ·{' '}
                        {c.attempts} {c.attempts === 1 ? 'attempt' : 'attempts'}
                      </p>
                    )}
                  />
                </div>

                {/* Revision */}
                <div className="min-w-0 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-amber-700 dark:text-amber-400">
                    <RotateCcw size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Revise Topics</span>
                  </div>
                  <SignalGroup
                    items={subject.revisionTopics}
                    empty="No revision topic yet."
                    tone="revision"
                    openKey={openKey}
                    onToggle={toggle}
                    onOpenChapter={openChapter}
                    keyOf={(r: RevisionSignal) => `r-${r.topic}`}
                    renderLabel={(r: RevisionSignal) => r.topic}
                    renderDetail={(r: RevisionSignal) => (
                      <p>
                        Flagged {r.timesFlagged}x{r.chapterTitle ? <> in <span className="font-semibold">{r.chapterTitle}</span></> : null}
                      </p>
                    )}
                  />
                </div>

                <button onClick={() => openChapter()} className="hidden xl:flex items-center justify-center h-full">
                  <ChevronRight
                    size={18}
                    className="text-neutral-300 group-hover:text-primary transition-colors"
                  />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between text-[10px] font-bold text-neutral-400">
                <span className="flex items-center gap-1">
                  <Target size={12} /> Subject mastery tracking
                </span>
                <button onClick={() => openChapter()} className="flex items-center gap-1 hover:text-primary transition-colors">
                  Open subject <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
