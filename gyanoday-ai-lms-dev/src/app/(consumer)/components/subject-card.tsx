'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

import { Subject } from '@/types/subjects'

interface SubjectCardProps {
  subject: Subject
  index: number
  completedChapters?: number
  totalChapters?: number
}

export const SubjectCard = ({
  subject,
  index,
  completedChapters = 0,
  totalChapters = 0,
}: SubjectCardProps) => {
  const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
  const baseColor = subject.color_code || '#B188C0'
  const isCompleted = completedChapters === totalChapters && totalChapters > 0
  const { t } = useTranslation()

  return (
    <div className="relative group">
      <Link href={`/subjects/${subject.id}`} className="block w-full">
        <div
          className="relative w-full rounded-2xl md:rounded-[2rem] p-4 md:p-12 flex flex-col items-center justify-center text-white overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md shadow-md"
          style={{ backgroundColor: baseColor }}
        >
          {/* Corner Accent – Top Left */}
          <div className="absolute top-2 left-2 md:top-4 md:left-4 w-6 h-6 md:w-10 md:h-10 pointer-events-none">
            <div className="absolute inset-0 border-t-[3px] md:border-t-[6px] border-l-[3px] md:border-l-[6px] border-white/35 rounded-tl-lg md:rounded-tl-2xl" />
          </div>

          {/* Corner Accent – Bottom Right */}
          <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-6 h-6 md:w-10 md:h-10 pointer-events-none">
            <div className="absolute inset-0 border-b-[3px] md:border-b-[6px] border-r-[3px] md:border-r-[6px] border-white/35 rounded-br-lg md:rounded-br-2xl" />
          </div>

          {/* Card Content */}
          <h3 className="text-sm md:text-2xl font-bold mb-1 md:mb-3 pt-3 drop-shadow-md text-center line-clamp-2">
            {subject.name}
          </h3>

          <div className="flex flex-col items-center mb-3 md:mb-6">
            <span className="text-[10px] md:text-md font-medium opacity-80 uppercase tracking-wider">
              {t('common.student_dashboard.subjects.lessons')}
            </span>
            <span className="text-lg md:text-2xl font-black drop-shadow-sm">
              {completedChapters}/{totalChapters}
            </span>
          </div>

          {/* Progress Bar - Modern Inset Style */}
          <div className="w-full max-w-[80%] h-3 md:h-5 bg-black/10 rounded-full border border-white/20 p-0.5 md:p-1 shadow-inner relative overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full  shadow-sm"
              style={{ width: `${progress}%` }}
            />
            {/* Progress shine effect */}
            <div
              className="absolute inset-0 w-20 h-full -skew-x-12 animate-pulse"
              style={{ left: `${Math.min(progress, 90)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Completed Badge */}
      {isCompleted && (
        <div
          className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce"
          style={{ backgroundColor: baseColor }}
        >
          <Check size={18} strokeWidth={4} />
        </div>
      )}
    </div>
  )
}
