'use client'

import { BookOpen } from 'lucide-react'
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

type Lang = 'en' | 'hi' | 'gu'

const SUMMARY: Record<Lang, (subjects: number, done: number, total: number) => string> = {
  en: (s, d, t) => `${s} ${s === 1 ? 'subject' : 'subjects'} · ${d} of ${t} lessons completed`,
  hi: (s, d, t) => `${s} विषय · ${t} में से ${d} पाठ पूरे`,
  gu: (s, d, t) => `${s} વિષય · ${t} માંથી ${d} પાઠ પૂર્ણ`,
}

function SkeletonCard() {
  return (
    <div className="min-h-[220px] animate-pulse rounded-3xl bg-neutral-200/70 p-6 dark:bg-neutral-800/70">
      <div className="flex justify-between">
        <div className="h-14 w-14 rounded-2xl bg-neutral-300/70 dark:bg-neutral-700/70" />
        <div className="h-7 w-24 rounded-full bg-neutral-300/70 dark:bg-neutral-700/70" />
      </div>
      <div className="mt-6 h-7 w-2/3 rounded-lg bg-neutral-300/70 dark:bg-neutral-700/70" />
      <div className="mt-3 h-4 w-1/3 rounded-lg bg-neutral-300/70 dark:bg-neutral-700/70" />
      <div className="mt-8 h-3 w-full rounded-full bg-neutral-300/70 dark:bg-neutral-700/70" />
    </div>
  )
}

export function SubjectsGrid({ subjectsData, isSubjectsLoading, progressData }: SubjectsGridProps) {
  const { t, i18n } = useTranslation()
  const lang = (['en', 'hi', 'gu'].includes((i18n.language || 'en').split('-')[0])
    ? (i18n.language || 'en').split('-')[0]
    : 'en') as Lang

  const subjects = subjectsData?.data || []
  const totals = subjects.reduce(
    (acc, s) => {
      const p = progressData?.[s.id]
      return { done: acc.done + (p?.completed || 0), total: acc.total + (p?.total || 0) }
    },
    { done: 0, total: 0 }
  )

  return (
    <div className="relative w-full overflow-hidden px-4 py-10 sm:px-[6%] lg:px-[10%]">
      <div className="absolute right-0 top-0 hidden scale-x-[-1] md:block">
        <Image src={monkey} alt="" width={100} height={100} className="h-auto w-20 md:w-32" />
      </div>

      {/* Title + summary */}
      <div className="relative mb-10 flex flex-col items-center gap-3 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-philosophy transition-colors duration-300 dark:text-lavender-mist md:text-3xl lg:text-4xl">
          {t('common.student_dashboard.subjects.title')}
        </h2>
        {!isSubjectsLoading && subjects.length > 0 && (
          <p className="rounded-full bg-philosophy/10 px-4 py-1.5 text-sm font-semibold text-philosophy dark:bg-white/10 dark:text-lavender-mist">
            {SUMMARY[lang](subjects.length, totals.done, totals.total)}
          </p>
        )}
      </div>

      {isSubjectsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {subjects.map((subject, index) => {
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
        <div className="flex flex-col items-center gap-4 rounded-[40px] border border-neutral-200 bg-neutral-50 py-20 text-center shadow-sm transition-colors duration-300 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-philosophy/10 text-philosophy dark:text-lavender-mist">
            <BookOpen size={30} />
          </span>
          <p className="text-xl font-medium text-neutral-500 dark:text-neutral-400">
            {t('common.student_dashboard.subjects.no_subjects')}
          </p>
        </div>
      )}
    </div>
  )
}
