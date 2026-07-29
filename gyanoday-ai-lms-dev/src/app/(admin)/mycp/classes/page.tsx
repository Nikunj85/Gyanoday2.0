'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { CheckCircle2, Filter, Languages, Plus, Search, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ClassForm } from '@/app/(admin)/mycp/classes/components/class-form'
import { ClassesTable } from '@/app/(admin)/mycp/classes/components/classes-table'
import { AdminSelect, SelectOption } from '@/components/common/admin-select'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FormSidebar } from '@/components/common/form-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { classService } from '@/services/class-service'
import { Class } from '@/types'
import { Language, LANGUAGE_LABELS } from '@/types/users'

export default function ClassesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Search & Filters State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')

  const queryClient = useQueryClient()

  // Debounce search
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearch(value), 300),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    debouncedSetSearch(value)
    setPage(1) // Reset to first page on search
  }

  const effectiveStatusFilter = useMemo(() => {
    if (statusFilter === 'active') return true
    if (statusFilter === 'inactive') return false
    return null
  }, [statusFilter])

  // Fetch Classes with TanStack Query
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: [
      'classes',
      { page, pageSize, search: debouncedSearch, status: statusFilter, languageFilter },
    ],
    queryFn: () =>
      classService.getClasses({
        page,
        pageSize,
        search: debouncedSearch,
        statusFilter: effectiveStatusFilter,
        languageFilter,
      }),
    placeholderData: (previousData) => previousData,
  })

  const classes = data?.data || []
  const totalItems = data?.total || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newClass: Omit<Class, 'id' | 'created_at' | 'updated_at'>) =>
      classService.createClass(newClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setIsSheetOpen(false)
      toast({ title: 'Class created successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create class', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Class> }) =>
      classService.updateClass(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setIsSheetOpen(false)
      setEditingClass(null)
      toast({ title: 'Class updated successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update class', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classService.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setDeleteConfirmId(null)
      setIsSheetOpen(false) // If sidebar was open
      toast({ title: 'Class deleted successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete class', description: error.message, variant: 'destructive' })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (orders: { id: string; order_num: number }[]) =>
      classService.reorderClasses(orders),
    onMutate: async (newOrder) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['classes'] })
      const previousClasses = queryClient.getQueryData([
        'classes',
        { page, pageSize, search: debouncedSearch, status: statusFilter, languageFilter },
      ])

      // We don't want to re-fetch if we are just reordering on the UI,
      // but since the server-side might have different pagination, it's safer to just invalidate.
      // For a better UX, we'd manually update the cache here.

      return { previousClasses }
    },
    onSuccess: () => {
      toast({ title: 'Classes reordered successfully' })
    },
    onError: (err, newOrder, context) => {
      toast({ title: 'Failed to reorder classes', variant: 'destructive' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })

  const handleCreate = () => {
    setEditingClass(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setIsSheetOpen(true)
  }

  const handleDeleteTrigger = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleFormSubmit = (formData: any) => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, updates: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleReorder = (result: any) => {
    if (!result.destination) return

    const items = Array.from(classes)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order_num based on new index
    // Using simple approach: index + 1
    const newOrders = items.map((item, index) => ({
      id: item.id,
      order_num: index + 1 + (page - 1) * pageSize,
    }))

    reorderMutation.mutate(newOrders)
  }

  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Status', icon: Filter },
    { value: 'active', label: 'Active', icon: CheckCircle2 },
    { value: 'inactive', label: 'Inactive', icon: XCircle },
  ]

  const languageOptions: SelectOption[] = [
    { value: 'all', label: 'All Languages', icon: Languages },
    ...Object.values(Language).map((lang) => ({
      value: lang,
      label: LANGUAGE_LABELS[lang],
      icon: Languages,
    })),
  ]

  const pageSizeOptions: SelectOption[] = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
  ]

  return (
    <div className="min-h-full animate-fade-in">
      <div className="mx-auto max-w-8xl">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-primary">Classes Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage academic classes, student enrollment, and ordering.
              </p>
            </div>
            <Button onClick={handleCreate} className="admin-button-primary">
              <Plus className="mr-2 h-5 w-5" /> Add New Class
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-border shadow-subtle">
            <div className="flex flex-1 items-center gap-4 w-full">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={handleSearchChange}
                  className="admin-input pl-10 h-11"
                />
              </div>
              <AdminSelect
                value={statusFilter}
                onValueChange={(v: string) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
                options={statusOptions}
                className="h-11 w-40"
              />
              <AdminSelect
                value={languageFilter}
                onValueChange={(v: string) => {
                  setLanguageFilter(v)
                  setPage(1)
                }}
                options={languageOptions}
                className="h-11 w-44"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                View:
              </span>
              <AdminSelect
                value={String(pageSize)}
                onValueChange={(v: string) => {
                  setPageSize(Number(v))
                  setPage(1)
                }}
                options={pageSizeOptions}
                className="w-20 h-9 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            <ClassesTable
              classes={classes}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
              onReorder={handleReorder}
            />

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isDisabled={isLoading || isPlaceholderData}
            />
          </div>
        </div>
      </div>

      {/* Sidebar Form */}
      <FormSidebar
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={editingClass ? 'Edit Class' : 'Create Class'}
        description={
          editingClass
            ? `Modify class information for ${editingClass.name}`
            : 'Fill in the details to add a new class to the system.'
        }
      >
        <ClassForm
          initialData={editingClass}
          onSubmit={handleFormSubmit}
          onDelete={handleDeleteTrigger}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          existingClasses={classes}
        />
      </FormSidebar>

      {/* Delete Confirmation */}

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the class and remove all associated data."
        onConfirm={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
      />
    </div>
  )
}
