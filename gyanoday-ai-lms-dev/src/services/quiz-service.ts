import { createClient } from '@/lib/supabase/client'
import { QuizAttemptStats } from '@/types/quiz'

const supabase = createClient()

export const quizService = {
  async getOrCreateQuiz(
    chapterId: string,
    userId: string,
    numQuestions: number,
    title?: string,
    topic?: string
  ) {
    // 1. Check if a quiz already exists for this exact chapter+user+topic
    // combination. Filtering by topic matters: without it, a topic-quiz and
    // the full-chapter quiz would collide onto the same row (and once more
    // than one existed, .single() would start throwing "multiple rows").
    let query = supabase
      .from('quizzes')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('user_id', userId)
    query = topic ? query.eq('topic', topic) : query.is('topic', null)

    const { data: existingQuiz, error: fetchError } = await query.maybeSingle()

    if (fetchError) {
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
          title: title || (topic ? `${topic} — Practice Quiz` : 'Chapter Quiz'),
          num_questions: numQuestions,
          pass_threshold: 0.6,
          topic: topic || null,
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
    chapterTitle?: string,
    topic?: string
  ) {
    try {
      // First get the quiz ID (creates it if missing)
      const quizId = await this.getOrCreateQuiz(
        chapterId,
        userId,
        stats.totalQuestions,
        chapterTitle,
        topic
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

  async getChapterPerformance(chapterId: string, userId: string) {
    try {
      const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('chapter_id', chapterId)

      if (quizError) throw quizError
      const quizIds = (quizzes || []).map((quiz: { id: string }) => quiz.id)

      if (!quizIds.length) {
        return { attempts: 0, averagePct: 0, bestPct: 0, latestPct: 0 }
      }

      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions, created_at')
        .in('quiz_id', quizIds)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (attemptsError) throw attemptsError
      if (!attempts?.length) {
        return { attempts: 0, averagePct: 0, bestPct: 0, latestPct: 0 }
      }

      const percentages = attempts.map((attempt: { score: number; total_questions: number }) =>
        attempt.total_questions > 0 ? (attempt.score / attempt.total_questions) * 100 : 0
      )

      return {
        attempts: percentages.length,
        averagePct: Math.round(
          percentages.reduce((sum: number, pct: number) => sum + pct, 0) / percentages.length
        ),
        bestPct: Math.round(Math.max(...percentages)),
        latestPct: Math.round(percentages[0]),
      }
    } catch (error) {
      console.error('Error fetching chapter performance:', error)
      return { attempts: 0, averagePct: 0, bestPct: 0, latestPct: 0 }
    }
  },

  async getUserQuizStats(chapterId: string, userId: string, topic?: string) {
    try {
      // 1. Get the quiz ID for this chapter (+topic, if given)
      let query = supabase.from('quizzes').select('id').eq('chapter_id', chapterId)
      query = topic ? query.eq('topic', topic) : query.is('topic', null)
      const { data: quiz, error: quizError } = await query.maybeSingle()

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
