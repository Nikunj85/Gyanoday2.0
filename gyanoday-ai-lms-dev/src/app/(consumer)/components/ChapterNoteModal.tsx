'use client'

import { Loader2, NotebookPen, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ChapterNoteModalProps {
  isOpen: boolean
  onClose: () => void
  chapterTitle: string
  initialContent: string
  isSaving: boolean
  onSave: (content: string) => void
  themeColor?: string
}

export function ChapterNoteModal({
  isOpen,
  onClose,
  chapterTitle,
  initialContent,
  isSaving,
  onSave,
  themeColor = '#7C6FE0',
}: ChapterNoteModalProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState(initialContent)

  useEffect(() => {
    if (isOpen) setContent(initialContent)
  }, [isOpen, initialContent])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}
            >
              <NotebookPen size={18} />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-neutral-800 dark:text-neutral-100">
                {t('common.chapter_notes.title', 'Save Notes')}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {t('common.chapter_notes.subtitle', 'Add quick notes for "{{chapter}}".', {
                  chapter: chapterTitle,
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t(
              'common.chapter_notes.placeholder',
              'Write your thoughts, patterns, or reminders…'
            )}
            rows={8}
            className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-sm text-neutral-700 dark:text-neutral-200 outline-none resize-none focus:ring-2 transition-shadow"
            style={{ ['--tw-ring-color' as string]: `${themeColor}55` }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-5">
          <button
            onClick={onClose}
            className="text-sm font-bold text-neutral-500 dark:text-neutral-400 px-4 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={() => onSave(content)}
            disabled={isSaving}
            className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2 rounded-xl disabled:opacity-50 transition-all active:scale-95"
            style={{ backgroundColor: themeColor }}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
