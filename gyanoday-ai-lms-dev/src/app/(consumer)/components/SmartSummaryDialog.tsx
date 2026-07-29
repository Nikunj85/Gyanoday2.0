'use client'

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'

interface SmartSummaryDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  themeColor?: string
}

export function SmartSummaryDialog({
  isOpen,
  onClose,
  title,
  description,
  themeColor = '#E58B99',
}: SmartSummaryDialogProps) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm transition-opacity">
      <MotionWrapper
        animation="scaleIn"
        className="
                    relative
                    w-fit
                    min-w-[280px]
                    max-w-[90vw] sm:max-w-[500px] md:max-w-[790px]
                    max-h-[70vh] md:max-h-[72vh]
                    flex flex-col
                "
      >
        {/* Main Container */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-[50px] bg-white dark:bg-neutral-900 shadow-2xl">
          {/* Fixed Header Section */}
          <div className="px-6 md:px-12 pt-10 md:pt-12 relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-50"
            >
              <X size={24} className="text-gray-400 dark:text-neutral-500 cursor-pointer" />
            </button>

            <div className="max-w-3xl mx-auto text-center border-b border-gray-100 dark:border-neutral-800 pb-6 mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-lavender-mist tracking-tight leading-tight">
                {title}
              </h2>
            </div>
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 min-h-0">
            <div className="max-w-3xl mx-auto py-6">
              <MarkdownRenderer
                content={description}
                className="text-gray-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed font-medium transition-colors duration-300 text-left prose-p:text-gray-600 dark:prose-p:text-neutral-400 prose-headings:text-gray-800 dark:prose-headings:text-neutral-200"
              />
            </div>
          </div>

          {/* Dynamic Bottom Section */}
          <div
            className="relative md:pt-0 pt-0 pb-6 md:pt-0 md:pb-4 flex justify-center transition-colors duration-300 shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            {/* Triangle pointer pointing down */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[1px] w-0 h-0
                            border-l-[20px] md:border-l-[20px] border-l-transparent
                            border-r-[20px] md:border-r-[20px] border-r-transparent
                            border-t-[20px] md:border-t-[20px] border-t-white dark:border-t-neutral-900 z-20 transition-all duration-300"
            />

            <button
              onClick={onClose}
              className="bg-white dark:bg-neutral-800 cursor-pointer dark:text-lavender-mist px-8 mt-8 md:px-10 py-2.5 md:py-2 rounded-xl font-bold text-sm md:text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {t('common.subject_header.start_to_learn')}
            </button>
          </div>
        </div>
      </MotionWrapper>
    </div>
  )
}
