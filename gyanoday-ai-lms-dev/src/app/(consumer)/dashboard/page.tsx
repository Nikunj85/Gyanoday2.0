'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { getStudentProgressOverview } from '@/app/actions/student-progress-actions'
import { getWeeklyStreak } from '@/app/actions/streak-actions'
import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { useCourseProgressStore } from '@/store/course-progress-store'
import { useQuizStore } from '@/store/use-quiz-store'
import { useUserStore } from '@/store/user-store'

import { CompactAiSummary } from '../components/CompactAiSummary'
import { DashboardHeader } from '../components/DashboardHeader'
import { LearningJourneyMap } from '../components/LearningJourneyMap'
import { StudyTimeChart } from '../components/StudyTimeChart'
import { SubjectsProgressList } from '../components/SubjectsProgressList'
import { WeakConceptIndicator } from '../components/WeakConceptIndicator'
import { WeeklyStreak } from '../components/WeeklyStreak'

export default function DashboardPage() {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const isUserLoading = useUserStore((state) => state.isLoading)
  const setProgressStats = useCourseProgressStore((state) => state.setStats)
  const initQuiz = useQuizStore((state) => state.initQuiz)

  // Everything the redesigned dashboard needs — subjects/chapter mastery
  // (for the progress list + Learning Journey Map + Weak Concept
  // Indicator), weak concepts ranked across the whole course, and weekly
  // study time — comes from one aggregated server action instead of
  // several separate client queries.
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['student-progress-overview', user?.id, user?.class_id],
    queryFn: () => getStudentProgressOverview(user!.id, user!.class_id || null),
    enabled: !!user?.id,
  })

  const subjects = overview?.subjects || []
  const weakConcepts = overview?.weakConcepts || []
  const studyTimeByDay = overview?.studyTimeByDay || []

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

  const handlePracticeTopic = (topic: string, chapterId?: string) => {
    if (!chapterId) return
    initQuiz({ chapterId, isReviewMode: false, topic })
    router.push('/quiz')
  }

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
        {/* Short AI summary */}
        <MotionWrapper animation="fadeInUp" delay={0.1}>
          <CompactAiSummary />
        </MotionWrapper>

        {/* Subjects progress + study time, side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MotionWrapper animation="fadeInUp" delay={0.15}>
            <SubjectsProgressList subjects={subjects} />
          </MotionWrapper>
          <MotionWrapper animation="fadeInUp" delay={0.2}>
            <StudyTimeChart data={studyTimeByDay} />
          </MotionWrapper>
        </div>

        {/* Strengths & weaknesses */}
        <MotionWrapper animation="fadeInUp" delay={0.25}>
          <WeakConceptIndicator
            subjects={subjects}
            weakConcepts={weakConcepts}
            onPracticeTopic={handlePracticeTopic}
          />
        </MotionWrapper>

        {/* Learning journey map */}
        <MotionWrapper animation="fadeInUp" delay={0.3}>
          <div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 mb-4">
              Your Learning Path
            </h3>
            <LearningJourneyMap subjects={subjects} />
          </div>
        </MotionWrapper>
      </div>
    </div>
  )
}
