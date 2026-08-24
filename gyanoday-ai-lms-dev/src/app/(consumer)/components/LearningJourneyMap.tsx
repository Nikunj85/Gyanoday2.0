'use client'

import { CheckCircle2, Lock, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SubjectProgressOverview } from '@/app/actions/student-progress-actions'
import { cn } from '@/lib/utils'

interface LearningJourneyMapProps {
  subjects: SubjectProgressOverview[]
}

function ChapterNode({
  chapter,
  color,
}: {
  chapter: SubjectProgressOverview['chapters'][number]
  color: string
}) {
  const isLocked = chapter.mapState === 'locked'
  const isCurrent = chapter.mapState === 'current'
  const isCompleted = chapter.mapState === 'completed'

  return (
    <div className="flex flex-col items-center shrink-0 w-20">
      <div
        className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all',
          isCompleted && 'text-white shadow-sm',
          isCurrent && 'bg-white dark:bg-neutral-900 shadow-md scale-110',
          isLocked &&
            'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-300'
        )}
        style={
          isCompleted
            ? { backgroundColor: color, borderColor: color }
            : isCurrent
              ? { borderColor: color, color }
              : undefined
        }
      >
        {isCompleted ? (
          <CheckCircle2 size={20} />
        ) : isLocked ? (
          <Lock size={16} />
        ) : (
          <MapPin size={18} className="animate-pulse" />
        )}
      </div>
      <p
        className={cn(
          'text-[11px] font-semibold text-center mt-2 leading-tight line-clamp-2',
          isLocked
            ? 'text-neutral-300 dark:text-neutral-600'
            : 'text-neutral-600 dark:text-neutral-300'
        )}
        title={chapter.title}
      >
        {chapter.title}
      </p>
    </div>
  )
}

export function LearningJourneyMap({ subjects }: LearningJourneyMapProps) {
  const { t } = useTranslation()

  if (subjects.length === 0) return null

  return (
    <div className="space-y-6">
      {subjects.map((subject) => {
        const color = subject.colorCode || '#7C6FE0'
        return (
          <div
            key={subject.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  {subject.name}
                </h4>
              </div>
              <span className="text-xs font-semibold text-neutral-400">
                {subject.completedCount}/{subject.totalCount}{' '}
                {t('common.student_dashboard.journey_map.chapters', 'chapters')}
              </span>
            </div>

            <div className="relative overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex items-start gap-1 min-w-max relative">
                {subject.chapters.map((chapter, idx) => (
                  <div key={chapter.id} className="flex items-center">
                    {idx > 0 && (
                      <div
                        className={cn(
                          'h-0.5 w-6 sm:w-8 mt-[22px] shrink-0',
                          chapter.mapState === 'locked' && 'bg-neutral-200 dark:bg-neutral-700'
                        )}
                        style={chapter.mapState !== 'locked' ? { backgroundColor: color } : undefined}
                      />
                    )}
                    <ChapterNode chapter={chapter} color={color} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
