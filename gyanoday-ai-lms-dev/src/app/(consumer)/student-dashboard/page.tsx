'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { chapterService } from '@/services/chapter-service'
import { subjectService } from '@/services/subject-service'
import { useCourseProgressStore } from '@/store/course-progress-store'
import { useUserStore } from '@/store/user-store'

import { DashboardHeader } from '../components/DashboardHeader'
import { OverallAiSummary } from '../components/OverallAiSummary'
import { SubjectsGrid } from '../components/SubjectsGrid'

export default function StudentDashboard() {
  const { t } = useTranslation()
  const { user, isLoading: isUserLoading, overallScore: storeScore } = useUserStore()
  const setProgressStats = useCourseProgressStore((state) => state.setStats)

  const { data: subjectsData, isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['student-subjects', user?.language, user?.class_id],
    queryFn: () =>
      subjectService.getSubjects({
        languageFilter: user?.language || 'en',
        classFilter: user?.class_id, // Add class filter
        statusFilter: true,
        pageSize: 100,
        isAdmin: false,
      }),
    enabled: !!user?.language && !!user?.class_id,
  })

  // Fetch Progress
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['student-progress', user?.id, user?.class_id, subjectsData?.data],
    queryFn: async () => {
      if (!user?.id || !subjectsData?.data || !user?.class_id) return {}
      const subjectIds = subjectsData.data.map((s) => s.id)
      return await chapterService.getSubjectProgress(user.id, subjectIds, user.class_id)
    },
    enabled: !!user?.id && !!subjectsData?.data?.length && !!user?.class_id,
  })

  // Calculate Overall Score (from chapters completed)
  const stats = progressData
    ? (() => {
        const values = Object.values(progressData)
        if (values.length === 0) return { total: 0, completed: 0, incomplete: 0, percentage: 0 }
        const completed = values.reduce((acc, curr) => acc + (curr.completed || 0), 0)
        const total = values.reduce((acc, curr) => acc + (curr.total || 0), 0)
        const incomplete = total - completed
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
        return { total, completed, incomplete, percentage }
      })()
    : { total: 0, completed: 0, incomplete: 0, percentage: 0 }

  // Use score from store (performance calculated from quiz scores) if available, otherwise fallback to chapter completion
  const overallScore = storeScore > 0 ? `${Math.round(storeScore)}%` : `${stats.percentage}%`

  // Sync with store
  useEffect(() => {
    if (progressData) {
      // Parse numeric value for stats store
      const numericScore =
        typeof overallScore === 'string'
          ? parseInt(overallScore.replace('%', '')) || 0
          : overallScore

      setProgressStats({
        totalChapters: stats.total,
        completedChapters: stats.completed,
        incompleteChapters: stats.incomplete,
        averageProgress: numericScore, // Use the unified overallScore
      })
    }
  }, [progressData, stats.total, stats.completed, stats.incomplete, overallScore, setProgressStats])

  const isOverallLoading = isUserLoading || isSubjectsLoading || isLoadingProgress

  const filteredSubjects =
    subjectsData?.data?.filter((subject) => {
      const subjectProgress = progressData?.[subject.id]
      return subjectProgress && subjectProgress.total > 0
    }) || []

  return (
    <div className="bg-background transition-colors duration-300 min-h-screen">
      {isOverallLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
          <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-wide animate-pulse">
            {t('common.student_dashboard.initializing')}
          </p>
        </div>
      ) : (
        <>
          <MotionWrapper animation="fadeInDown" duration={1.2}>
            <DashboardHeader />
          </MotionWrapper>

          {/* Subjects Grid */}
          <MotionWrapper animation="fadeInUp" delay={0.2}>
            <SubjectsGrid
              subjectsData={{ data: filteredSubjects }}
              isSubjectsLoading={isOverallLoading} // Pass the combined loading state
              progressData={progressData}
            />
          </MotionWrapper>
        </>
      )}
    </div>
  )
}
