'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { getWeeklyStreak } from '@/app/actions/streak-actions'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { chapterService } from '@/services/chapter-service'
import { quizAttemptsService } from '@/services/quiz-attempts-service'
import { subjectService } from '@/services/subject-service'
import { useCourseProgressStore } from '@/store/course-progress-store'
import { useUserStore } from '@/store/user-store'
import { QuizAttempt } from '@/types/quiz'

import { CourseProgressChart } from '../components/CourseProgressChart'
import { DashboardHeader } from '../components/DashboardHeader'
import { OverallAiSummary } from '../components/OverallAiSummary'
import { QuizProgress } from '../components/QuizProgress'
import { WeeklyStreak } from '../components/WeeklyStreak'

export default function DashboardPage() {
  const user = useUserStore((state) => state.user)
  const isUserLoading = useUserStore((state) => state.isLoading)
  const setProgressStats = useCourseProgressStore((state) => state.setStats)

  // Logic to determine if no data should be shown
  // We check if total chapters across all subjects is 0 or if score_summary is null
  const isNoData = !user?.score_summary || Object.keys(user.score_summary).length === 0

  // Fetch subjects for user's class
  const { data: subjectsData, isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['subjects', user?.class_id],
    queryFn: () => subjectService.getSubjects({ classFilter: user?.class_id, pageSize: 100 }),
    enabled: !!user?.class_id,
  })

  // Fetch progress
  const { data: progressMap, isLoading: isProgressMapLoading } = useQuery({
    queryKey: ['subject-progress', user?.id, user?.class_id],
    queryFn: async () => {
      const subjectIds = (subjectsData?.data || []).map((s) => s.id)
      if (!subjectIds.length || !user?.id) return {}
      return await chapterService.getSubjectProgress(user.id, subjectIds, user.class_id)
    },
    enabled: !!user?.id && !!subjectsData?.data?.length,
  })

  const courseProgressData = useMemo(() => {
    if (!subjectsData?.data || !progressMap) return []
    return subjectsData.data.map((subject) => {
      const progress = progressMap[subject.id] || { total: 0, completed: 0 }
      return {
        name: subject.name,
        total: progress.total,
        completed: progress.completed,
      }
    })
  }, [subjectsData, progressMap])

  // Sync course progress with global store so DashboardHeader can display the correct percentage
  useEffect(() => {
    if (courseProgressData.length > 0) {
      const total = courseProgressData.reduce((acc, curr) => acc + curr.total, 0)
      const completed = courseProgressData.reduce((acc, curr) => acc + curr.completed, 0)
      const incomplete = total - completed

      setProgressStats({
        totalChapters: total,
        completedChapters: completed,
        incompleteChapters: incomplete,
        averageProgress: 0, // Header gets score from useUserStore separately
      })
    }
  }, [courseProgressData, setProgressStats])

  // Fetch all quiz attempts for user
  const { data: allAttempts, isLoading: isAllAttemptsLoading } = useQuery({
    queryKey: ['all-quiz-attempts', user?.id],
    queryFn: () => quizAttemptsService.getAllUserQuizAttempts(user!.id),
    enabled: !!user?.id,
  })

  const quizProgressData = useMemo(() => {
    const now = new Date()
    const currentDay = now.getDay() // 0-6 (Sun-Sat)

    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - currentDay)
    currentWeekStart.setHours(0, 0, 0, 0)

    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
    currentWeekEnd.setHours(23, 59, 59, 999)

    const lastWeekStart = new Date(currentWeekStart)
    lastWeekStart.setDate(currentWeekStart.getDate() - 7)

    const lastWeekEnd = new Date(lastWeekStart)
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
    lastWeekEnd.setHours(23, 59, 59, 999)

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const data = days.map((day) => ({ name: day, current: 0, last: 0 }))

    if (!allAttempts?.length) return data

    allAttempts.forEach((attempt: QuizAttempt) => {
      if (!attempt.created_at) return
      const attemptDate = new Date(attempt.created_at)

      if (attemptDate >= currentWeekStart && attemptDate <= currentWeekEnd) {
        const dayIndex = attemptDate.getDay()
        data[dayIndex].current += 1
      } else if (attemptDate >= lastWeekStart && attemptDate <= lastWeekEnd) {
        const dayIndex = attemptDate.getDay()
        data[dayIndex].last += 1
      }
    })

    return data
  }, [allAttempts])

  // Fetch Weekly Streak Data
  const { data: streakResponse, isLoading: isStreakLoading } = useQuery({
    queryKey: ['weekly-streak', user?.id],
    queryFn: () => getWeeklyStreak(user!.id),
    enabled: !!user?.id,
  })

  const streakData = streakResponse?.success ? streakResponse.data : undefined
  const streakRules = streakResponse?.success ? streakResponse.rules : undefined

  // Unified loading state for all dashboard components to prevent staggered resolving
  const isDashboardLoading =
    isUserLoading || isSubjectsLoading || isAllAttemptsLoading || isStreakLoading

  return (
    <div className="dark:bg-neutral-950 min-h-screen pb-20 overflow-x-hidden">
      {/* Header Section */}
      <MotionWrapper animation="fadeInDown" duration={1}>
        <DashboardHeader />
      </MotionWrapper>

      <WeeklyStreak data={streakData} rules={streakRules} isLoading={isDashboardLoading} />

      {/* Charts Section */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CourseProgressChart
            isNoData={isNoData}
            data={courseProgressData}
            isLoading={isDashboardLoading}
          />
          <QuizProgress
            isNoData={isNoData}
            data={quizProgressData}
            isLoading={isDashboardLoading}
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-8">
        <OverallAiSummary />
      </div>
    </div>
  )
}
