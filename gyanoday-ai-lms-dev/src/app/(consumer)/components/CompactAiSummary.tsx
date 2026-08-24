'use client'

import { Sparkles } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { useUserStore } from '@/store/user-store'

/**
 * A short, scannable summary instead of the old full-letter "Siksha
 * Inspire" section ("Dear X, ... Best regards" format) — 2-3 sentences,
 * no letter framing. Reuses the same overallSummary/isGeneratingSummary
 * state (populated after a quiz result) so no new data plumbing is
 * needed; PROMPT_STUDENT_OVERALL_SUMMARY was tightened to actually
 * produce this length now.
 */
export function CompactAiSummary() {
  const { t } = useTranslation()
  const { overallSummary, isGeneratingSummary } = useUserStore()

  const displaySummary = React.useMemo(() => {
    if (!overallSummary) return null
    if (typeof overallSummary === 'string' && overallSummary.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(overallSummary)
        return parsed.summary || overallSummary
      } catch {
        return overallSummary
      }
    }
    return overallSummary
  }, [overallSummary])

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-philosophy dark:text-lavender-mist" />
        <h4 className="text-sm font-bold text-philosophy dark:text-lavender-mist uppercase tracking-wide">
          {t('common.student_dashboard.overall_ai_summary', 'Siksha Inspire')}
        </h4>
      </div>

      {isGeneratingSummary ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
          <div className="h-3.5 w-[85%] bg-neutral-100 dark:bg-neutral-800 rounded-full" />
        </div>
      ) : displaySummary ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {displaySummary}
        </p>
      ) : (
        <p className="text-sm text-neutral-400">
          {t(
            'common.student_dashboard.overall_ai_summary_empty',
            'Complete a quiz to get a personalized summary of your progress here.'
          )}
        </p>
      )}
    </div>
  )
}
