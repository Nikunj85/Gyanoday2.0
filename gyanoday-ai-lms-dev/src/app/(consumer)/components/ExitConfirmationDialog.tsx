'use client'

import { AlertCircle, LogOut, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

interface ExitConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  primaryColor?: string
}

export function ExitConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  primaryColor = '#947fc2',
}: ExitConfirmationDialogProps) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Content */}
      <div className="relative bg-white dark:bg-neutral-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          {/* Icon Header */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center relative"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <AlertCircle className="w-8 h-8" style={{ color: primaryColor }} />
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-center text-neutral-800 dark:text-neutral-100 mb-2">
            {t('common.quiz.exit_dialog.title')}
          </h3>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
            {t('common.quiz.exit_dialog.description')}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full cursor-pointer flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white shadow-lg active:scale-[0.98] transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              <LogOut className="w-5 h-5" />
              {t('common.quiz.exit_dialog.confirm')}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-[0.98]"
            >
              {t('common.quiz.exit_dialog.cancel')}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
