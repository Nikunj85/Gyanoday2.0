import { z } from 'zod'

export const AiInsightSchema = z.object({
  insight_text: z.string(),
  weak_areas: z.array(z.string()),
})

export type AiInsightResponse = z.infer<typeof AiInsightSchema>
