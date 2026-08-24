'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { SubjectProgressOverview } from '@/app/actions/student-progress-actions'

interface SubjectsProgressListProps {
  subjects: SubjectProgressOverview[]
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

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 md:p-6">
      <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mb-4">
        {t('common.student_dashboard.subjects_list.title', 'Your Subjects')}
      </h4>

      <div className="space-y-4">
        {subjects.map((subject) => {
          const pct =
            subject.totalCount > 0
              ? Math.round((subject.completedCount / subject.totalCount) * 100)
              : 0
          const color = subject.colorCode || '#7C6FE0'

          return (
            <button
              key={subject.id}
              onClick={() => router.push(`/subjects/${subject.id}`)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  {subject.name}
                </span>
                <span className="text-xs font-bold text-neutral-400">
                  {subject.completedCount}/{subject.totalCount} · {pct}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
