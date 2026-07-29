'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { useLanguage } from '@/providers/language-provider'
import { StreakDayData } from '@/types'

import timer from '../../../../public/timer.png'

export function StreakCard({ item }: { item: StreakDayData }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const isNotJoined = item.status === 'not_joined'
  const canFlip = !item.isFuture && !isNotJoined
  const { language } = useLanguage()
  const { t } = useTranslation()
  const userLang = language || 'en'

  // Dynamic light background from the rule's hex color (12% opacity)
  const tintedBg = item.color ? `${item.color}20` : undefined

  return (
    <div
      className="relative w-full aspect-square cursor-pointer"
      style={{
        perspective: '1000px',
        zIndex: isFlipped ? 50 : 1,
      }}
      onMouseEnter={() => canFlip && setIsFlipped(true)}
      onMouseLeave={() => canFlip && setIsFlipped(false)}
      onClick={() => canFlip && setIsFlipped((prev) => !prev)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* ─── Front Face ─── */}
        {/* Animated glow ring for active card */}
        {item.isToday && (
          <div
            className="absolute -inset-[3px] rounded-[20px] animate-pulse"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary), var(--primary))',
              opacity: 0.6,
            }}
          />
        )}

        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-2xl py-3 transition-all duration-300',
            isNotJoined &&
              'bg-neutral-100/50 dark:bg-neutral-800/40 border-2 border-dotted border-neutral-300/60 dark:border-neutral-600/60',
            item.isFuture &&
              !isNotJoined &&
              'bg-lavender-mist/30 dark:bg-neutral-800/60 border-2 border-dashed border-neutral-300 dark:border-neutral-600',
            item.isToday && 'bg-primary border-2 border-white/30 scale-[1.03]',
            !item.isFuture && !item.isToday && !isNotJoined && 'border border-transparent'
          )}
          style={{
            backfaceVisibility: 'hidden',
            backgroundColor: item.isFuture || item.isToday || isNotJoined ? undefined : tintedBg,
          }}
        >
          {/* "Today" badge */}
          {item.isToday && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="px-2.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider bg-white text-primary rounded-full shadow-md whitespace-nowrap">
                Today
              </span>
            </div>
          )}

          {/* Emoji / GIF */}
          {item.gif ? (
            <div className="relative w-17 h-17 sm:w-12 sm:h-12 md:w-16 md:h-17 lg:w-12 lg:h-12 xl:w-13 xl:h-13 2xl:w-16 2xl:h-16 shrink-0">
              <Image src={item.gif} alt={item.status} fill className="object-contain" unoptimized />
            </div>
          ) : item.isToday ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
              <span className="text-lg sm:text-xl md:text-2xl animate-spin">⏳</span>
            </div>
          ) : isNotJoined ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
              <span className="text-lg sm:text-xl md:text-2xl opacity-40">🚫</span>
            </div>
          ) : item.isFuture ? (
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0">
              <Image src={timer || '/timer.png'} alt="upcoming" fill className="object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0" />
          )}

          {/* Date number */}
          <span
            className={cn(
              'text-3xl sm:text-4xl lg:text-3xl xl:text-[34px] font-black leading-none',
              item.isToday && 'text-white',
              isNotJoined && 'text-neutral-300 dark:text-neutral-600',
              item.isFuture && !isNotJoined && 'text-neutral-400 dark:text-neutral-500'
            )}
            style={{
              color: item.isToday || item.isFuture || isNotJoined ? undefined : item.color,
            }}
          >
            {item.date}
          </span>

          {/* Day label */}
          <span
            className={cn(
              'text-[11px] sm:text-xs lg:text-[11px] xl:text-[12px] font-bold uppercase tracking-widest',
              item.isToday && 'text-white/80',
              isNotJoined && 'text-neutral-300 dark:text-neutral-600',
              item.isFuture && !isNotJoined && 'text-neutral-400 dark:text-neutral-500',
              !item.isToday &&
                !item.isFuture &&
                !isNotJoined &&
                'text-neutral-500 dark:text-neutral-400'
            )}
          >
            {item.day}
          </span>

          {/* "Not Joined Yet" small label for not_joined cards */}
          {isNotJoined && (
            <span className="text-[9px] sm:text-[10px] lg:text-[11px] xl:text-[13px] font-semibold text-neutral-400 dark:text-neutral-500 leading-tight text-center px-1">
              {typeof item.label === 'string'
                ? item.label
                : item.label?.[userLang] || item.label?.['en'] || 'Not Joined Yet'}
            </span>
          )}
        </div>

        {/* ─── Back Face ─── */}
        {canFlip && (
          <div
            className="absolute inset-0 w-full rounded-2xl overflow-hidden bg-white dark:bg-neutral-800"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: '0 10px 10px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)',
            }}
          >
            {/* Colored arch header */}
            <div
              className="relative w-full h-[41%] overflow-hidden"
              style={{ backgroundColor: tintedBg }}
            >
              <div
                className="absolute bottom-0 left-0 w-full h-[55%] bg-white dark:bg-neutral-800"
                style={{ borderRadius: '50% 50% 0 0' }}
              />
            </div>

            {/* Emoji sitting on the arch */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-17 h-17 sm:w-10 sm:h-10 md:w-13 md:h-13 lg:w-13 lg:h-13 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center p-0.5"
              style={{ top: '10%', boxShadow: '0 0 0 2px white' }}
            >
              <div className="relative w-full h-full rounded-full flex items-center justify-center">
                {item.gif && (
                  <Image src={item.gif} alt="emoji" fill className="object-contain" unoptimized />
                )}
              </div>
            </div>

            <div className="absolute bottom-4 sm:bottom-1 md:bottom-2 lg:bottom-4 xl:bottom-1 2xl:bottom-6 left-0 w-full flex flex-col items-center justify-end pb-3 sm:pb-4 px-2 text-center bg-white dark:bg-neutral-800 rounded-b-2xl">
              <p
                className="text-[12px] sm:text-[11px] lg:text-[10px] 2xl:text-[12px] font-extrabold uppercase mb-1 tracking-wide"
                style={{ color: item.color }}
              >
                {typeof item.label === 'string'
                  ? item.label.replace('_', ' ')
                  : item.label?.[userLang] || item.label?.['en'] || item.status.replace('_', ' ')}
              </p>
              <div className="flex flex-col gap-px">
                <p className="text-[12px] sm:text-[12px] lg:text-[14px] xl:text-[12px] 2xl:text-[14px] text-neutral-700 dark:text-neutral-300 font-semibold leading-tight">
                  {item.quizzes || 0} {t('common.student_dashboard.streak_card.test_completed')}
                </p>
                <p className="text-[12px] sm:text-[12px] lg:text-[14px] xl:text-[12px] 2xl:text-[14px] text-neutral-700 dark:text-neutral-300 font-semibold leading-tight">
                  {item.chapters || 0} {t('common.student_dashboard.streak_card.chapter_completed')}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
