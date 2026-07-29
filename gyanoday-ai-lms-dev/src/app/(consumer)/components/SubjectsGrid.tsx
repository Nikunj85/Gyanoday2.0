'use client'

import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { Subject } from '@/types/subjects'

import monkey from '../../../../public/monkey.png'
import { SubjectCard } from './subject-card'

interface SubjectsGridProps {
  subjectsData: { data: Subject[] } | undefined
  isSubjectsLoading: boolean
  progressData: Record<string, { completed: number; total: number }> | undefined
}

export function SubjectsGrid({ subjectsData, isSubjectsLoading, progressData }: SubjectsGridProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full p-10 px-[10%] relative overflow-hidden">
      <div className="absolute right-0 top-[9] hidden md:block scale-x-[-1]">
        <Image src={monkey} alt="Monkey" width={100} height={100} className="w-20 md:w-32 h-auto" />
      </div>

      {/* Learning Journey Title */}
      <div className="flex flex-col items-center mb-9 relative">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-philosophy dark:text-lavender-mist tracking-tight text-center transition-colors duration-300">
          {t('common.student_dashboard.subjects.title')}
        </h2>
      </div>

      {/* Subjects Grid - Responsive Layout */}
      {isSubjectsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-philosophy/20" />
        </div>
      ) : subjectsData?.data && subjectsData.data.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 lg:gap-6 ">
          {subjectsData.data.map((subject, index) => {
            const progress = progressData?.[subject.id]
            return (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={index}
                completedChapters={progress?.completed || 0}
                totalChapters={progress?.total || 0}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900 rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors duration-300">
          <p className="text-neutral-500 dark:text-neutral-400 text-xl font-medium">
            {t('common.student_dashboard.subjects.no_subjects')}
          </p>
        </div>
      )}
    </div>
  )
}
