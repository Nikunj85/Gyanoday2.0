'use client'

import { ArrowDown, Info, Sparkles } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { StreakDayData, StreakRule } from '@/types'

import { StreakCard } from './StreakCard'
import { StreakInfoModal } from './StreakInfoModal'

interface WeeklyStreakProps {
  data?: StreakDayData[]
  rules?: StreakRule[]
  isLoading?: boolean
}

function StreakCardSkeleton() {
  return (
    <div className="w-full aspect-square rounded-2xl bg-lavender-mist/20 dark:bg-neutral-800/40 relative overflow-hidden border border-neutral-200/50 dark:border-neutral-700/30">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer pointer-events-none z-10" />

      {/* Skeleton content */}
      <div className="flex flex-col items-center justify-center h-full gap-2 sm:gap-3">
        {/* Emoji placeholder */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full bg-neutral-200/60 dark:bg-neutral-700/40" />
        {/* Date placeholder */}
        <div className="w-8 h-6 sm:w-10 sm:h-7 md:w-12 md:h-8 rounded-lg bg-neutral-200/60 dark:bg-neutral-700/40" />
        {/* Day placeholder */}
        <div className="w-10 h-3 sm:w-12 sm:h-3.5 rounded bg-neutral-200/40 dark:bg-neutral-700/30" />
      </div>
    </div>
  )
}

export function WeeklyStreak({ data, rules, isLoading }: WeeklyStreakProps) {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Show shimmer skeleton while loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 mt-8 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-32 rounded-lg bg-neutral-200/60 dark:bg-neutral-700/40 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 md:gap-5 xl:gap-8 pt-5 pb-8 xl:px-12 2xl:px-24">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-full">
              <StreakCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto px-4 mt-8 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-lavender-mist">
            {t('common.student_dashboard.progress_charts.weekly_streak', "7day's strike")}
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 cursor-pointer"
            title="Streak Info"
          >
            <Info size={16} />
          </button>
        </div>

        {/* Scroll to AI Summary Button */}
        <button
          onClick={() => {
            document
              .getElementById('overall-ai-summary-section')
              ?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-philosophy dark:text-lavender-mist bg-philosophy/5 hover:bg-philosophy/10 dark:bg-lavender-mist/10 dark:hover:bg-lavender-mist/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all active:scale-95"
          title="Scroll to Siksha Inspire"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">
            {t('common.student_dashboard.view_ai_summary', 'Siksha Inspire')}
          </span>
          <span className="inline sm:hidden">
            {t('common.student_dashboard.ai_summary_short', 'Siksha Summary')}
          </span>
          <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 opacity-60 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Streak Grid — responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 md:gap-5 xl:gap-8 pt-5 pb-8 md:px-12 lg:px-12 xl:px-7 2xl:px-2">
        {data.map((item, index) => (
          <div key={item.day} className="w-full aspect-square">
            <MotionWrapper animation="fadeInUp" delay={index * 0.1}>
              <StreakCard item={item} />
            </MotionWrapper>
          </div>
        ))}
      </div>

      <StreakInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} rules={rules} />
    </div>
  )
}
