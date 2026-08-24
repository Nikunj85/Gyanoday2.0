'use client'

import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import {
  Edit,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Languages,
  ListOrdered,
  Loader2,
  MessageSquareText,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { generateChapterSummary } from '@/app/actions/chapter-actions'
import { generateAndSaveSmartNotes } from '@/app/actions/smart-notes-actions'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { Chapter } from '@/types'
import { Subject } from '@/types'
import { Language, LANGUAGE_LABELS } from '@/types/users'

interface ChaptersTableProps {
  chapters: Chapter[]
  subjects?: Subject[]
  isLoading: boolean
  onEdit: (chapter: Chapter) => void
  onDelete: (id: string) => void
  onReorder: (orders: { id: string; order_num: number }[]) => void
}

export function ChaptersTable({
  chapters,
  subjects,
  isLoading,
  onEdit,
  onDelete,
  onReorder,
}: ChaptersTableProps) {
  const { toast } = useToast()
  const [generatingNotesFor, setGeneratingNotesFor] = useState<string | null>(null)
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState<string | null>(null)

  const handleGenerateSummary = async (chapter: Chapter) => {
    if (!chapter.pdf_url) {
      toast({
        variant: 'destructive',
        title: 'No PDF',
        description: 'This chapter needs a PDF uploaded before generating a summary.',
      })
      return
    }
    setGeneratingSummaryFor(chapter.id)
    try {
      const result = await generateChapterSummary(chapter.id, chapter.pdf_url, chapter.language)
      if (!result.success) throw new Error(result.error || 'Failed to generate summary.')
      toast({ title: 'Summary generated', description: `Generated for "${chapter.title}".` })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to generate summary',
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setGeneratingSummaryFor(null)
    }
  }

  const handleGenerateSmartNotes = async (chapter: Chapter) => {
    if (!chapter.pdf_url) {
      toast({
        variant: 'destructive',
        title: 'No PDF',
        description: 'This chapter needs a PDF uploaded before generating Smart Notes.',
      })
      return
    }
    setGeneratingNotesFor(chapter.id)
    try {
      await generateAndSaveSmartNotes(chapter.id)
      toast({ title: 'Smart Notes generated', description: `Generated for "${chapter.title}".` })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to generate Smart Notes',
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setGeneratingNotesFor(null)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(chapters)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Prepare orders for backend
    const orders = items.map((chapter, index) => ({
      id: chapter.id,
      order_num: index,
    }))

    onReorder(orders)
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
        <Table className="admin-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="admin-table-header w-[50px]"></TableHead>
              <TableHead className="admin-table-header">Chapter Title</TableHead>
              <TableHead className="admin-table-header hidden md:table-cell">Class</TableHead>
              <TableHead className="admin-table-header hidden md:table-cell">Subject</TableHead>
              <TableHead className="admin-table-header">Language</TableHead>
              <TableHead className="admin-table-header text-center w-[60px]">#</TableHead>
              <TableHead className="admin-table-header text-center hidden sm:table-cell">
                Type
              </TableHead>
              <TableHead className="admin-table-header text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="admin-table-row">
                <TableCell className="admin-table-cell py-4" colSpan={8}>
                  <div className="h-6 w-full animate-shimmer rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (chapters.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-primary/20 rounded-2xl bg-white shadow-subtle">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
          <ListOrdered className="h-6 0-6 text-primary" />
        </div>{' '}
        <p className="font-medium">No chapters found.</p>
        <p className="text-sm">Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="chapters">
          {(provided) => (
            <Table {...provided.droppableProps} ref={provided.innerRef} className="admin-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="admin-table-header w-[50px]"></TableHead>
                  <TableHead className="admin-table-header">Chapter Title</TableHead>
                  <TableHead className="admin-table-header hidden md:table-cell">Class</TableHead>
                  <TableHead className="admin-table-header hidden md:table-cell">Subject</TableHead>
                  <TableHead className="admin-table-header">Language</TableHead>
                  <TableHead className="admin-table-header text-center w-[60px]">#</TableHead>
                  <TableHead className="admin-table-header text-center hidden sm:table-cell">
                    Type
                  </TableHead>
                  <TableHead className="admin-table-header text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((chapter, index) => (
                  <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                    {(provided, snapshot) => (
                      <TableRow
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          'admin-table-row',
                          snapshot.isDragging && 'bg-secondary/20 shadow-lg ring-2 ring-primary/20'
                        )}
                      >
                        <TableCell {...provided.dragHandleProps} className="admin-table-cell py-4">
                          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 font-medium text-foreground">
                          <div className="flex flex-col gap-1">
                            <span>{chapter.title}</span>
                            <div className="flex flex-wrap items-center gap-2 md:hidden">
                              <span className="text-xs text-muted-foreground">
                                {chapter.class?.name || '-'} • {chapter.subject?.name || '-'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {chapter.is_visible ? (
                                <span className="flex items-center text-[10px] text-emerald-600 font-medium">
                                  <Eye className="mr-1 h-3 w-3" /> Visible
                                </span>
                              ) : (
                                <span className="flex items-center text-[10px] text-muted-foreground font-medium">
                                  <EyeOff className="mr-1 h-3 w-3" /> Hidden
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 hidden md:table-cell">
                          <span className="text-sm font-semibold text-slate-700">
                            {chapter.class?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {chapter.subject?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Languages className="mr-1.5 h-3 w-3" />
                            <span className="font-medium">
                              {LANGUAGE_LABELS[chapter.language as Language] || chapter.language}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-400 text-xs font-bold">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-2">
                            {chapter.pdf_url && (
                              <Link
                                href={chapter.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                              >
                                <FileText className="h-3 w-3" /> PDF
                              </Link>
                            )}
                            {chapter.video_url && (
                              <a
                                href={chapter.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-500 text-xs font-medium hover:bg-rose-100 transition-colors"
                              >
                                <Video className="h-3 w-3" /> Video
                              </a>
                            )}
                            {!chapter.pdf_url && !chapter.video_url && (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(chapter)}
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-xl transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleGenerateSummary(chapter)}
                              disabled={generatingSummaryFor === chapter.id}
                              title={chapter.description ? 'Regenerate AI Summary' : 'Generate AI Summary'}
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-xl transition-all"
                            >
                              {generatingSummaryFor === chapter.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquareText
                                  className={cn('h-4 w-4', chapter.description && 'text-primary')}
                                />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleGenerateSmartNotes(chapter)}
                              disabled={generatingNotesFor === chapter.id}
                              title={chapter.smart_notes ? 'Regenerate Smart Notes' : 'Generate Smart Notes'}
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-xl transition-all"
                            >
                              {generatingNotesFor === chapter.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles
                                  className={cn('h-4 w-4', chapter.smart_notes && 'text-primary')}
                                />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(chapter.id)}
                              className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </TableBody>
            </Table>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
