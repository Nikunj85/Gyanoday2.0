import { z } from 'zod'

/**
 * Smart Notes — "living" chapter notes split into three layers:
 *
 * - Core Layer: plain explanatory text (markdown + LaTeX), the actual
 *   content a student reads.
 * - Interactive Layer: active-recall prompts the student can click to
 *   reveal the answer (like a flashcard embedded in the notes).
 * - Feedback Layer: tiny instant-check MCQ modules embedded inline, so a
 *   student can verify understanding without leaving the notes page.
 */
export const SmartNotesInteractiveItemSchema = z.object({
  prompt: z.string(), // e.g. "What is Newton's First Law?" — shown collapsed
  answer: z.string(), // revealed on click — markdown/LaTeX supported
})

export const SmartNotesFeedbackQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct_answer: z.string(),
})

export const SmartNotesSchema = z.object({
  core_layer: z.string(), // markdown + LaTeX, the main explanatory text
  interactive_layer: z.array(SmartNotesInteractiveItemSchema).min(3).max(8),
  feedback_layer: z.array(SmartNotesFeedbackQuestionSchema).min(2).max(5),
})

export type SmartNotesGenerated = z.infer<typeof SmartNotesSchema>
