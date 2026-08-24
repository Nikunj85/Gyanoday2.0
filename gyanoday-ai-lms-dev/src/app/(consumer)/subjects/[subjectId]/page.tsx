'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileText, Loader2, Sparkles, X, Brain } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { generateAndSaveSmartNotes } from '@/app/actions/smart-notes-actions'
import { getRecommendedTopics } from '@/app/actions/concept-actions'
import { SmartNotesRenderer } from '@/components/common/SmartNotesRenderer'
import { TopicQuizLauncher } from '@/components/common/TopicQuizLauncher'
import { Button } from '@/components/ui/button'
import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'
import { chapterService } from '@/services/chapter-service'
import { quizService } from '@/services/quiz-service'
import { quizAttemptsService } from '@/services/quiz-attempts-service'
import { subjectService } from '@/services/subject-service'
import { userProgressService } from '@/services/user-progress-service'
import { useChapterStore } from '@/store/chapter-store'
import { useQuizStore } from '@/store/use-quiz-store'
import { useUserStore } from '@/store/user-store'

import { ChapterSidebar } from '../../components/ChapterSidebar'
import { PDFViewer } from '../../components/PDFViewer'
import { SubjectHeader } from '../../components/SubjectHeader'
import { SmartSummaryDialog } from '../../components/SmartSummaryDialog'

export default function SubjectDetailPage() {
  const { subjectId } = useParams() as { subjectId: string }
  const router = useRouter()
  const { user } = useUserStore()
  const queryClient = useQueryClient()

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [contentView, setContentView] = useState<'pdf' | 'smart-notes'>('pdf')
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const { setActiveChapter: setStoreActiveChapter, setActiveSubjectColor } = useChapterStore()
  const { initQuiz } = useQuizStore()

  // Fetch Subject Details
  const { data: subject, isLoading: isSubjectLoading } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => subjectService.getById(subjectId),
  })

  // Fetch Chapters
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

  // Chapter-specific learning insights used by the Smart Summary modal.
  const { data: chapterPerformance } = useQuery({
    queryKey: ['chapter-performance', user?.id, activeChapterId],
    queryFn: () => quizService.getChapterPerformance(activeChapterId!, user!.id),
    enabled: !!user?.id && !!activeChapterId,
  })

  const { data: chapterWeakTopics = [] } = useQuery({
    queryKey: ['chapter-weak-topics', user?.id, activeChapterId],
    queryFn: () => getRecommendedTopics(user!.id, activeChapterId!),
    enabled: !!user?.id && !!activeChapterId,
  })

  const chapters = chaptersData?.data || []
  const completedChapterIds =
    progressData?.filter((p) => p.is_completed).map((p) => p.chapter_id) || []

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || null
  const themeColor = subject?.color_code || '#B188C0'

  // Keep the global chapter store (read by AIChatBot, among others) in
  // sync with whichever chapter is actually open. Without this, the
  // chatbot never sees an active chapter — it silently falls back to a
  // canned, non-AI response instead of the real Socratic tutor, no matter
  // which chapter page you're on.
  useEffect(() => {
    setStoreActiveChapter(activeChapter)
    setActiveSubjectColor(themeColor)

    // On unmount (navigating away from this subject entirely), clear the
    // global chapter context so nothing else accidentally treats a stale
    // chapter as "active".
    return () => {
      setStoreActiveChapter(null)
    }
  }, [activeChapter, themeColor, setStoreActiveChapter, setActiveSubjectColor])

  // Auto-select first chapter
  useEffect(() => {
    if (chapters.length > 0 && !activeChapterId) {
      const firstIncomplete = chapters.find((c) => !completedChapterIds.includes(c.id))
      setActiveChapterId(firstIncomplete?.id || chapters[0].id)
    }
  }, [chapters, completedChapterIds, activeChapterId])

  // Reset tab when active chapter changes
  useEffect(() => {
    setContentView('pdf')
    setIsSummaryOpen(false)
  }, [activeChapterId])

  // Trigger AI generation if smart_notes is missing. Uses the real
  // vector-store-backed generator (settings-driven prompt, validated
  // three-layer schema) via a server action — not a raw client fetch —
  // so it can't drift out of sync with how the chatbot/quiz generators
  // read chapter data (no more guessing at a `file_url` field that
  // doesn't exist on the chapters table; the action looks the chapter
  // up itself from `pdf_url`).
  const handleSmartNotesClick = async () => {
    setContentView('smart-notes')

    const hasNotes = !!activeChapter?.smart_notes?.core_layer

    if (!hasNotes && activeChapter?.id && !isGenerating) {
      try {
        setIsGenerating(true)
        await generateAndSaveSmartNotes(activeChapter.id)
        // Refetch chapters data so smart_notes is updated in state
        await queryClient.invalidateQueries({ queryKey: ['chapters', subjectId] })
      } catch (err) {
        console.error('Failed to auto-generate notes:', err)
      } finally {
        setIsGenerating(false)
      }
    }
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
          onSummaryClick={() => setIsSummaryOpen(true)} // Opens Smart Summary dialog
          chapterPerformance={chapterPerformance}
          weakTopics={chapterWeakTopics}
          onQuizClick={() => {
            if (activeChapter) {
              initQuiz({ chapterId: activeChapter.id, isReviewMode: false })
              router.push('/quiz')
            }
          }}
        />
      </MotionWrapper>

      {/* Main Container */}
      <div className="w-full px-6 md:px-12 lg:pl-0 lg:pr-12 xl:pr-20 mt-6">
        {/* Interactive Toolbar */}
        {activeChapter && (
          <MotionWrapper
            animation="fadeInUp"
            className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-neutral-100/60 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl backdrop-blur-sm"
          >
            <div className="shrink-0">
              <TopicQuizLauncher chapterId={activeChapter.id} userId={user?.id} />
            </div>

            <div className="flex w-full sm:w-auto items-center justify-end rounded-xl border border-neutral-200 dark:border-neutral-800 p-1 bg-white dark:bg-neutral-950 shadow-sm">
              <button
                onClick={() => setContentView('pdf')}
                className={`flex min-h-11 flex-1 sm:flex-none items-center justify-center gap-2 px-4 md:px-5 rounded-lg text-sm md:text-base font-extrabold transition-all whitespace-nowrap ${
                  contentView === 'pdf'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
                }`}
              >
                <FileText size={12} />
                Chapter PDF
              </button>
              <button
                onClick={handleSmartNotesClick}
                className={`flex min-h-11 flex-1 sm:flex-none items-center justify-center gap-2 px-4 md:px-5 rounded-lg text-xs md:text-base font-extrabold transition-all whitespace-nowrap ${
                  contentView === 'smart-notes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-indigo-600 dark:text-neutral-400'
                }`}
              >
                <Sparkles size={12} className="text-amber-300 fill-amber-300" />
                Active-Recall Smart Notes
              </button>
            </div>
          </MotionWrapper>
        )}

        {/* Content View */}
        <MotionContainer className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
          <MotionWrapper animation="fadeInRight" className="lg:w-[320px] xl:w-[380px] shrink-0">
            <ChapterSidebar
              chapters={chapters}
              activeChapterId={activeChapterId}
              completedChapterIds={completedChapterIds}
              chapterProgress={[]}
              onChapterSelect={setActiveChapterId}
              themeColor={themeColor}
            />
          </MotionWrapper>

          <MotionWrapper animation="fadeInUp" className="flex-1 min-w-0">
            {contentView === 'smart-notes' ? (
              isGenerating ? (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-indigo-50/50 dark:bg-neutral-900 border border-indigo-200 dark:border-neutral-800 rounded-3xl">
                  <div className="relative mb-4">
                    <Brain className="w-12 h-12 text-indigo-600 animate-bounce" />
                    <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                    Generating Active-Recall Notes...
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                    AI is parsing the chapter PDF to craft targeted revision questions and
                    summaries.
                  </p>
                </div>
              ) : (
                <SmartNotesRenderer notes={activeChapter?.smart_notes} />
              )
            ) : (
              <PDFViewer
                chapter={activeChapter}
                themeColor={themeColor}
                hasChapters={chapters.length > 0}
              />
            )}
          </MotionWrapper>
        </MotionContainer>
      </div>

      <SmartSummaryDialog
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title={activeChapter?.title || 'Chapter Summary'}
        description={activeChapter?.description || 'No summary available for this chapter yet.'}
        themeColor={themeColor}
        chapterPerformance={chapterPerformance}
        weakTopics={chapterWeakTopics}
      />
    </main>
  )
}
