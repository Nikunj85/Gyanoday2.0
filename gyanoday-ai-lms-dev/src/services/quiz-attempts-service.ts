import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export const quizAttemptsService = {
  async getChapterQuizAttempts(userId: string, chapterIds: string[]) {
    if (!chapterIds.length) return {}

    try {
      // 1. Get quizzes for these chapters
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('id, chapter_id')
        .in('chapter_id', chapterIds)

      if (quizzesError) throw quizzesError

      const quizzes = quizzesData as { id: string; chapter_id: string }[] | null
      if (!quizzes?.length) return {}

      // 2. Get attempts for these quizzes
      const quizIds = quizzes.map((q) => q.id)
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .in('quiz_id', quizIds)
        .eq('user_id', userId)

      if (attemptsError) throw attemptsError

      const attempts = attemptsData as { quiz_id: string }[] | null

      // 3. Aggregate attempts per chapter
      const attemptsMap: Record<string, number> = {}
      const quizChapterMap = new Map<string, string>()

      quizzes.forEach((q) => {
        quizChapterMap.set(q.id, q.chapter_id)
      })

      attempts?.forEach((attempt) => {
        const chapterId = quizChapterMap.get(attempt.quiz_id)
        if (chapterId) {
          attemptsMap[chapterId] = (attemptsMap[chapterId] || 0) + 1
        }
      })

      return attemptsMap
    } catch (error) {
      console.error('Error fetching chapter quiz attempts:', error)
      return {}
    }
  },
  async getAllUserQuizAttempts(userId: string, client?: any) {
    try {
      const currentClient = client || supabase
      const { data, error } = await currentClient
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as any[]) || []
    } catch (error) {
      console.error('Error fetching all user quiz attempts:', error)
      return []
    }
  },
}
