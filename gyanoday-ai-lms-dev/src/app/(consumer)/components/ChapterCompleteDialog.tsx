'use client'

import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ChapterCompleteDialogProps {
  open: boolean
  chapterTitle: string
  /** true  = the student is about to MARK the chapter completed
   *  false = the student is about to UNMARK a completed chapter */
  markAsCompleted: boolean
  isPending?: boolean
  themeColor?: string
  onConfirm: () => void
  onCancel: () => void
}

type Copy = {
  completeTitle: string
  completeBody: (chapter: string) => string
  undoTitle: string
  undoBody: (chapter: string) => string
  yes: string
  no: string
}

// Built in so the dialog is correct in all three medium languages even before
// the locale JSON files get the matching keys.
const COPY: Record<string, Copy> = {
  en: {
    completeTitle: 'Are you sure?',
    completeBody: (c) => `Have you completed "${c}"? It will be counted in your progress.`,
    undoTitle: 'Mark as not completed?',
    undoBody: (c) => `Do you want to mark "${c}" as not completed?`,
    yes: 'Yes',
    no: 'No',
  },
  hi: {
    completeTitle: 'क्या आप सुनिश्चित हैं?',
    completeBody: (c) => `क्या आपने "${c}" पूरा कर लिया है? यह आपकी प्रगति में गिना जाएगा।`,
    undoTitle: 'अधूरा के रूप में चिह्नित करें?',
    undoBody: (c) => `क्या आप "${c}" को अधूरा चिह्नित करना चाहते हैं?`,
    yes: 'हाँ',
    no: 'नहीं',
  },
  gu: {
    completeTitle: 'શું તમને ખાતરી છે?',
    completeBody: (c) => `શું તમે "${c}" પૂર્ણ કરી લીધું છે? તે તમારી પ્રગતિમાં ગણાશે.`,
    undoTitle: 'અપૂર્ણ તરીકે ચિહ્નિત કરવું?',
    undoBody: (c) => `શું તમે "${c}" ને અપૂર્ણ તરીકે ચિહ્નિત કરવા માંગો છો?`,
    yes: 'હા',
    no: 'ના',
  },
}

export function ChapterCompleteDialog({
  open,
  chapterTitle,
  markAsCompleted,
  isPending = false,
  themeColor = '#B188C0',
  onConfirm,
  onCancel,
}: ChapterCompleteDialogProps) {
  const { i18n } = useTranslation()
  const lang = (i18n.language || 'en').split('-')[0]
  const copy = COPY[lang] || COPY.en

  const Icon = markAsCompleted ? CheckCircle2 : RotateCcw

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !isPending && onCancel()}>
      <AlertDialogContent className="max-w-sm rounded-3xl border border-neutral-100 bg-white p-7 text-center shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <AlertDialogHeader className="items-center space-y-3 text-center sm:text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
          >
            <Icon size={28} />
          </div>
          <AlertDialogTitle className="text-xl font-black text-neutral-900 dark:text-white">
            {markAsCompleted ? copy.completeTitle : copy.undoTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {markAsCompleted ? copy.completeBody(chapterTitle) : copy.undoBody(chapterTitle)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {copy.no}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
            style={{ backgroundColor: themeColor }}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {copy.yes}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
