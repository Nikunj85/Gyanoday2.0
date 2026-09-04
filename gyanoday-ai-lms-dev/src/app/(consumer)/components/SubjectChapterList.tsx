'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, NotebookPen, Star } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SubjectProgressOverview } from '@/app/actions/student-progress-actions'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { getFriendlyErrorMessage } from '@/lib/utils/error-messages'
import { chapterProgressService } from '@/services/chapter-progress-service'
import { notesService } from '@/services/notes-service'

import { ChapterNoteModal } from './ChapterNoteModal'

interface SubjectChapterListProps {
  subjects: SubjectProgressOverview[]
  userId: string
}

export function SubjectChapterList({ subjects, userId }: SubjectChapterListProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(subjects[0]?.id ?? null)
  const [noteModalChapter, setNoteModalChapter] = useState<{ id: string; title: string } | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [isLoadingNote, setIsLoadingNote] = useState(false)

  const invalidateOverview = () =>
    queryClient.invalidateQueries({ queryKey: ['student-progress-overview'] })

  const revisionMutation = useMutation({
    mutationFn: ({ chapterId, next }: { chapterId: string; next: boolean }) =>
      chapterProgressService.setNeedsRevision(userId, chapterId, next),
    onSuccess: invalidateOverview,
    onError: (err) => {
      toast({
        title: "Couldn't update revision flag",
        description: getFriendlyErrorMessage(err),
        variant: 'destructive',
      })
    },
  })

  const saveNoteMutation = useMutation({
    mutationFn: (content: string) => {
      if (!noteModalChapter) throw new Error('No chapter selected')
      return notesService.upsertChapterNote(userId, noteModalChapter.id, content)
    },
    onSuccess: () => {
      invalidateOverview()
      setNoteModalChapter(null)
      toast({ title: 'Note saved' })
    },
    onError: (err) => {
      toast({ title: "Couldn't save note", description: getFriendlyErrorMessage(err), variant: 'destructive' })
    },
  })

  const openNoteModal = async (chapterId: string, chapterTitle: string) => {
    setNoteModalChapter({ id: chapterId, title: chapterTitle })
    setIsLoadingNote(true)
    try {
      const existing = await notesService.getNoteForChapter(userId, chapterId)
      setNoteContent(existing?.content || '')
    } catch (err) {
      toast({ title: "Couldn't load note", description: getFriendlyErrorMessage(err), variant: 'destructive' })
      setNoteContent('')
    } finally {
      setIsLoadingNote(false)
    }
  }

  if (subjects.length === 0) return null

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl overflow-hidden">
      <div className="px-5 md:px-6 pt-5 md:pt-6 pb-3">
        <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
          {t('common.student_dashboard.chapter_list.title', 'Subjects & Chapters')}
        </h4>
        <p className="text-xs text-neutral-400 mt-0.5">
          {t(
            'common.student_dashboard.chapter_list.subtitle',
            'Star a chapter to mark it for revision, or jot a quick note for later.'
          )}
        </p>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {subjects.map((subject) => {
          const isExpanded = expandedSubjectId === subject.id
          const color = subject.colorCode || '#7C6FE0'

          return (
            <div key={subject.id}>
              <button
                onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                className="w-full flex items-center justify-between px-5 md:px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                    {subject.name}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">
                    {subject.completedCount}/{subject.totalCount}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={cn('text-neutral-400 transition-transform', isExpanded && 'rotate-180')}
                />
              </button>

              {isExpanded && (
                <div className="pb-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                        <th className="pl-5 md:pl-6 pr-3 py-2 font-bold">
                          {t('common.student_dashboard.chapter_list.chapter', 'Chapter')}
                        </th>
                        <th className="px-3 py-2 font-bold text-center">
                          {t('common.student_dashboard.chapter_list.note', 'Note')}
                        </th>
                        <th className="pr-5 md:pr-6 pl-3 py-2 font-bold text-center">
                          {t('common.student_dashboard.chapter_list.revision', 'Revision')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subject.chapters.map((chapter) => (
                        <tr
                          key={chapter.id}
                          className="border-t border-neutral-50 dark:border-neutral-800/60"
                        >
                          <td className="pl-5 md:pl-6 pr-3 py-2.5 text-neutral-700 dark:text-neutral-200 font-medium truncate max-w-[220px] sm:max-w-none">
                            {chapter.title}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => openNoteModal(chapter.id, chapter.title)}
                              className={cn(
                                'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110 active:scale-95',
                                chapter.hasNote
                                  ? 'text-white'
                                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 bg-neutral-100 dark:bg-neutral-800'
                              )}
                              style={chapter.hasNote ? { backgroundColor: color } : undefined}
                              title={chapter.hasNote ? 'Edit note' : 'Add note'}
                            >
                              <NotebookPen size={15} />
                            </button>
                          </td>
                          <td className="pr-5 md:pr-6 pl-3 py-2.5 text-center">
                            <button
                              onClick={() =>
                                revisionMutation.mutate({
                                  chapterId: chapter.id,
                                  next: !chapter.needsRevision,
                                })
                              }
                              disabled={revisionMutation.isPending}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110 active:scale-95"
                              title={chapter.needsRevision ? 'Marked for revision' : 'Mark for revision'}
                            >
                              <Star
                                size={17}
                                className={
                                  chapter.needsRevision
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-neutral-300 dark:text-neutral-600'
                                }
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ChapterNoteModal
        isOpen={!!noteModalChapter}
        onClose={() => setNoteModalChapter(null)}
        chapterTitle={noteModalChapter?.title || ''}
        initialContent={isLoadingNote ? '' : noteContent}
        isSaving={saveNoteMutation.isPending}
        onSave={(content) => saveNoteMutation.mutate(content)}
      />
    </div>
  )
}
