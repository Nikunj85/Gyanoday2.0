import { z } from 'zod'

export const McqOptionSchema = z.enum(['A', 'B', 'C', 'D'])

export const McqQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
  answer_type: z.enum(['single', 'multiple']),
  correct_options: z.array(McqOptionSchema).min(1),
  explanation: z.string(),
})

export const McqSchema = z.object({
  metadata: z.object({
    language: z.string(),
    difficulty: z.string(),
    total_questions: z.number().min(1).max(50),
    student_profile_summary: z.string(),
  }),
  questions: z.array(McqQuestionSchema).min(1),
})

export type McqResponse = z.infer<typeof McqSchema>
