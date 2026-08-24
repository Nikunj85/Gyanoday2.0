'use client'

import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StudyDay } from '@/app/actions/student-progress-actions'
import { cn } from '@/lib/utils'

interface StudyTimeChartProps {
  data: StudyDay[]
  themeColor?: string
}

export function StudyTimeChart({ data, themeColor = '#7C6FE0' }: StudyTimeChartProps) {
  const { t } = useTranslation()
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 20) // keep a sane min scale
  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0)
  const todayKey = new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: themeColor }} />
          <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
            {t('common.student_dashboard.study_time.title', 'Study Time')}
          </h4>
        </div>
        <span className="text-xs font-semibold text-neutral-400">
          {t('common.student_dashboard.study_time.this_week', 'this week')}:{' '}
          <span className="text-neutral-600 dark:text-neutral-300 font-bold">
            {totalMinutes}
            {t('common.student_dashboard.study_time.min_short', 'm')}
          </span>
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 h-28">
        {data.map((day) => {
          const heightPct = Math.max((day.minutes / maxMinutes) * 100, day.minutes > 0 ? 8 : 3)
          const isToday = day.date === todayKey
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="relative w-full flex-1 flex items-end">
                <div
                  className={cn(
                    'w-full rounded-lg transition-all',
                    day.minutes === 0 && 'bg-neutral-100 dark:bg-neutral-800'
                  )}
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: day.minutes > 0 ? themeColor : undefined,
                    opacity: day.minutes > 0 ? (isToday ? 1 : 0.7) : 1,
                  }}
                  title={`${day.minutes} min`}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold',
                  isToday ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-400'
                )}
              >
                {day.day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
