import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import { cn } from '@/lib/utils'
import { Option } from '@/types/quiz'

interface QuizCardProps {
  totalQuestions: number
  currentQuestionIndex: number
  questionText: string
  questionImage?: string
  options: Option[]
  type: 'single' | 'multiple'
  onNext: (selectedIds: string[]) => void
  onBack?: () => void
  reviewMode?: boolean
  initialSelections?: string[]
  primaryColor?: string
  correctAnswerIds?: string[]
  isSubmitting?: boolean
}

export const QuizCard = ({
  totalQuestions,
  currentQuestionIndex,
  questionText,
  questionImage,
  options,
  type,
  onNext,
  onBack,
  reviewMode = false,
  initialSelections = [],
  primaryColor = 'var(--ariana-pink)',
  correctAnswerIds = [],
  isSubmitting = false,
}: QuizCardProps) => {
  const { t } = useTranslation()
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialSelections)

  // Update selection if initialSelections changes (e.g. navigating through questions)
  useEffect(() => {
    setSelectedOptions(initialSelections)
  }, [initialSelections])

  return (
    <div className="w-full max-w-[1500px] mx-auto py-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side - Question */}
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] min-h-[400px] flex flex-col border border-gray-100 dark:border-neutral-800 transition-colors duration-300">
          <span
            className="font-bold text-lg md:text-xl  mb-6"
            style={{ color: `${primaryColor}99` }}
          >
            {t('common.quiz.question')} {currentQuestionIndex + 1} / {totalQuestions}
          </span>

          <div className="flex-grow flex flex-col justify-center items-center text-center space-y-1">
            <h2 className="text-[#3B393B] dark:text-lavender-mist text-xl md:text-2xl font-bold  leading-relaxed max-w-[90%] mx-auto transition-colors duration-300">
              <MarkdownRenderer content={questionText} />
            </h2>

            {/* Question Image/Figure */}
            {questionImage && (
              <div className="w-full max-w-[400px] aspect-[4/3] relative">
                <Image src={questionImage} alt="Question Diagram" fill className="object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Options & Actions */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            {options.map((option) => {
              const isSelected = selectedOptions.includes(option.id)
              const isCorrect = correctAnswerIds.includes(option.id)

              // 1. Calculate how many correct answers student actually picked
              const selectedCorrectCount = selectedOptions.filter((id) =>
                correctAnswerIds.includes(id)
              ).length

              // 2. Scenario-based Visibility
              const isCorrectSelected = reviewMode && isCorrect && isSelected
              const isWrongSelected = reviewMode && !isCorrect && isSelected

              // 3. Highlighted Correct (Missed)
              // Scenario A: Partial Correct -> Show Border + Badge
              const isMissedWithBadge =
                reviewMode &&
                type === 'multiple' &&
                isCorrect &&
                !isSelected &&
                selectedCorrectCount > 0

              // Scenario B: Total Miss -> Show Solid Fill (No badge)
              const isMissedWithSolidFill =
                reviewMode && isCorrect && !isSelected && selectedCorrectCount === 0

              // Combined Correct State for general styling
              const shouldBeGreenFill = isCorrectSelected || isMissedWithSolidFill

              return (
                <button
                  key={option.id}
                  disabled={isSubmitting}
                  onClick={() => {
                    if (reviewMode || isSubmitting) return
                    if (type === 'single') {
                      setSelectedOptions((prev) => (prev.includes(option.id) ? [] : [option.id]))
                    } else {
                      setSelectedOptions((prev) =>
                        prev.includes(option.id)
                          ? prev.filter((id) => id !== option.id)
                          : [...prev, option.id]
                      )
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 text-left relative',
                    reviewMode || isSubmitting ? 'cursor-default' : 'cursor-pointer',
                    shouldBeGreenFill || isWrongSelected
                      ? 'shadow-md'
                      : 'bg-white dark:bg-neutral-900 border-2 border-transparent dark:border-neutral-800 hover:border-black/5 dark:hover:border-white/5 shadow-sm',
                    isMissedWithBadge && 'border-success border-2 shadow-sm'
                  )}
                  style={(() => {
                    if (reviewMode) {
                      if (shouldBeGreenFill)
                        return {
                          backgroundColor:
                            primaryColor === 'var(--ariana-pink)'
                              ? 'var(--success)'
                              : 'var(--success)',
                        }
                      if (isWrongSelected) return { backgroundColor: 'var(--color-error)' }
                      return {}
                    }
                    return isSelected ? { backgroundColor: primaryColor } : {}
                  })()}
                >
                  <div
                    className={cn(
                      'w-10 h-10 flex items-center justify-center rounded-full font-bold  text-lg transition-all shrink-0',
                      shouldBeGreenFill || isWrongSelected
                        ? 'text-white bg-[#3B393B]'
                        : 'text-[#3B393B] dark:text-lavender-mist bg-gray-200 dark:bg-neutral-800'
                    )}
                  >
                    <MarkdownRenderer content={option.label} />
                  </div>
                  <span
                    className={cn(
                      'text-lg font-bold  flex-grow transition-colors duration-300',
                      shouldBeGreenFill || isWrongSelected
                        ? 'text-white'
                        : 'text-[#3B393B] dark:text-lavender-mist'
                    )}
                  >
                    <MarkdownRenderer content={option.text} />
                  </span>
                  {isMissedWithBadge && (
                    <div className="absolute bottom-2 right-4 bg-green-50 dark:bg-success/80 px-2 py-0.5 rounded-full border border-green-200 dark:border-success-800">
                      <span className="lg:text-[10px] md:text-[9px] text-[8px] uppercase tracking-wider font-bold text-green-600 dark:text-success-400 leading-none whitespace-nowrap">
                        {t('common.quiz.missed', 'You missed this')}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {type === 'multiple' && !reviewMode && (
            <div className="flex items-center gap-2 mt-2 px-1 text-neutral-500 dark:text-neutral-400 animate-in fade-in slide-in-from-top-1 duration-500">
              <span className="text-sm font-medium italic">
                {t(
                  'common.quiz.multiple_hint',
                  'Think carefully! More than one option might be correct.'
                )}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 cursor-pointer border-2 px-2 py-3 rounded-xl font-bold text-xl transition-all hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-30  shadow-sm"
              style={{
                borderColor: `${primaryColor}4D`, // 30% opacity
                color: primaryColor,
              }}
            >
              <ChevronLeft className="w-6 h-6 stroke-[3]" /> {t('common.quiz.previous')}
            </button>
            <button
              onClick={() => {
                onNext(selectedOptions)
                if (!reviewMode) setSelectedOptions([])
              }}
              disabled={(!reviewMode && selectedOptions.length === 0) || isSubmitting}
              className="flex-1 flex items-center cursor-pointer justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-3 md:px-7 md:py-4 rounded-xl font-bold text-xl transition-all shadow-lg active:scale-[0.98] "
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t('common.quiz.submitting')}
                </>
              ) : currentQuestionIndex === totalQuestions - 1 && !reviewMode ? (
                t('common.quiz.submit')
              ) : reviewMode && currentQuestionIndex === totalQuestions - 1 ? (
                t('common.quiz.exit_review')
              ) : (
                <>
                  {t('common.quiz.next')} <ChevronRight className="w-6 h-6 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
