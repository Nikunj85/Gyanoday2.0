import { buildPrompt } from '@/lib/ai/promptUtils'
import { AiInsightSchema } from '@/lib/constants/insight_keys'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

import { settingsService } from '../settings-server-service'

export interface InsightVariables extends Record<string, string | undefined> {
  class_name?: string
  subject?: string
  chapter_name: string
  student_score?: string
  correct_answers?: string
  total_questions?: string
  chapter_avg_score?: string
  attempt_count?: string
  language: string
  student_name?: string
  quiz_data?: string
}

export const insightAiService = {
  async generateQuizInsight(
    userId: string,
    chapterId: string,
    score: number,
    totalQuestions: number,
    quizContext: Record<string, any>[] = []
  ) {
    const supabase = await createClient()

    // 1. Fetch User Details (Class, Language)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, language, class:classes(name)')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      throw new Error('Failed to fetch user data for insight')
    }

    // 2. Fetch Chapter Details (Subject, Title)
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .select('title, subject:subjects(name)')
      .eq('id', chapterId)
      .single()

    if (chapterError || !chapterData) {
      console.error('Error fetching chapter data:', chapterError)
      throw new Error('Failed to fetch chapter data for insight')
    }

    // 3. Fetch/Calculate Quiz Stats (Avg Score, Attempts)
    // We need the quiz ID first
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id')
      .eq('chapter_id', chapterId)
      .maybeSingle()

    let avgScore = 0
    let attemptsCount = 1 // Default to 1 (current attempt)

    if (quizData) {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('quiz_id', quizData.id)
        .eq('user_id', userId)

      if (attempts && attempts.length > 0) {
        attemptsCount = attempts.length
        const totalScore = attempts.reduce(
          (acc: any, curr: { score: any }) => acc + (curr.score || 0),
          0
        )
        avgScore = Math.round(totalScore / attempts.length)
      }
    }

    // Calculate current percentage
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    // --- Format Quiz Context ---
    let formattedQuizData = 'No specific question data provided.'
    if (quizContext && quizContext.length > 0) {
      formattedQuizData = quizContext
        .map(
          (q, idx) => `
            Q${idx + 1}: ${q.question}
            Student Answer: ${q.userAnswer}
            Correct Answer: ${q.correctAnswer}
            Result: ${q.isCorrect ? 'Correct' : 'Incorrect'}
            `
        )
        .join('\n')
    }

    // 4. Prepare Variables
    const variables: InsightVariables = {
      class_name: (userData.class as any)?.name || 'Standard',
      subject: (chapterData.subject as any)?.name || 'General',
      chapter_name: chapterData.title,
      student_score: `${percentage}%`,
      correct_answers: score.toString(),
      total_questions: totalQuestions.toString(),
      chapter_avg_score: `${avgScore}%`,
      attempt_count: attemptsCount.toString(),
      language: userData.language || 'English',
      student_name: userData.name || 'Student',
      quiz_data: formattedQuizData,
    }

    const promptKey = PromptKeys.PROMPT_QUIZ_RESULT_SUMMARY

    // 5. Get the prompt template from settings
    let promptTemplate = ''
    try {
      const settings = await settingsService.getSettingBasedOnKey(promptKey)
      if (settings?.value) {
        promptTemplate = settings.value
      } else {
        throw new Error('[insight-ai-service] Setting not found in database for key: ' + promptKey)
      }
    } catch (e: any) {
      throw new Error('[insight-ai-service] Error fetching setting, using fallback', e)
    }

    // 6. Build the full prompt with variables
    const prompt = buildPrompt(promptKey, promptTemplate, variables)

    // 7. Call OpenAI with the structured schema
    const insight = await openAIService.generateTextResultWithSchema(
      prompt,
      AiInsightSchema,
      'quiz_insight'
    )

    return {
      ...insight,
      variableContext: variables, // Return context if needed for saving
      derivedStats: {
        avg_score: avgScore,
        attempts: attemptsCount,
      },
    }
  },
}
