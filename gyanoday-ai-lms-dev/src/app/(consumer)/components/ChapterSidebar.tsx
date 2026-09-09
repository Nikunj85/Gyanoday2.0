'use client'

import { Check, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'
import { cn } from '@/lib/utils'
import { Chapter } from '@/types'

interface ChapterSidebarProps {
  chapters: Chapter[]
  activeChapterId: string | null
  completedChapterIds: string[]
  /** chapter_id -> number of quiz attempts, from quizAttemptsService.getChapterQuizAttempts.
   * "Total Test" was previously always 0 because this was never actually
   * wired to real attempt data. */
  testCounts?: Record<string, number>
  onChapterSelect: (chapterId: string) => void
  onToggleCompletion?: (chapterId: string, nextCompleted: boolean) => void
  themeColor: string
}

export function ChapterSidebar({
  chapters,
  activeChapterId,
  completedChapterIds,
  testCounts = {},
  onChapterSelect,
  onToggleCompletion,
  themeColor,
}: ChapterSidebarProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const sidebarContent = (
    <div className="flex flex-col h-full bg-transparent relative w-full transition-colors duration-300">
      <div className="pb-8 pt-6 flex flex-col items-center w-full">
        <div className="relative inline-block mx-auto">
          <h2
            className="text-2xl font-black text-center px-4 dark:text-lavender-mist"
            style={{ color: themeColor }}
          >
            {t('common.chapter_list')}
          </h2>
          {/* Stylized Underline */}
          <div
            className="absolute -bottom-1 left-4 right-4 h-1 rounded-full opacity-30"
            style={{
              backgroundColor: themeColor,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pt-4 pb-8">
        <MotionContainer staggerChildren={0.1} delayChildren={0.2} className="flex flex-col gap-4">
          {chapters.map((chapter, index) => {
            const isActive = activeChapterId === chapter.id
            const isCompleted = completedChapterIds.includes(chapter.id)
            const testCount = testCounts[chapter.id] ?? 0
            const isHovered = hoveredId === chapter.id

            return (
              <MotionWrapper key={chapter.id} animation="fadeInRight" className="w-full">
                <div
                  title={chapter.title}
                  className={cn(
                    'w-full rounded-r-[1rem] transition-all duration-200 group flex flex-col p-4 xl:p-5 cursor-pointer relative',
                    isActive
                      ? 'shadow-lg z-10'
                      : 'bg-white dark:bg-neutral-800 shadow-sm border-y border-r border-gray-50 dark:border-neutral-700 hover:border-gray-100 dark:hover:border-neutral-600'
                  )}
                  style={
                    isActive
                      ? { backgroundColor: themeColor }
                      : isHovered
                        ? { backgroundColor: themeColor + '15' }
                        : undefined
                  }
                  onClick={() => {
                    onChapterSelect(chapter.id)
                    setIsOpen(false)
                  }}
                  onMouseEnter={() => setHoveredId(chapter.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center gap-5 w-full">
                    {/* Left Side: Status Icon / Checkbox / Sequence Number */}
                    <div className="w-10 flex-shrink-0 flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          // Independent of selecting the chapter — without
                          // this, clicking the checkbox did nothing but
                          // select the row underneath it (the checkbox had
                          // no click handler of its own at all).
                          e.stopPropagation()
                          onToggleCompletion?.(chapter.id, !isCompleted)
                        }}
                        disabled={!onToggleCompletion}
                        title={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
                        className={cn(
                          'w-7 h-7 flex items-center justify-center transition-all rounded-md border-2',
                          onToggleCompletion && 'cursor-pointer hover:scale-110 active:scale-95',
                          isActive
                            ? 'border-white/40 bg-white/10'
                            : isCompleted
                              ? 'border-transparent bg-gray-50 dark:bg-neutral-700/50'
                              : 'border-gray-100 dark:border-neutral-700 bg-transparent'
                        )}
                        style={
                          !isActive && isCompleted
                            ? { backgroundColor: themeColor + '15', borderColor: themeColor + '30' }
                            : undefined
                        }
                      >
                        {isCompleted && (
                          <Check
                            size={16}
                            strokeWidth={4}
                            style={{ color: isActive ? 'white' : themeColor }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Chapter Info */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <h3
                        className={cn(
                          'font-bold text-lg xl:text-xl truncate transition-colors',
                          isActive ? 'text-white' : 'text-philosophy dark:text-lavender-mist'
                        )}
                      >
                        {chapter.title}
                      </h3>

                      {/* Active State: Total Test Info */}
                      {isActive && (
                        <p className="text-white/90 text-sm font-semibold mt-0.5">
                          {t('common.total_test')}: {String(testCount).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </MotionWrapper>
            )
          })}
        </MotionContainer>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-6 px-4 flex justify-center w-full">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full max-w-md py-4 px-6 rounded-2xl flex items-center justify-between text-white font-black shadow-xl active:scale-[0.98] transition-all"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center gap-3">
            <Menu size={24} />
            <span>{t('common.chapter_list')}</span>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
            {chapters.length} {t('common.chapters')}
          </div>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-full h-[calc(100vh-120px)] sticky top-28">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[100] lg:hidden transition-all duration-500',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsOpen(false)}
        />

        {/* Content */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-neutral-900 rounded-t-[40px] transition-transform duration-500 ease-out flex flex-col p-6 shadow-2xl',
            isOpen ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto absolute top-3 left-1/2 -translate-x-1/2" />
            <button
              onClick={() => setIsOpen(false)}
              className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-lavender-mist rounded-full ml-auto"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">{sidebarContent}</div>
        </div>
      </div>
    </>
  )
}
