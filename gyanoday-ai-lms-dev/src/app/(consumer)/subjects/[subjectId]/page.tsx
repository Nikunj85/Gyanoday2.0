'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'
import { chapterService } from '@/services/chapter-service'
import { quizAttemptsService } from '@/services/quiz-attempts-service'
import { subjectService } from '@/services/subject-service'
import { userProgressService } from '@/services/user-progress-service'
import { useChapterStore } from '@/store/chapter-store'
import { useQuizStore } from '@/store/use-quiz-store'
import { useUserStore } from '@/store/user-store'

import { ChapterSidebar } from '../../components/ChapterSidebar'
import { PDFViewer } from '../../components/PDFViewer'
import { SubjectHeader } from '../../components/SubjectHeader'

export default function SubjectDetailPage() {
  const { subjectId } = useParams() as { subjectId: string }
  const router = useRouter()
  const { user } = useUserStore()
  const queryClient = useQueryClient()
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const { setActiveChapter: setStoreActiveChapter, setActiveSubjectColor } = useChapterStore()
  const { initQuiz } = useQuizStore()

  // Fetch Subject Details
  const { data: subject, isLoading: isSubjectLoading } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => subjectService.getById(subjectId),
  })

  // Fetch Chapters filtered by user's class and visibility
  const { data: chaptersData, isLoading: isChaptersLoading } = useQuery({
    queryKey: ['chapters', subjectId, user?.class_id],
    queryFn: () =>
      chapterService.getChapters({
        subjectId,
        classId: user?.class_id || null,
        pageSize: 1000,
        isVisibleFilter: true,
      }),
    enabled: !!subjectId,
  })

  // Fetch User Progress
  const { data: progressData } = useQuery({
    queryKey: ['user-progress', user?.id, subjectId, user?.class_id],
    queryFn: () =>
      userProgressService.getProgress(
        user?.id || '',
        (chaptersData?.data || []).map((c) => c.id)
      ),
    enabled: !!user?.id && !!chaptersData?.data?.length,
  })

  // Fetch Test Attempts
  const { data: attemptsData } = useQuery({
    queryKey: ['chapter-attempts', user?.id, subjectId],
    queryFn: async () => {
      const chapterIds = (chaptersData?.data || []).map((c) => c.id)
      return await quizAttemptsService.getChapterQuizAttempts(user?.id || '', chapterIds)
    },
    enabled: !!user?.id && !!chaptersData?.data?.length,
  })

  const chapters = chaptersData?.data || []
  const completedChapterIds =
    progressData?.filter((p) => p.is_completed).map((p) => p.chapter_id) || []

  // and we want to avoid complex type gymnastics for now.
  const allChapterProgress: any[] = chapters.map((c) => {
    const existing = progressData?.find((p) => p.chapter_id === c.id)
    const testCount = attemptsData?.[c.id] || 0

    if (existing) {
      return {
        ...existing,
        test_count: testCount,
      }
    }

    return {
      id: `temp-${c.id}`,
      user_id: user?.id || '',
      chapter_id: c.id,
      is_completed: false,
      test_count: testCount,
    }
  })

  // Auto-select first chapter
  useEffect(() => {
    if (chapters.length > 0 && !activeChapterId) {
      // Find first incomplete chapter, or just the first one
      const firstIncomplete = chapters.find((c) => !completedChapterIds.includes(c.id))
      setActiveChapterId(firstIncomplete?.id || chapters[0].id)
    }
  }, [chapters, completedChapterIds, activeChapterId])

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || null
  const themeColor = subject?.color_code || '#B188C0'

  // Sync active chapter and color with store for AIChatBot
  useEffect(() => {
    setStoreActiveChapter(activeChapter)
    setActiveSubjectColor(themeColor)

    // Clear on unmount
    return () => {
      setStoreActiveChapter(null)
      setActiveSubjectColor(null)
    }
  }, [activeChapter, themeColor, setStoreActiveChapter, setActiveSubjectColor])

  // Mutation for completion
  const toggleCompletionMutation = useMutation({
    mutationFn: ({ chapterId, completed }: { chapterId: string; completed: boolean }) =>
      userProgressService.toggleCompletion(user?.id || '', chapterId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress', user?.id, subjectId] })
      queryClient.invalidateQueries({ queryKey: ['student-progress'] })
    },
  })

  const handleToggleCompletion = (chapterId: string) => {
    const isCurrentlyCompleted = completedChapterIds.includes(chapterId)
    toggleCompletionMutation.mutate({ chapterId, completed: !isCurrentlyCompleted })
  }

  // Redirect if subject not found
  useEffect(() => {
    if (!isSubjectLoading && !subject) {
      router.push('/student-dashboard')
    }
  }, [isSubjectLoading, subject, router])

  if (isSubjectLoading || isChaptersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-neutral-100 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <p className="mt-6 text-neutral-500 font-medium animate-pulse">
          Preparing your classroom...
        </p>
      </div>
    )
  }

  if (!subject) {
    return null // Redirection handled by useEffect
  }

  return (
    <main className="bg-background transition-colors duration-300 min-h-screen pb-20">
      <MotionWrapper animation="fadeInDown" duration={1.2}>
        <SubjectHeader
          subject={subject}
          completedChapters={completedChapterIds.length}
          totalChapters={chapters.length}
          activeChapterTitle={activeChapter?.title}
          activeChapterDescription={activeChapter?.description}
          isChapterCompleted={
            activeChapter ? completedChapterIds.includes(activeChapter.id) : false
          }
          themeColor={themeColor}
          onQuizClick={() => {
            if (activeChapter) {
              initQuiz({
                chapterId: activeChapter.id,
                isReviewMode: false,
              })
              router.push('/quiz')
            }
          }}
          onCompleteClick={() => activeChapter && handleToggleCompletion(activeChapter.id)}
        />
      </MotionWrapper>

      <div className="w-full px-6 md:px-12 lg:pl-0 lg:pr-12 xl:pr-20 mt-8">
        <MotionContainer
          className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-24"
          staggerChildren={0.2}
        >
          {/* Sidebar: Chapter List */}
          <MotionWrapper
            animation="fadeInRight"
            className="lg:w-[320px] xl:w-[400px] 2xl:w-[480px] shrink-0"
          >
            <ChapterSidebar
              chapters={chapters}
              activeChapterId={activeChapterId}
              completedChapterIds={completedChapterIds}
              chapterProgress={allChapterProgress}
              onChapterSelect={setActiveChapterId}
              themeColor={themeColor}
              onToggleCompletion={handleToggleCompletion}
            />
          </MotionWrapper>

          {/* Content Area: PDF Viewer */}
          <MotionWrapper animation="fadeInUp" className="flex-1 min-w-0">
            <PDFViewer
              chapter={activeChapter}
              themeColor={themeColor}
              hasChapters={chapters.length > 0}
            />
          </MotionWrapper>
        </MotionContainer>
      </div>
    </main>
  )
}
