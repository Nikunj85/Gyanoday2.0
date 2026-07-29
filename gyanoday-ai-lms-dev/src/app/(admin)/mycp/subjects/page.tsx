'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import {
  CheckCircle2,
  Filter,
  Globe,
  GraduationCap,
  Languages,
  Plus,
  Search,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { subjectService } from '@/services/subject-service'
import { Subject } from '@/types/subjects'
import { Language, LANGUAGE_LABELS } from '@/types/users'

import { SubjectForm } from './components/subject-form'
import { SubjectsTable } from './components/subjects-table'

export default function SubjectsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
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

  // Fetch Subjects with TanStack Query
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: [
      'subjects',
      { page, pageSize, search: debouncedSearch, status: statusFilter, languageFilter },
    ],
    queryFn: () =>
      subjectService.getSubjects({
        page,
        pageSize,
        search: debouncedSearch,
        statusFilter: effectiveStatusFilter,
        languageFilter,
        isAdmin: true,
      }),
    placeholderData: (previousData) => previousData,
  })

  const subjects = data?.data || []
  const totalItems = data?.total || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newSubject: any) =>
      subjectService.createSubject({
        ...newSubject,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setIsSheetOpen(false)
      toast({ title: 'Subject created successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create subject',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      subjectService.updateSubject(id, {
        ...updates,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setIsSheetOpen(false)
      setEditingSubject(null)
      toast({ title: 'Subject updated successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update subject',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setDeleteConfirmId(null)
      setIsSheetOpen(false)
      toast({ title: 'Subject deleted successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete subject',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (orders: { id: string; order_num: number }[]) =>
      subjectService.reorderSubjects(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      toast({ title: 'Subjects reordered successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to reorder subjects', variant: 'destructive' })
    },
  })

  const handleCreate = () => {
    setEditingSubject(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setIsSheetOpen(true)
  }

  const handleDeleteTrigger = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleFormSubmit = (formData: any) => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, updates: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleReorder = (result: any) => {
    if (!result.destination) return

    const items = Array.from(subjects)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

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
      icon: Globe,
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
              <h1 className="text-4xl font-bold tracking-tight text-primary">
                Subjects Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage academic subjects, assign them to classes, and set display ordering.
              </p>
            </div>
            <Button onClick={handleCreate} className="admin-button-primary">
              <Plus className="mr-2 h-5 w-5" /> Add New Subject
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 shadow-subtle md:flex-row">
            <div className="flex w-full flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={handleSearchChange}
                  className="admin-input h-11 pl-10"
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
                className="h-11 w-40"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
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
            <SubjectsTable
              subjects={subjects}
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
        title={editingSubject ? 'Edit Subject' : 'Create Subject'}
        description={
          editingSubject
            ? `Modify subject information for ${editingSubject.name}`
            : 'Fill in the details to add a new subject to the system.'
        }
      >
        <SubjectForm
          initialData={editingSubject}
          onSubmit={handleFormSubmit}
          onDelete={handleDeleteTrigger}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </FormSidebar>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
        isPending={deleteMutation.isPending}
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This action cannot be undone."
      />
    </div>
  )
}
