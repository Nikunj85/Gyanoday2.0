'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { QuizQuestion } from '@/types/quiz'

interface ReviewAnswerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: QuizQuestion[]
}

/**
 * Shows every question from the just-completed quiz, the student's own
 * answer, the correct answer, and (when available) an explanation —
 * side by side, so a student can actually learn from a mistake instead of
 * just seeing a score.
 */
export function ReviewAnswerDrawer({ open, onOpenChange, questions }: ReviewAnswerDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Review Answers</SheetTitle>
          <SheetDescription>
            {questions.length} question{questions.length !== 1 ? 's' : ''} — see what you got
            right and what to revisit.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-8">
          {questions.map((q, idx) => {
            const studentAnswers = q.studentAnswers || []
            const isCorrect =
              studentAnswers.length === q.correctAnswerIds.length &&
              studentAnswers.every((id) => q.correctAnswerIds.includes(id))

            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-2xl border p-4',
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                    : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-400 mb-1">
                      Question {idx + 1}
                    </p>
                    <MarkdownRenderer content={q.text} className="text-sm font-medium" />
                  </div>
                </div>

                <div className="space-y-1.5 mt-3 ml-6">
                  {q.options.map((opt) => {
                    const isStudentPick = studentAnswers.includes(opt.id)
                    const isRightAnswer = q.correctAnswerIds.includes(opt.id)
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                          isRightAnswer && 'bg-emerald-100 dark:bg-emerald-900/40 font-semibold',
                          isStudentPick && !isRightAnswer && 'bg-red-100 dark:bg-red-900/40',
                          !isStudentPick && !isRightAnswer && 'bg-transparent text-neutral-500'
                        )}
                      >
                        <span className="text-xs font-bold w-5 shrink-0">{opt.label}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {isStudentPick && (
                          <span className="text-[10px] uppercase font-bold text-neutral-400">
                            Your pick
                          </span>
                        )}
                        {isRightAnswer && (
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
