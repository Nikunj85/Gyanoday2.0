import { QuizAttempt } from '@/types/quiz'

import { chapterService } from './chapter-service'
import { quizAttemptsService } from './quiz-attempts-service'
import { quizService } from './quiz-service'
import { userProgressService } from './user-progress-service'

export interface StudentPerformanceMetrics {
  averageScore: number
  chapterCompletion: number
  passRate: number
  consistency: number
  timeEfficiency: number
  overallScore: number
  performanceLabel: 'Excellent' | 'Very Good' | 'Good' | 'Improving' | 'Needs Attention'
}

export const studentPerformanceService = {
  async calculatePerformance(
    userId: string,
    classId: string,
    client?: any
  ): Promise<StudentPerformanceMetrics> {
    try {
      // 1. Fetch all data in parallel
      const [chaptersResult, allAttempts, allProgress] = await Promise.all([
        chapterService.getChapters({ classId, pageSize: 1000, client }), // Get all chapters
        quizAttemptsService.getAllUserQuizAttempts(userId, client),
        userProgressService.getAllUserProgress(userId, client),
      ])

      const chapters = chaptersResult.data
      const totalChapters = chaptersResult.total || chapters.length

      if (totalChapters === 0) {
        return getEmptyMetrics()
      }

      // 2. Get Quizzes Metadata
      const chapterIds = chapters.map((c) => c.id)
      const quizzes = await quizService.getQuizzesByChapterIds(chapterIds, client)

      // Map quiz_id to pass_threshold and num_questions
      const quizMap = new Map<
        string,
        { passThreshold: number; numQuestions: number; chapterId: string }
      >()
      quizzes.forEach((q: any) => {
        quizMap.set(q.id, {
          passThreshold: q.pass_threshold || 0.6,
          numQuestions: q.num_questions || 10,
          chapterId: q.chapter_id,
        })
      })

      // 3. Calculate Metrics

      // A. Chapter Completion (25%)
      // Filter progress to only include chapters from the current class
      const classChapterIds = new Set(chapterIds)
      const completedChaptersCount = allProgress.filter(
        (p) => classChapterIds.has(p.chapter_id) && p.is_completed
      ).length
      const chapterCompletion = Math.min(100, (completedChaptersCount / totalChapters) * 100)

      // B. Average Score (40%) & C. Pass Rate (15%)
      let totalScorePercentage = 0
      let passedAttempts = 0
      // Filter attempts to only include quizzes from the current class
      const classAttempts = (allAttempts as unknown as QuizAttempt[]).filter((a) =>
        quizMap.has(a.quiz_id)
      )
      const totalAttempts = classAttempts.length
      let validTimeAttempts = 0
      let totalTimeEfficiency = 0

      // For Consistency: Unique chapters attempted
      const attemptedChapters = new Set<string>()

      classAttempts.forEach((attempt) => {
        const quizMeta = quizMap.get(attempt.quiz_id)
        if (!quizMeta) return

        // Score %
        const score = attempt.score
        const totalQ = attempt.total_questions || quizMeta.numQuestions
        const percentage = totalQ > 0 ? score / totalQ : 0

        totalScorePercentage += percentage * 100

        // Pass Rate
        if (percentage >= quizMeta.passThreshold) {
          passedAttempts++
        }

        // Consistency (Chapter tracking)
        if (quizMeta.chapterId) {
          attemptedChapters.add(quizMeta.chapterId)
        }

        // Time Efficiency (10%)
        if (attempt.started_at && attempt.submitted_at) {
          const start = new Date(attempt.started_at).getTime()
          const end = new Date(attempt.submitted_at).getTime()
          const durationSeconds = (end - start) / 1000

          if (durationSeconds > 0) {
            // Benchmark: 60 seconds per question
            const expectedSeconds = totalQ * 60
            // Efficiency: Higher is better.
            // If duration <= expected, 100%.
            // If duration > expected, decay.
            let efficiency = 0
            if (durationSeconds <= expectedSeconds) {
              efficiency = 100
            } else {
              // Linear decay: if takes double time, 50% efficiency
              efficiency = (expectedSeconds / durationSeconds) * 100
            }
            totalTimeEfficiency += efficiency
            validTimeAttempts++
          }
        }
      })

      const averageScore = totalAttempts > 0 ? totalScorePercentage / totalAttempts : 0
      const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0

      // D. Consistency (10%)
      // Defined as: % of chapters with at least one attempt, relative to total chapters with quizzes.
      // But we fetched all chapters. Let's use totalChapters as denominator.
      const consistency = totalChapters > 0 ? (attemptedChapters.size / totalChapters) * 100 : 0

      // E. Time Efficiency (10%)
      // If no time data, we assume neutral/good efficiency (100%) or ignore?
      // score.md says "Ensure safe handling of... Null timestamps".
      // Let's assume 100% if no data to not penalize, or 0?
      // If student hasn't taken any quiz, efficiency should probably be 0.
      // If student took quizzes but no timestamps (old data?), maybe 50?
      // But usually timestamps are present.
      // If totalAttempts is 0, everything is 0.
      // If totalAttempts > 0 but validTimeAttempts is 0, let's say 100 (benefit of doubt).
      const timeEfficiency =
        totalAttempts > 0
          ? validTimeAttempts > 0
            ? totalTimeEfficiency / validTimeAttempts
            : 100
          : 0

      // 4. Weighted Formula
      // Average Score → 40%
      // Chapter Completion → 25%
      // Pass Rate → 15%
      // Consistency → 10%
      // Time Efficiency → 10%

      let overallScore =
        averageScore * 0.4 +
        chapterCompletion * 0.25 +
        passRate * 0.15 +
        consistency * 0.1 +
        timeEfficiency * 0.1

      // Clamp 0-100
      overallScore = Math.max(0, Math.min(100, overallScore))

      return {
        averageScore,
        chapterCompletion,
        passRate,
        consistency,
        timeEfficiency,
        overallScore,
        performanceLabel: getPerformanceLabel(overallScore),
      }
    } catch (error) {
      console.error('Error calculating student performance:', error)
      return getEmptyMetrics()
    }
  },
}

function getEmptyMetrics(): StudentPerformanceMetrics {
  return {
    averageScore: 0,
    chapterCompletion: 0,
    passRate: 0,
    consistency: 0,
    timeEfficiency: 0,
    overallScore: 0,
    performanceLabel: 'Needs Attention',
  }
}

function getPerformanceLabel(
  score: number
): 'Excellent' | 'Very Good' | 'Good' | 'Improving' | 'Needs Attention' {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Very Good'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Improving'
  return 'Needs Attention'
}
