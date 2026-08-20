'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Layers,
  MessageCircleQuestion,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import { cn } from '@/lib/utils'
import { SmartNotes } from '@/types/smartnotes'

interface SmartNotesProps {
  notes?: SmartNotes | null
}

/** One active-recall flashcard — prompt visible, answer hidden until tapped. */
function RecallToggle({ prompt, answer, index }: { prompt: string; answer: string; index: number }) {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      onClick={() => setIsRevealed((v) => !v)}
      className="w-full text-left border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl p-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <MarkdownRenderer content={prompt} className="text-sm font-semibold flex-1" />
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 mt-0.5 text-neutral-400 transition-transform duration-200',
            isRevealed && 'rotate-180 text-indigo-500'
          )}
        />
      </div>

      <AnimatePresence initial={false}>
        {isRevealed ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-dashed border-indigo-200 dark:border-indigo-900/60">
              <MarkdownRenderer
                content={answer}
                className="text-sm text-emerald-700 dark:text-emerald-400"
              />
            </div>
          </motion.div>
        ) : (
          <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-500 mt-2">
            Tap to reveal
          </p>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/** One embedded quick-check MCQ — student picks an option and gets instant
 * right/wrong feedback right there in the notes, no separate quiz flow. */
function FeedbackModule({
  question,
  options,
  correctAnswer,
  index,
}: {
  question: string
  options: string[]
  correctAnswer: string
  index: number
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl p-4"
    >
      <div className="flex items-start gap-2 mb-3">
        <MessageCircleQuestion size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <MarkdownRenderer content={question} className="text-sm font-semibold flex-1" />
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selected === opt
          const isCorrectOption = opt === correctAnswer
          const showState = selected !== null
          return (
            <button
              key={opt}
              disabled={showState}
              onClick={() => setSelected(opt)}
              className={cn(
                'w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-sm font-medium border transition-all',
                !showState &&
                  'border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20',
                showState &&
                  isCorrectOption &&
                  'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                showState &&
                  isSelected &&
                  !isCorrectOption &&
                  'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                showState &&
                  !isSelected &&
                  !isCorrectOption &&
                  'opacity-50 border-neutral-100 dark:border-neutral-800'
              )}
            >
              <span className="flex-1">{opt}</span>
              {showState && isCorrectOption && <CheckCircle2 size={16} className="shrink-0" />}
              {showState && isSelected && !isCorrectOption && <XCircle size={16} className="shrink-0" />}
            </button>
          )
        })}
      </div>

      {selected && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'mt-3 text-xs font-bold',
            selected === correctAnswer
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400'
          )}
        >
          {selected === correctAnswer ? "Correct! Nice work." : `Not quite — the answer is "${correctAnswer}".`}
        </motion.p>
      )}
    </motion.div>
  )
}

function LayerHeader({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode
  label: string
  description: string
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-tight">{label}</p>
        <p className="text-[11px] text-neutral-400 leading-tight">{description}</p>
      </div>
    </div>
  )
}

/**
 * Renders "Living" Smart Notes as three clearly separated structural
 * sections, per the Cognitive Quiz Matrix spec:
 *   - Core Layer: the actual explanatory text.
 *   - Interactive Layer: click-to-reveal active-recall flashcards.
 *   - Feedback Layer: instant-feedback quiz modules embedded in the notes.
 */
export const SmartNotesRenderer = ({ notes }: SmartNotesProps) => {
  const hasNotes =
    !!notes &&
    !!notes.core_layer &&
    Array.isArray(notes.interactive_layer) &&
    Array.isArray(notes.feedback_layer)

  if (!hasNotes) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
        <Brain className="w-12 h-12 text-neutral-400 mb-3 animate-pulse" />
        <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
          No Smart Notes Available
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mt-1">
          Smart notes for this chapter are currently being compiled.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center gap-3 p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl backdrop-blur-sm">
        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            Living Smart Notes
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Read the core notes, test recall, then check your understanding.
          </p>
        </div>
      </div>

      {/* Core Layer */}
      <section>
        <LayerHeader
          icon={<BookOpen size={16} />}
          label="Core Layer"
          description="The chapter, explained"
        />
        <div className="border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl p-5">
          <MarkdownRenderer content={notes!.core_layer} className="text-sm leading-relaxed" />
        </div>
      </section>

      {/* Interactive Layer */}
      {notes!.interactive_layer.length > 0 && (
        <section>
          <LayerHeader
            icon={<Layers size={16} />}
            label="Interactive Layer"
            description="Tap each card to test your recall"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {notes!.interactive_layer.map((item, idx) => (
              <RecallToggle key={idx} prompt={item.prompt} answer={item.answer} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Feedback Layer */}
      {notes!.feedback_layer.length > 0 && (
        <section>
          <LayerHeader
            icon={<MessageCircleQuestion size={16} />}
            label="Feedback Layer"
            description="Quick checks with instant feedback"
          />
          <div className="space-y-3">
            {notes!.feedback_layer.map((q, idx) => (
              <FeedbackModule
                key={idx}
                question={q.question}
                options={q.options}
                correctAnswer={q.correct_answer}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
