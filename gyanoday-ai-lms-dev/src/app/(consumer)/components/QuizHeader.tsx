import React from 'react'
import { useTranslation } from 'react-i18next'

import { Timer } from '../components/Timer'

interface QuizHeaderProps {
  title?: string
  subjectColor: string
  isReviewMode: boolean
  prevTime: string
  onQuit: () => void
  onTimeUpdate: (time: number) => void
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  title,
  subjectColor,
  isReviewMode,
  prevTime,
  onQuit,
  onTimeUpdate,
}) => {
  const { t } = useTranslation()

  return (
    <div className="w-full bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 py-4 mb-4 px-4 transition-colors duration-300 shadow-sm">
      <div className="container mx-auto relative flex flex-col md:flex-row items-center justify-between gap-4 min-h-[60px]">
        {/* Quit Button */}
        <div className="shrink-0 md:absolute md:left-4 top-1/2 md:-translate-y-1/2">
          <button
            onClick={onQuit}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:bg-red-50 text-red-500 border border-red-100 cursor-pointer"
          >
            {isReviewMode ? t('common.quiz.exit_review') : t('common.quiz.quit_quiz')}
          </button>
        </div>

        {/* Title */}
        <div className="text-center w-full px-12 md:px-32">
          <h2
            className="text-xl md:text-2xl font-bold leading-relaxed max-w-[90%] mx-auto drop-shadow-sm"
            style={{ color: subjectColor }}
          >
            {title}
          </h2>
        </div>

        {/* Timer */}
        <div className="shrink-0 md:absolute md:right-4 top-1/2 md:-translate-y-1/2">
          <Timer
            onTimeUpdate={onTimeUpdate}
            isActive={!isReviewMode}
            color={subjectColor}
            staticTime={isReviewMode ? prevTime : undefined}
          />
        </div>
      </div>
    </div>
  )
}
