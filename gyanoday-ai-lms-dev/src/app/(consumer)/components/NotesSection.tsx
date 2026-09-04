'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { NotebookPen, Plus, Save, StickyNote, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { toast } from '@/components/ui/use-toast'
import { getFriendlyErrorMessage } from '@/lib/utils/error-messages'
import { notesService, StudentNote } from '@/services/notes-service'

interface NotesSectionProps {
  userId: string
  themeColor?: string
}

const NOTE_CARD_COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0', '#DDD6FE', '#FED7AA']

function colorForNote(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return NOTE_CARD_COLORS[Math.abs(hash) % NOTE_CARD_COLORS.length]
}

export function NotesSection({ userId, themeColor = '#7C6FE0' }: NotesSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isComposing, setIsComposing] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const { data: notes, isLoading } = useQuery({
    queryKey: ['student-notes', userId],
    queryFn: () => notesService.getNotes(userId),
    enabled: !!userId,
  })

  const createMutation = useMutation({
    mutationFn: () => notesService.createNote(userId, draftTitle.trim() || 'Untitled note', draftContent.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', userId] })
      setIsComposing(false)
      setDraftTitle('')
      setDraftContent('')
    },
    onError: (err) => {
      toast({ title: "Couldn't save note", description: getFriendlyErrorMessage(err), variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (note: StudentNote) =>
      notesService.updateNote(note.id, { title: editTitle.trim() || 'Untitled note', content: editContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', userId] })
      setEditingId(null)
    },
    onError: (err) => {
      toast({ title: "Couldn't update note", description: getFriendlyErrorMessage(err), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student-notes', userId] }),
    onError: (err) => {
      toast({ title: "Couldn't delete note", description: getFriendlyErrorMessage(err), variant: 'destructive' })
    },
  })

  const startEditing = (note: StudentNote) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <NotebookPen size={16} style={{ color: themeColor }} />
          <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
            {t('common.student_dashboard.notes.title', 'My Notes')}
          </h4>
        </div>
        {!isComposing && (
          <button
            onClick={() => setIsComposing(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-full transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={14} />
            {t('common.student_dashboard.notes.new', 'New note')}
          </button>
        )}
      </div>

      {/* Composer */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-2xl border-2 p-4" style={{ borderColor: `${themeColor}55` }}>
              <input
                autoFocus
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={t('common.student_dashboard.notes.title_placeholder', 'Note title…')}
                className="w-full text-sm font-bold bg-transparent outline-none mb-2 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-300"
              />
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder={t(
                  'common.student_dashboard.notes.content_placeholder',
                  'Write anything you want to remember…'
                )}
                rows={3}
                className="w-full text-sm bg-transparent outline-none resize-none text-neutral-600 dark:text-neutral-300 placeholder:text-neutral-300"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setIsComposing(false)
                    setDraftTitle('')
                    setDraftContent('')
                  }}
                  className="text-xs font-bold text-neutral-400 px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || (!draftTitle.trim() && !draftContent.trim())}
                  className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-1.5 rounded-lg disabled:opacity-40 transition-all active:scale-95"
                  style={{ backgroundColor: themeColor }}
                >
                  <Save size={13} />
                  {t('common.save', 'Save')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
          ))}
        </div>
      ) : !notes || notes.length === 0 ? (
        !isComposing && (
          <div className="text-center py-8 text-sm text-neutral-400 flex flex-col items-center gap-2">
            <StickyNote size={22} className="text-neutral-300" />
            {t(
              'common.student_dashboard.notes.empty',
              "No notes yet — jot down anything you don't want to forget."
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notes.map((note) => {
            const isEditing = editingId === note.id
            const bg = colorForNote(note.id)

            return (
              <div
                key={note.id}
                className="relative rounded-2xl p-4 group min-h-[112px] flex flex-col"
                style={{ backgroundColor: `${bg}55` }}
              >
                {!isEditing && (
                  <button
                    onClick={() => deleteMutation.mutate(note.id)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-full text-neutral-400 hover:text-red-500 hover:bg-white/60 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete note"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-sm font-bold bg-transparent outline-none mb-1.5 text-neutral-800"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full text-xs bg-transparent outline-none resize-none text-neutral-600 flex-1"
                    />
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg hover:bg-white/60 text-neutral-500"
                      >
                        <X size={13} />
                      </button>
                      <button
                        onClick={() => updateMutation.mutate(note)}
                        disabled={updateMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-white/60 text-neutral-700"
                      >
                        <Save size={13} />
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => startEditing(note)} className="text-left flex-1 flex flex-col">
                    <p className="text-sm font-bold text-neutral-800 mb-1 pr-5 line-clamp-1">
                      {note.title}
                    </p>
                    <p className="text-xs text-neutral-600 leading-relaxed line-clamp-4 flex-1 whitespace-pre-wrap">
                      {note.content || (
                        <span className="italic text-neutral-400">
                          {t('common.student_dashboard.notes.empty_content', 'Empty note')}
                        </span>
                      )}
                    </p>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
