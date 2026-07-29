import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'

interface ResultCardProps {
  score: number
  totalQuestions: number
  onReview: () => void
  onPlayAgain: () => void
  onDashboard: () => void
  primaryColor?: string
  insight?: {
    insight_text: string
    weak_areas: string[]
  } | null
  isLoading?: boolean
  error?: 'quota_exceeded' | 'generic' | null
}

export const ResultCard = ({
  score,
  totalQuestions,
  onReview,
  onPlayAgain,
  onDashboard,
  primaryColor = 'var(--ariana-pink)',
  insight,
  isLoading = false,
  error,
}: ResultCardProps) => {
  const { t } = useTranslation()
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0

  const getFeedbackMessage = () => {
    if (percentage >= 80) return t('common.quiz_result.feedback.fantastic')
    if (percentage >= 50) return t('common.quiz_result.feedback.good')
    return t('common.quiz_result.feedback.practice')
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Main Insight Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1000px] bg-white dark:bg-neutral-900 rounded-[48px] p-8 md:p-16 shadow-[0_10px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_50px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-neutral-800 relative mb-12 transition-colors duration-300"
      >
        {/* Sparkle Icons with floating animation */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 15, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-12 left-8 md:left-16 opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 40 40" fill={primaryColor}>
            <path d="M20 0C20 0 20 20 0 20C20 20 20 40 20 40C20 40 20 20 40 20C20 20 20 0 20 0Z" />
          </svg>
        </motion.div>

        <motion.div
          animate={{
            y: [0, 10, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute top-12 right-8 md:right-16 opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 40 40" fill={primaryColor}>
            <path d="M20 0C20 0 20 20 0 20C20 20 20 40 20 40C20 40 20 20 40 20C20 20 20 0 20 0Z" />
          </svg>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-2xl w-48 mx-auto animate-pulse" />
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-3/4 mx-auto animate-pulse" />
                  <div className="h-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg w-1/2 mx-auto opacity-60 animate-pulse" />
                </div>
                <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-10 rounded-[40px] border border-neutral-100/50 dark:border-neutral-800/50">
                  <div className="space-y-4">
                    <div className="h-3 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-full w-full animate-pulse" />
                    <div className="h-3 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-full w-11/12 animate-pulse" />
                    <div className="h-3 bg-neutral-200/50 dark:bg-neutral-700/50 rounded-full w-4/5 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <p className="text-sm font-bold text-primary tracking-[0.2em] uppercase opacity-80">
                    {t('common.quiz_result.creating_insight')}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center space-y-6 pt-10 pb-4"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2"
              >
                <span className="text-4xl">⚠️</span>
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {error === 'quota_exceeded'
                  ? t('common.quiz.error_title', 'Generation Limit Reached')
                  : t('common.quiz_result.insight_error_title', 'Learning Insight Unavailable')}
              </h2>
              <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
                {error === 'quota_exceeded'
                  ? t(
                      'common.quiz.quota_exceeded',
                      'You have reached your limit of AI quizzes per day. Please try again tomorrow.'
                    )
                  : t(
                      'common.quiz_result.insight_error_desc',
                      "We're having trouble generating your personalized insight right now. Don't worry, your score has been saved!"
                    )}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-center space-y-8"
            >
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-bold"
                style={{ color: `${primaryColor}cc` }}
              >
                {t('common.quiz_result.learning_insight')}
              </motion.h2>

              <div className="space-y-4">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-philosophy dark:text-lavender-mist text-xl md:text-2xl font-bold transition-colors duration-300"
                >
                  {getFeedbackMessage()}{' '}
                  <span className="text-[#00000099] dark:text-white/60">
                    {t('common.quiz_result.score_text', { score, total: totalQuestions })}
                  </span>
                </motion.h3>

                <div className="max-w-3xl mx-auto space-y-6 pt-4 min-h-[140px]">
                  <AnimatePresence mode="wait">
                    {insight ? (
                      <motion.div
                        key="insight-content"
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          duration: 0.6,
                          type: 'spring',
                          stiffness: 100,
                          damping: 20,
                        }}
                        className="space-y-6"
                      >
                        <div className="bg-primary/5 p-8 rounded-[32px] border border-primary/10 transition-shadow hover:shadow-sm">
                          {insight?.insight_text}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="insight-placeholder"
                        className="h-24 flex items-center justify-center text-neutral-400 italic"
                      >
                        {t('common.quiz_result.waiting_for_insight')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons Row */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 w-full max-w-[1000px] lg:w-[900px] 2xl:w-[900px]"
        >
          <motion.button
            whileHover={{ scale: 1.02, x: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReview}
            className="flex-1 min-w-[200px] flex cursor-pointer items-center justify-center gap-2 bg-white dark:bg-neutral-900 border-2 lg:px-8 lg:py-4 px-2 py-4 rounded-xl font-bold text-xl md:text-lg lg:text-xl transition-all shadow-sm"
            style={{
              borderColor: `${primaryColor}4D`,
              color: primaryColor,
            }}
          >
            <ChevronLeft className="w-6 h-6 stroke-[3]" /> {t('common.quiz_result.buttons.review')}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayAgain}
            className="flex-1 min-w-[200px] cursor-pointer flex items-center justify-center gap-2 bg-primary text-white lg:px-8 lg:py-4 px-2 py-4 rounded-xl font-bold text-xl md:text-lg lg:text-xl transition-all shadow-lg shadow-primary/20"
            style={{ backgroundColor: primaryColor }}
          >
            {t('common.quiz_result.buttons.retest')}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDashboard}
            className="flex-1 min-w-[200px] cursor-pointer flex items-center justify-center gap-2 text-white lg:px-8 lg:py-4 px-2 py-4 rounded-xl font-bold text-xl md:text-lg lg:text-xl transition-all shadow-lg shadow-primary/10"
            style={{ backgroundColor: primaryColor }}
          >
            {t('common.quiz_result.buttons.back')} <ChevronRight className="w-6 h-6 stroke-[3]" />
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
