import { languageEnforcement, languageLabel } from '@/lib/ai/language'
import { buildPrompt } from '@/lib/ai/promptUtils'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { AIInsight } from '@/types'
import { ScoreSummary } from '@/types/users'

import { settingsService } from '../settings-server-service'

/**
 * Structured parent report (rendered as a card, not as a letter).
 */
export interface ParentSummaryContent {
  headline: string
  highlights: string[]
  focusAreas: string[]
  homeTip: string
}

/**
 * Used only when PROMPT_PARENT_PROGRESS_SUMMARY has not been inserted into the
 * `settings` table. The settings row, when present, wins — but the OUTPUT FORMAT
 * below is always appended in code so the report can never turn back into a letter.
 */
const DEFAULT_PARENT_SUMMARY_PROMPT =
  'You are preparing a short progress report card for {{parent_name}}, the parent of {{student_name}}. ' +
  'Write in {{language}}. Base it ONLY on this performance data: {{performance_data}}. ' +
  'Be factual, warm and specific; never invent numbers, subjects or events that are not in the data.'

const PARENT_SUMMARY_FORMAT = `

OUTPUT FORMAT (STRICT — overrides any earlier instruction about tone, letters or length):
This is a report card, NOT a letter or email. Do NOT write a subject line, greeting ("Dear ..."), sign-off ("Warm regards"), or placeholders such as [Your Name].
Return ONLY valid JSON (no markdown fences, no commentary) with exactly these keys:
{
  "headline": "ONE sentence, max 18 words, that gives the overall picture of how the child is doing this week",
  "highlights": ["2-3 short bullets of what is going well, each max 22 words, each using a real number or fact from the data"],
  "focus_areas": ["1-3 short bullets of what needs attention, each max 22 words; name the weak concepts exactly as given in the data, in their original script"],
  "home_tip": "ONE practical, specific sentence (max 25 words) about how the parent can help at home"
}
If there is little or no activity yet, use an empty "highlights" array, say so kindly in "headline", and make the "home_tip" a gentle first step.`

function asStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? v : ''))
    .map((v) => v.replace(/^\s*(?:[-*•●▪◦–—]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
    .slice(0, max)
}

/** Parses the model output; degrades gracefully to bullets if it was not valid JSON. */
function parseParentSummary(raw: string): ParentSummaryContent {
  const text = (raw || '').replace(/```json\n?|```/gi, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1))
      const content: ParentSummaryContent = {
        headline: typeof parsed.headline === 'string' ? parsed.headline.trim() : '',
        highlights: asStringArray(parsed.highlights, 3),
        focusAreas: asStringArray(parsed.focus_areas ?? parsed.focusAreas, 3),
        homeTip: typeof parsed.home_tip === 'string' ? parsed.home_tip.trim() : '',
      }
      if (content.headline || content.highlights.length || content.focusAreas.length) return content
    } catch {
      // fall through to plain-text fallback
    }
  }

  // Fallback: drop letter boilerplate and show the remaining sentences as bullets.
  const sentences = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !/^(subject|dear|warm regards|best regards|regards|sincerely|\[your name\])/i.test(l)
    )
    .join(' ')
    .match(/[^.!?।]+[.!?।]+/g)
    ?.map((x) => x.trim()) || []

  return {
    headline: sentences[0] || '',
    highlights: sentences.slice(1, 4),
    focusAreas: [],
    homeTip: '',
  }
}

export const userSummaryAiService = {
  /**
   * Generates a student overall performance summary based on their AI insights history.
   *
   * @param insights Array of AIInsight objects for the student
   * @param language Language for the summary
   * @returns A generated summary object
   */
  async generateOverallSummary(
    insights: any[],
    language: string,
    studentName: string
  ): Promise<{ summary: string }> {
    try {
      if (!insights || insights.length === 0) {
        return {
          summary: 'Not enough data to generate a summary yet. Keep taking quizzes!',
        }
      }

      // 1. Format insight data for the prompt
      const insightData = insights.map((insight: any) => {
        const score = insight.score_context?.quiz_score || 0
        const total = insight.score_context?.total_questions || 10
        const percentage = (score / total) * 100
        // Use 40% as passing criteria
        const status = percentage >= 40 ? 'Pass' : 'Not Pass'

        return {
          chapter: insight.chapter?.title || 'Unknown Chapter',
          insight: insight.insight_text,
          weak_areas: insight.weak_areas,
          score_context: {
            ...insight.score_context,
            status, // Explicitly adding status for AI to use "Pass/Not Pass" language
          },
          date: insight.created_at,
        }
      })

      // 2. Fetch prompt setting
      const promptType = PromptKeys.PROMPT_STUDENT_OVERALL_SUMMARY
      const setting = await settingsService.getSettingBasedOnKey(promptType)

      if (!setting) {
        console.error(`[UserSummaryAiService] Prompt setting not found: ${promptType}`)
        throw new Error(`Summary configuration error: Prompt setting not found.`)
      }

      // 3. Build prompt and generate summary
      const insightDataString = JSON.stringify(insightData)

      const prompt =
        buildPrompt(promptType, setting.value, {
          language: languageLabel(language),
          student_name: studentName,
          insight_data: insightDataString,
        }) + languageEnforcement(languageLabel(language), 'text')

      const aiResponse = await openAIService.generateResult(prompt)

      try {
        // Clean the response from markdown code blocks and extra surrounding quotes
        let cleanResponse = aiResponse.replace(/```json\n?|```/g, '').trim()

        // Remove leading/trailing quotes if the AI wrapped the entire JSON in quotes
        if (cleanResponse.startsWith('"') && cleanResponse.endsWith('"')) {
          cleanResponse = cleanResponse.substring(1, cleanResponse.length - 1).trim()
        }

        // Try to parse the AI response as JSON
        const parsedResponse = JSON.parse(cleanResponse)
        return {
          summary: parsedResponse.summary || cleanResponse,
        }
      } catch (e) {
        // Fallback if AI doesn't return valid JSON
        return {
          summary: aiResponse,
        }
      }
    } catch (error) {
      console.error(`[UserSummaryAiService] Error in generateOverallSummary:`, error)
      throw error
    }
  },

  /**
   * Generates a professional, parent-facing progress summary — same
   * category of underlying data as the student summary above (scores,
   * consistency, chapter completion), but written in the tone a parent
   * wants: concrete study-time/consistency and concept-mastery language,
   * not celebratory second-person coaching aimed at the student.
   */
  async generateParentSummary(
    performanceData: Record<string, unknown>,
    language: string,
    studentName: string,
    parentName?: string
  ): Promise<ParentSummaryContent> {
    try {
      const promptType = PromptKeys.PROMPT_PARENT_PROGRESS_SUMMARY
      const label = languageLabel(language)

      let template = DEFAULT_PARENT_SUMMARY_PROMPT
      try {
        const setting = await settingsService.getSettingBasedOnKey(promptType)
        if (setting?.value) template = setting.value
      } catch {
        console.warn(
          `[UserSummaryAiService] ${promptType} not found in settings; using built-in default prompt.`
        )
      }

      const prompt =
        buildPrompt(promptType, template, {
          language: label,
          student_name: studentName,
          parent_name: parentName || 'the parent',
          performance_data: JSON.stringify(performanceData),
        }) +
        PARENT_SUMMARY_FORMAT +
        languageEnforcement(label, 'json-generic')

      const aiResponse = await openAIService.generateResult(prompt)
      return parseParentSummary(aiResponse)
    } catch (error) {
      console.error(`[UserSummaryAiService] Error in generateParentSummary:`, error)
      throw error
    }
  },
}
