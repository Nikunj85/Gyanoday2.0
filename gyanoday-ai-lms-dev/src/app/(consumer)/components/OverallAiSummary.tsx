'use client'

import { MessageCircle, Quote, Sparkles } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { useUserStore } from '@/store/user-store'

export const OverallAiSummary = () => {
  const { t } = useTranslation()
  const { overallSummary, isGeneratingSummary } = useUserStore()

  // Clean the summary if it's still a raw string/JSON
  const displaySummary = React.useMemo(() => {
    if (!overallSummary) return null
    if (typeof overallSummary === 'string' && overallSummary.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(overallSummary)
        return parsed.summary || overallSummary
      } catch (_e) {
        return overallSummary
      }
    }
    return overallSummary
  }, [overallSummary])

  if (isGeneratingSummary) {
    return (
      <div className="container mx-auto px-4 mb-0">
        <div className="flex flex-col gap-6">
          <div className="group relative mt-5">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-philosophy/5 to-primary/10 rounded-[36px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-white dark:bg-neutral-900 rounded-[32px] p-8 md:p-12 border border-neutral-100 dark:border-neutral-800  overflow-hidden min-h-[160px] flex flex-col items-center">
              <div className="absolute inset-0 animate-shimmer" />

              <div className="flex items-center gap-2 mb-6 relative z-10 opacity-30">
                <Sparkles className="w-4 h-4 text-philosophy" />
                <h2 className="text-sm font-bold text-philosophy tracking-wider uppercase">
                  {t('common.student_dashboard.overall_ai_summary')}
                </h2>
              </div>

              <div className="space-y-3 relative z-10 w-full">
                <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                <div className="h-4 w-[95%] bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                <div className="h-4 w-[90%] bg-neutral-100 dark:bg-neutral-800 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="overall-ai-summary-section" className="container mx-auto px-4 mb-0 relative z-10">
      <MotionWrapper animation="fadeInUp" delay={0.3}>
        <div className="flex flex-col gap-6">
          {/* Summary Card */}
          <div className="group relative mt-4">
            {/* Background Decorative Gradient */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-philosophy/5 to-primary/10 rounded-[36px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />

            <div className="relative bg-white dark:bg-neutral-900 rounded-[32px] p-8 md:p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 min-h-[160px] flex items-center overflow-hidden">
              {/* Decorative Large Quotes - Background Elements */}
              <div className="absolute top-3 left-4 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none z-0">
                <Quote className="w-8 h-8 md:w-6 md:h-6 text-philosophy fill-current rotate-180" />
              </div>
              <div className="absolute bottom-3 right-4 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none z-0">
                <Quote className="w-8 h-8 md:w-6 md:h-6 text-philosophy fill-current" />
              </div>

              {/* Content */}
              <div className="relative z-10 w-full flex flex-col items-center">
                {/* Title inside card */}
                <div className="flex items-center gap-2 mb-1 opacity-80">
                  <Sparkles className="w-4 h-4 text-philosophy dark:text-lavender-mist" />
                  <h3 className="text-md font-bold text-philosophy dark:text-lavender-mist uppercase">
                    {t('common.student_dashboard.overall_ai_summary')}
                  </h3>
                </div>

                {displaySummary ? (
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <div className="text-neutral-700  dark:text-neutral-300 text-sm md:text-lg lg:text-lg font-medium text-center md:px-2">
                      <MarkdownRenderer content={displaySummary} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
                    <div className="w-12 h-12 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-1">
                      <MessageCircle className="w-6 h-6 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                      {t('common.student_dashboard.no_summary_yet')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </MotionWrapper>
    </div>
  )
}
