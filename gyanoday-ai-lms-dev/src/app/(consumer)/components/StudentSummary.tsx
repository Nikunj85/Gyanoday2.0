'use client'

import { Bot, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { useUserStore } from '@/store/user-store'

export const StudentSummary = () => {
  const { t } = useTranslation()
  const { overallSummary, isGeneratingSummary } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Clean the summary if it somehow still contains JSON as a string
  const displaySummary = (() => {
    if (!overallSummary) return null

    // Safety check if it's an object (should be handled by store, but just in case)
    if (typeof overallSummary === 'object') {
      // @ts-ignore
      return overallSummary.summary || null
    }

    // If it looks like JSON, try to parse it
    if (
      typeof overallSummary === 'string' &&
      (overallSummary.trim().startsWith('{') || overallSummary.trim().startsWith('"'))
    ) {
      try {
        let clean = overallSummary.trim()
        if (clean.startsWith('"') && clean.endsWith('"')) {
          clean = clean.substring(1, clean.length - 1).trim()
        }
        if (clean.startsWith('{')) {
          const parsed = JSON.parse(clean)
          return parsed.summary || overallSummary
        }
      } catch (e) {
        // Not JSON, just return original
      }
    }
    return overallSummary
  })()

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end"
      ref={containerRef}
    >
      {/* Summary Window */}
      {isOpen && (
        <MotionWrapper
          animation="fadeInUp"
          duration={0.3}
          className="mb-4 w-[calc(100vw-32px)] h-[calc(80vh-128px)] sm:w-[400px] bg-white dark:bg-neutral-900 rounded-[30px] shadow-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary p-5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-bold">Gyanoday AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                  <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">
                    Online
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-neutral-50/50 dark:bg-neutral-900/50">
            {isGeneratingSummary ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="relative bg-primary/10 p-4 rounded-full">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <p className="text-primary font-bold text-center animate-pulse">
                  {t(
                    'common.student_dashboard.generating_summary_title',
                    'Analyzing Your Learning Journey'
                  )}
                </p>
              </div>
            ) : displaySummary ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-1 mb-6">
                  <p className="text-[10px] text-center font-bold text-philosophy/60 uppercase tracking-widest">
                    {t(
                      'common.student_dashboard.summary_header',
                      'Your Learning Journey & Progress'
                    )}
                  </p>
                  <div className="h-0.5 w-8  bg-primary/20 rounded-full" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm text-white">
                    <Bot size={16} />
                  </div>
                  <div className="bg-primary text-white p-4 rounded-2xl rounded-tl-none shadow-md text-sm md:text-base font-medium leading-relaxed">
                    <MarkdownRenderer
                      content={displaySummary as string}
                      className="text-white prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white prose-a:text-white prose-li:text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                  <Bot className="h-12 w-12 text-primary opacity-50" />
                </div>
                <div className="space-y-2">
                  <p className="text-primary font-bold text-lg">
                    {t(
                      'common.student_dashboard.empty_summary_title',
                      'Ready to start your journey?'
                    )}
                  </p>
                  <p className="text-neutral-500 text-sm max-w-[200px] mx-auto">
                    {t(
                      'common.student_dashboard.empty_summary_subtitle',
                      'Take a quiz to see your progress, achievements, and personal learning path here!'
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </MotionWrapper>
      )}

      {/* Floating GIF Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-24 h-24 sm:w-32 sm:h-32 transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
        aria-label="Toggle AI Summary"
      >
        {/* Tooltip/Label on Hover (Cloud Style) */}
        <div className="absolute -top-10 right-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 pointer-events-none z-20">
          <div className="relative">
            {/* Main Cloud Body */}
            <div className="bg-primary text-white text-[10px] uppercase tracking-widest font-black py-2.5 px-5 rounded-[2rem] whitespace-nowrap shadow-2xl relative z-10 border-2 border-white/20 backdrop-blur-sm">
              Quick Summary ☆
            </div>
            {/* "Dot Dot Small Big" Tail - Adjusted to point from cloud edge towards centered bot */}
            <div className="absolute -bottom-1 right-10 w-4 h-4 bg-primary rounded-full z-0 shadow-lg" />{' '}
            {/* Big Dot */}
            <div className="absolute -bottom-4 right-13 w-2.5 h-2.5 bg-primary rounded-full z-0 shadow-md" />{' '}
            {/* Medium Dot */}
            <div className="absolute -bottom-7 right-16 w-1.5 h-1.5 bg-primary rounded-full z-0 shadow-sm" />{' '}
            {/* Small Dot */}
          </div>
        </div>

        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75 group-hover:scale-110" />

        {/* AI GIF */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <Image
            src="/AI.gif"
            alt="AI Summary"
            width={120}
            height={120}
            className="w-[85%] h-[85%] object-contain drop-shadow-2xl"
            unoptimized
          />
        </div>
      </button>
    </div>
  )
}
