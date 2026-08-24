import { buildPrompt } from '@/lib/ai/promptUtils'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { AIInsight } from '@/types'
import { ScoreSummary } from '@/types/users'

import { settingsService } from '../settings-server-service'

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

      const prompt = buildPrompt(promptType, setting.value, {
        language,
        student_name: studentName,
        insight_data: insightDataString,
      })

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
  ): Promise<{ summary: string }> {
    try {
      const promptType = PromptKeys.PROMPT_PARENT_PROGRESS_SUMMARY
      const setting = await settingsService.getSettingBasedOnKey(promptType)

      if (!setting) {
        console.error(`[UserSummaryAiService] Prompt setting not found: ${promptType}`)
        throw new Error(`Summary configuration error: Prompt setting not found.`)
      }

      const prompt = buildPrompt(promptType, setting.value, {
        language,
        student_name: studentName,
        parent_name: parentName || 'there',
        performance_data: JSON.stringify(performanceData),
      })

      const aiResponse = await openAIService.generateResult(prompt)

      try {
        let cleanResponse = aiResponse.replace(/```json\n?|```/g, '').trim()
        if (cleanResponse.startsWith('"') && cleanResponse.endsWith('"')) {
          cleanResponse = cleanResponse.substring(1, cleanResponse.length - 1).trim()
        }
        const parsedResponse = JSON.parse(cleanResponse)
        return { summary: parsedResponse.summary || cleanResponse }
      } catch {
        return { summary: aiResponse }
      }
    } catch (error) {
      console.error(`[UserSummaryAiService] Error in generateParentSummary:`, error)
      throw error
    }
  },
}
