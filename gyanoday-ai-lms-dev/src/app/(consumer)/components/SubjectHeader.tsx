'use client'

import { Check, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Subject } from '@/types'

import { SmartSummaryDialog } from './SmartSummaryDialog'

interface SubjectHeaderProps {
  subject?: Subject | null
  completedChapters: number
  totalChapters: number
  activeChapterTitle?: string
  activeChapterDescription?: string
  isChapterCompleted?: boolean
  themeColor?: string
  onQuizClick?: () => void
  onCompleteClick?: () => void
  onSummaryClick?: () => void // Added to open summary dialog from parent
}

export function SubjectHeader({
  subject,
  completedChapters,
  totalChapters,
  activeChapterTitle,
  activeChapterDescription,
  isChapterCompleted,
  themeColor = '#E58B99',
  onQuizClick,
  onCompleteClick,
  onSummaryClick,
}: SubjectHeaderProps) {
  const { t } = useTranslation()
  const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  const subjectName = subject?.name || 'Subject'

  const handleOpenSummary = () => {
    if (onSummaryClick) {
      onSummaryClick()
    } else {
      setIsSummaryOpen(true)
    }
  }

  return (
    <header className="w-full relative z-20">
      {/* Desktop View (Header with Curve) */}
      <div className="hidden lg:block relative w-full overflow-visible">
        {/* SVG Background Shape */}
        <div className="w-full relative z-0">
          <svg
            viewBox="0 0 1440 230"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto drop-shadow-lg"
            preserveAspectRatio="xMidYMin slice"
          >
            <path
              d="M0 0 H1440 V80 Q1440 120 1400 120 C1250 120 1150 120 1000 120 C880 120 850 230 720 230 C590 230 560 120 440 120 C290 120 190 120 40 120 Q0 120 0 80 V0 Z"
              fill={themeColor}
            />

            {/* Integrated Progress Bar */}
            <g transform="translate(720, 60)">
              <path
                d="M -110 30 A 110 110 0 0 0 110 30"
                fill="none"
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="13"
                strokeLinecap="round"
              />
              {(() => {
                const radius = 110
                const totalLength = Math.PI * radius
                const progressValue = (progress / 100) * totalLength

                return (
                  <>
                    <path
                      d="M -110 30 A 110 110 0 0 0 110 30"
                      fill="none"
                      stroke="white"
                      strokeWidth="13"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${progressValue} ${totalLength}`,
                        transition: 'stroke-dasharray 1000ms ease-out',
                      }}
                    />
                    <circle
                      r="8"
                      fill="white"
                      stroke={themeColor}
                      strokeWidth="3"
                      style={{
                        offsetPath: 'path("M -110 30 A 110 110 0 0 0 110 30")',
                        offsetDistance: `${progress}%`,
                        offsetRotate: 'auto',
                        transition: 'offset-distance 1000ms ease-out',
                      }}
                      className="drop-shadow-md"
                    />
                  </>
                )
              })()}
            </g>
          </svg>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="max-w-[2000px] mx-auto h-full relative">
            {/* Left Side */}
            <div className="absolute left-6 xl:left-12 2xl:left-20 top-[5%] flex flex-col gap-2 pointer-events-auto">
              <nav className="flex items-center gap-2 text-white/80 text-[10px] xl:text-xs font-medium">
                <Link href="/" className="hover:text-white transition-colors">
                  {t('common.home')}
                </Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/student-dashboard" className="hover:text-white transition-colors">
                  {t('common.my_dashboard')}
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-subject-header-name font-bold">{subjectName}</span>
              </nav>

              <button
                onClick={onCompleteClick}
                className="bg-white px-4 py-2 cursor-pointer rounded-xl font-bold text-sm xl:text-base shadow-lg hover:bg-white/90 transition-all w-[150px] xl:w-[180px] justify-center sm:mt-0 md:mt-[5%] 2xl:mt-[10%] flex items-center gap-3 relative z-30 pointer-events-auto"
                style={{ color: themeColor }}
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
                  style={{
                    borderColor: themeColor,
                    backgroundColor: isChapterCompleted ? themeColor : 'transparent',
                  }}
                >
                  {isChapterCompleted && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                </div>
                <span className="truncate">
                  {isChapterCompleted
                    ? t('common.subject_header.completed')
                    : t('common.subject_header.complete')}
                </span>
              </button>
            </div>

            {/* Center Info */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[3%] xl:top-[7%] flex flex-col items-center pointer-events-none text-center z-20 w-full max-w-[900px]">
              <h1 className="text-black/40 dark:text-white/40 font-black text-center text-lg xl:text-2xl mb-0.5 xl:mb-1 uppercase tracking-wider drop-shadow-sm pointer-events-auto">
                {subjectName}
              </h1>
              <p className="text-white/90 text-center text-sm xl:text-md font-bold px-2 line-clamp-1 uppercase tracking-wide pointer-events-auto">
                {activeChapterTitle || 'Loading chapter...'}
              </p>

              <div className="flex items-center gap-1 xl:gap-2 mt-6 lg:mt-2 2xl:mt-10 pointer-events-auto">
                <span className="text-xl xl:text-6xl lg:text-5xl font-black text-white">
                  {completedChapters}
                </span>
                <span className="text-lg xl:text-5xl lg:text-5xl font-black text-white/60">/</span>
                <span className="text-lg xl:text-5xl lg:text-5xl font-black text-white/60">
                  {totalChapters}
                </span>
              </div>
            </div>

            {/* Right Side Buttons */}
            <div className="absolute right-6 xl:right-12 2xl:right-20 sm:mt-0 md:mt-2 2xl:mt-8 flex flex-col gap-2 pointer-events-auto z-30">
              <button
                onClick={handleOpenSummary}
                className="border-2 border-white text-white px-6 py-1.5 cursor-pointer rounded-xl font-bold text-xs xl:text-sm hover:bg-white/10 transition-all whitespace-nowrap min-w-[140px]"
              >
                {t('common.subject_header.smart_summary')}
              </button>
              <button
                onClick={onQuizClick}
                className="border-2 border-white text-white px-6 py-1.5 cursor-pointer rounded-xl font-bold text-xs xl:text-sm hover:bg-white/10 transition-all whitespace-nowrap min-w-[140px]"
              >
                {activeChapterTitle
                  ? t('common.subject_header.test_time')
                  : t('common.subject_header.select_chapter_test')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden w-full px-4 pt-4 flex flex-col gap-3">
        <div
          className="flex flex-col gap-3 p-4 rounded-2xl shadow-md border border-white/10"
          style={{ backgroundColor: themeColor }}
        >
          <nav className="flex items-center gap-1 text-white/70 text-[10px] font-bold uppercase tracking-wider">
            <Link href="/">{t('common.home')}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/student-dashboard">{t('common.my_dashboard')}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{subjectName}</span>
          </nav>

          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-white font-extrabold text-base leading-tight uppercase">
                {subjectName}
              </h2>
              <p className="text-white/80 text-[10px] font-medium line-clamp-1">
                {activeChapterTitle}
              </p>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <span className="text-white font-black text-sm">{completedChapters}</span>
                <span className="text-white/60 text-xs">/</span>
                <span className="text-white/60 text-xs font-bold">{totalChapters}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 mt-2 w-full">
            <button
              onClick={onCompleteClick}
              className="w-full max-w-[320px] bg-white py-2 cursor-pointer rounded-lg text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 relative z-10"
              style={{ color: themeColor }}
            >
              <div
                className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: themeColor,
                  backgroundColor: isChapterCompleted ? themeColor : 'transparent',
                }}
              >
                {isChapterCompleted && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
              </div>
              <span>
                {isChapterCompleted
                  ? t('common.subject_header.completed')
                  : t('common.subject_header.complete')}
              </span>
            </button>
            <div className="flex gap-2 w-full max-w-[320px]">
              <button
                onClick={handleOpenSummary}
                className="flex-1 bg-white/20 text-white py-2 cursor-pointer rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/30"
              >
                {t('common.subject_header.summary')}
              </button>
              <button
                onClick={onQuizClick}
                className="flex-1 bg-white/20 text-white py-2 cursor-pointer rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/30"
              >
                {activeChapterTitle
                  ? t('common.subject_header.test_time')
                  : t('common.subject_header.select_chapter_test')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Summary Dialog (Fallback if no external state is controlled) */}
      <SmartSummaryDialog
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title={activeChapterTitle || 'Chapter Summary'}
        description={activeChapterDescription || 'No summary available for this chapter.'}
        themeColor={themeColor}
      />
    </header>
  )
}