'use client'

import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { BookOpen, Edit, GripVertical, Languages, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Subject } from '@/types/subjects'
import { Language, LANGUAGE_LABELS } from '@/types/users'

interface SubjectsTableProps {
  subjects: Subject[]
  isLoading: boolean
  onEdit: (subject: Subject) => void
  onDelete: (id: string) => void
  onReorder: (result: DropResult) => void
}

export const SubjectsTable = ({
  subjects,
  isLoading,
  onEdit,
  onDelete,
  onReorder,
}: SubjectsTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
        <Table className="admin-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="admin-table-header w-[50px]"></TableHead>
              <TableHead className="admin-table-header w-[70px]">Image</TableHead>
              <TableHead className="admin-table-header">Subject Name</TableHead>
              <TableHead className="admin-table-header">Language</TableHead>
              <TableHead className="admin-table-header text-center">Order</TableHead>
              <TableHead className="admin-table-header text-center">Status</TableHead>
              <TableHead className="admin-table-header text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="admin-table-row">
                <TableCell className="admin-table-cell py-4" colSpan={7}>
                  <div className="h-6 w-full animate-shimmer rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-primary/20 rounded-2xl bg-white shadow-subtle">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium">No subjects found.</p>
        <p className="text-sm">Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
      <DragDropContext onDragEnd={onReorder}>
        <Droppable droppableId="subjects">
          {(provided) => (
            <Table {...provided.droppableProps} ref={provided.innerRef} className="admin-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="admin-table-header w-[50px]"></TableHead>
                  <TableHead className="admin-table-header w-[70px]">Image</TableHead>
                  <TableHead className="admin-table-header">Subject Name</TableHead>
                  <TableHead className="admin-table-header">Language</TableHead>
                  <TableHead className="admin-table-header text-center">Order</TableHead>
                  <TableHead className="admin-table-header text-center">Status</TableHead>
                  <TableHead className="admin-table-header text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject, index) => (
                  <Draggable
                    key={String(subject.id)}
                    draggableId={String(subject.id)}
                    index={index}
                  >
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
                        <TableCell className="admin-table-cell py-4">
                          <div
                            className="relative h-11 w-11 rounded-xl overflow-hidden bg-slate-100 ring-2 ring-offset-2 transition-all group-hover:ring-primary/20"
                            style={
                              {
                                backgroundColor: subject.color_code || 'var(--philosophy)',
                                borderColor: subject.color_code || 'transparent',
                                boxShadow: subject.color_code
                                  ? `0 0 10px ${subject.color_code}40`
                                  : 'none',
                                scale: 1,
                                // @ts-ignore
                                '--ring-color': subject.color_code || 'transparent',
                              } as any
                            }
                          >
                            {subject.image_url ? (
                              <img
                                src={subject.image_url}
                                alt={subject.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  ;(e.target as any).src =
                                    'https://ui-avatars.com/api/?name=' +
                                    encodeURIComponent(subject.name) +
                                    '&background=random'
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full text-white font-bold text-lg">
                                {subject.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 font-semibold text-foreground">
                          {subject.name}
                        </TableCell>
                        <TableCell className="admin-table-cell py-4">
                          <div className="flex items-center text-xs text-muted-foreground mr-1.5 h-3 w-3">
                            <Languages className="mr-1.5 h-3 w-3" />{' '}
                            {LANGUAGE_LABELS[subject.language as Language] ?? 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/30 text-primary text-xs font-bold">
                            {subject.order_num}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-center">
                          <div
                            className={cn(
                              'admin-badge mx-auto',
                              !subject.is_active && 'bg-red-50 text-red-600 border border-red-100'
                            )}
                          >
                            <div
                              className={cn(
                                'mr-1.5 h-1.5 w-1.5 rounded-full',
                                subject.is_active ? 'bg-primary' : 'bg-red-600'
                              )}
                            />
                            {subject.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(subject)}
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-xl transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(subject.id)}
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
