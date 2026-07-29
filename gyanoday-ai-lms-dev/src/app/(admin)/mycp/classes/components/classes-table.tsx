'use client'

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { Edit, GripVertical, Languages, Layers, Trash2, Users as UsersIcon } from 'lucide-react'

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
import { Class } from '@/types'
import { Language, LANGUAGE_LABELS } from '@/types/users'

interface ClassesTableProps {
  classes: Class[]
  onEdit: (cls: Class) => void
  onDelete: (id: string) => void
  onReorder: (result: any) => void
  isLoading?: boolean
}

export function ClassesTable({
  classes,
  onEdit,
  onDelete,
  onReorder,
  isLoading,
}: ClassesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
        <Table className="admin-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="admin-table-header w-[50px]"></TableHead>
              <TableHead className="admin-table-header">Class Name</TableHead>
              <TableHead className="admin-table-header">Language</TableHead>
              <TableHead className="admin-table-header text-center">Order</TableHead>
              <TableHead className="admin-table-header text-center">Status</TableHead>
              <TableHead className="admin-table-header text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="admin-table-row">
                <TableCell className="admin-table-cell py-4" colSpan={6}>
                  <div className="h-6 w-full animate-shimmer rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-primary/20 rounded-2xl bg-white shadow-subtle">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium">No classes found.</p>
        <p className="text-sm">Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
      <DragDropContext onDragEnd={onReorder}>
        <Droppable droppableId="classes">
          {(provided) => (
            <Table {...provided.droppableProps} ref={provided.innerRef} className="admin-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="admin-table-header w-[50px]"></TableHead>
                  <TableHead className="admin-table-header">Class Name</TableHead>
                  <TableHead className="admin-table-header">Language</TableHead>
                  <TableHead className="admin-table-header text-center">Order</TableHead>
                  <TableHead className="admin-table-header text-center">Status</TableHead>
                  <TableHead className="admin-table-header text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls, index) => (
                  <Draggable key={cls.id} draggableId={cls.id} index={index}>
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
                          {cls.name}
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-xs text-muted-foreground font-medium">
                          <div className="flex items-center">
                            <Languages className="mr-1.5 h-3 w-3" />
                            {LANGUAGE_LABELS[cls.language as Language] || cls.language}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/30 text-primary text-xs font-bold">
                            {cls.order_num}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-center">
                          <div
                            className={cn(
                              'admin-badge',
                              !cls.is_active && 'bg-red-50 text-red-600 border border-red-100'
                            )}
                          >
                            <div
                              className={cn(
                                'mr-1.5 h-1.5 w-1.5 rounded-full',
                                cls.is_active ? 'bg-primary' : 'bg-red-600'
                              )}
                            />
                            {cls.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </TableCell>
                        <TableCell className="admin-table-cell py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(cls)}
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-xl transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(cls.id)}
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
