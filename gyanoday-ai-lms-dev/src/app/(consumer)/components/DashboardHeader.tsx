'use client'

import { useTranslation } from 'react-i18next'

import { useCourseProgressStore } from '@/store/course-progress-store'
import { useUserStore } from '@/store/user-store'

import { CourseCompletionProgress } from './CourseCompletionProgress'

interface DashboardHeaderProps {
  // overallScore prop removed as we use the store directly
}

export function DashboardHeader({}: DashboardHeaderProps) {
  const { user } = useUserStore()
  const { t } = useTranslation()
  const stats = useCourseProgressStore((state) => state.stats)

  const completionPercentage =
    stats.totalChapters > 0 ? Math.round((stats.completedChapters / stats.totalChapters) * 100) : 0

  // Get initials for the avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'N/A'

  return (
    <header className="w-full relative">
      {/* Desktop View (Header with Curve) */}
      <div className="hidden lg:block relative w-full overflow-visible">
        {/* SVG Background Shape */}
        <div className="w-full ">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto drop-shadow-lg"
            preserveAspectRatio="xMidYMin slice"
          >
            <path
              d="M0 0 H1440 V100 Q1440 120 1420 120 H20 Q0 120 0 100 V0 Z"
              fill="var(--primary)"
            />
          </svg>
        </div>

        {/* Content Overlay - Centered vertically using flexbox */}
        <div className="absolute inset-0 pointer-events-none flex items-center">
          <div className="max-w-[2000px] mx-auto w-full px-8 xl:px-16 2xl:px-24 flex justify-between items-center">
            {/* Left: User Info */}
            <div className="flex items-center gap-3 xl:gap-5 pointer-events-auto max-w-[45%]">
              <div className="w-12 h-12 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center text-philosophy dark:text-lavender-mist text-lg xl:text-xl 2xl:text-3xl font-black shadow-lg border-4 border-white/20 shrink-0 transition-colors duration-300">
                {initials || 'N/A'}
              </div>
              <div className="text-white truncate">
                <p className="text-[8px] xl:text-[10px] 2xl:text-sm text-philosophy dark:text-lavender-mist font-bold mb-0.5 transition-colors duration-300">
                  {t('common.student_dashboard.header.welcome')}
                </p>
                <h2 className="text-lg xl:text-2xl 2xl:text-3xl font-black tracking-tight leading-none mb-1 truncate">
                  {user?.name || 'N/A'}
                </h2>
                <p className="text-[6px] xl:text-[9px] 2xl:text-[10px] font-bold uppercase">
                  {user?.class?.name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Right: Learning Progress - Responsive container */}
            <div className="pointer-events-auto h-16 md:h-24 lg:h-20 xl:h-24 2xl:h-28 aspect-square">
              <CourseCompletionProgress
                value={completionPercentage}
                label={t('common.student_dashboard.header.complete_course')}
                strokeWidth={10}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View: Straight Row UI */}
      <div className="lg:hidden w-full px-4 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-[var(--primary)] p-4 rounded-2xl shadow-md border border-white/10">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-[var(--philosophy)] dark:text-lavender-mist font-black text-lg shadow-inner transition-colors duration-300">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
              {t('common.student_dashboard.header.welcome_back')}
            </p>
            <h2 className="text-white font-extrabold text-base leading-tight">
              {user?.name || ''}
            </h2>
          </div>
          <div className="shrink-0 w-23 h-23 sm:w-20 sm:h-20">
            <CourseCompletionProgress
              value={completionPercentage}
              label={t('common.student_dashboard.header.complete_course')}
              strokeWidth={10}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
