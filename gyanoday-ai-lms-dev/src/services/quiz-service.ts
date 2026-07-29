import { createClient } from '@/lib/supabase/client'
import { QuizAttemptStats } from '@/types/quiz'

const supabase = createClient()

export const quizService = {
  async getOrCreateQuiz(chapterId: string, userId: string, numQuestions: number, title?: string) {
    // 1. Check if quiz exists for this chapter
    const { data: existingQuiz, error: fetchError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('chapter_id', chapterId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "No rows found"
      throw fetchError
    }

    if (existingQuiz) {
      return existingQuiz.id
    }

    // 2. Create quiz if it doesn't exist
    const { data: newQuiz, error: insertError } = await supabase
      .from('quizzes')
      .insert([
        {
          chapter_id: chapterId,
          user_id: userId,
          title: title || 'Chapter Quiz',
          num_questions: numQuestions,
          pass_threshold: 0.6,
        },
      ])
      .select('id')
      .single()

    if (insertError) throw insertError
    return newQuiz.id
  },

  async saveQuizAttempt(
    chapterId: string,
    userId: string,
    stats: QuizAttemptStats,
    chapterTitle?: string
  ) {
    try {
      // First get the quiz ID (creates it if missing)
      const quizId = await this.getOrCreateQuiz(
        chapterId,
        userId,
        stats.totalQuestions,
        chapterTitle
      )

      // Save the attempt
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([
          {
            quiz_id: quizId,
            user_id: userId,
            score: stats.score,
            correct_count: stats.correctCount,
            total_questions: stats.totalQuestions,
            started_at: stats.startedAt,
            submitted_at: stats.submittedAt,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving quiz attempt:', error)
      throw error
    }
  },

  async getUserQuizStats(chapterId: string, userId: string) {
    try {
      // 1. Get the quiz ID for this chapter
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('chapter_id', chapterId)
        .maybeSingle()

      if (quizError) throw quizError
      if (!quiz) return { attempts: 0, avgScore: 0 }

      // 2. Get all attempts for this quiz and user
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('quiz_id', quiz.id)
        .eq('user_id', userId)

      if (attemptsError) throw attemptsError
      if (!attempts || attempts.length === 0) return { attempts: 0, avgScore: 0 }

      const totalScore = attempts.reduce(
        (acc: any, curr: { score: any }) => acc + (curr.score || 0),
        0
      )
      const avgScore = Math.round(totalScore / attempts.length)

      return {
        attempts: attempts.length,
        avgScore,
      }
    } catch (error) {
      console.error('Error fetching user quiz stats:', error)
      return { attempts: 0, avgScore: 0 }
    }
  },
  async getQuizzesByChapterIds(chapterIds: string[], client?: any) {
    if (!chapterIds.length) return []

    const currentClient = client || supabase
    const { data, error } = await currentClient
      .from('quizzes')
      .select('id, chapter_id, pass_threshold, num_questions')
      .in('chapter_id', chapterIds)

    if (error) throw error
    return data || []
  },
}
