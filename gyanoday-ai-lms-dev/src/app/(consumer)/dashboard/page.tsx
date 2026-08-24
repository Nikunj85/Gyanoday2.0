'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getStudentProgressOverview } from '@/app/actions/student-progress-actions'
import { getWeeklyStreak } from '@/app/actions/streak-actions'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { useCourseProgressStore } from '@/store/course-progress-store'
import { useUserStore } from '@/store/user-store'

import { MotivationQuote } from '../components/MotivationQuote'
import { DashboardHeader } from '../components/DashboardHeader'
import { StudyTimeChart } from '../components/StudyTimeChart'
import { SubjectsProgressList } from '../components/SubjectsProgressList'
import { WeeklyStreak } from '../components/WeeklyStreak'

export default function DashboardPage() {
  const user = useUserStore((state) => state.user)
  const isUserLoading = useUserStore((state) => state.isLoading)
  const setProgressStats = useCourseProgressStore((state) => state.setStats)

  // The dashboard receives subject progress, chapter mastery, revision topics
  // and weekly study time from one aggregated server action.
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['student-progress-overview', user?.id, user?.class_id],
    queryFn: () => getStudentProgressOverview(user!.id, user!.class_id || null),
    enabled: !!user?.id,
  })

  const subjects = overview?.subjects || []
  const studyTimeByDay = overview?.studyTimeByDay || []
  const studyTimeByWeek = overview?.studyTimeByWeek || []

  // Sync course progress with global store so DashboardHeader can display
  // the correct percentage.
  useEffect(() => {
    if (subjects.length > 0) {
      const total = subjects.reduce((acc, s) => acc + s.totalCount, 0)
      const completed = subjects.reduce((acc, s) => acc + s.completedCount, 0)

      setProgressStats({
        totalChapters: total,
        completedChapters: completed,
        incompleteChapters: total - completed,
        averageProgress: 0, // Header gets score from useUserStore separately
      })
    }
  }, [subjects, setProgressStats])

  // Fetch Weekly Streak Data
  const { data: streakResponse, isLoading: isStreakLoading } = useQuery({
    queryKey: ['weekly-streak', user?.id],
    queryFn: () => getWeeklyStreak(user!.id),
    enabled: !!user?.id,
  })

  const streakData = streakResponse?.success ? streakResponse.data : undefined
  const streakRules = streakResponse?.success ? streakResponse.rules : undefined

  const isDashboardLoading = isUserLoading || isOverviewLoading || isStreakLoading

  return (
    <div className="dark:bg-neutral-950 min-h-screen pb-20 overflow-x-hidden">
      {/* Header Section */}
      <MotionWrapper animation="fadeInDown" duration={1}>
        <DashboardHeader />
      </MotionWrapper>

      <WeeklyStreak
        data={streakData}
        rules={streakRules}
        isLoading={isDashboardLoading}
      />

      <div className="container mx-auto px-4 mt-8 space-y-8">
        {/* Daily AI motivation */}
        <MotionWrapper animation="fadeInUp" delay={0.1}>
          <MotivationQuote />
        </MotionWrapper>

        {/* One horizontal subject-tracking card: progress + strengths + weaknesses + revision topics */}
        <MotionWrapper animation="fadeInUp" delay={0.15}>
          <SubjectsProgressList subjects={subjects} />
        </MotionWrapper>

        {/* Weekly study time */}
        <MotionWrapper animation="fadeInUp" delay={0.2}>
          <StudyTimeChart data={studyTimeByDay} monthlyData={studyTimeByWeek} />
        </MotionWrapper>

      </div>
    </div>
  )
}
