'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { CheckCircle2, Filter, GraduationCap, Search, XCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { AdminSelect, SelectOption } from '@/components/common/admin-select'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FormSidebar } from '@/components/common/form-sidebar'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { toast } from '@/components/ui/use-toast'
import { classService } from '@/services/class-service'
import { userService } from '@/services/user-service'
import { User } from '@/types/users'

import { StudentForm } from './components/student-form'
import { StudentsTable } from './components/students-table'

export default function StudentsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Search & Filters State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')

  const queryClient = useQueryClient()

  // Fetch Classes for filter
  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => classService.getClasses({ page: 1, pageSize: 100 }),
  })

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

  // Fetch Users with TanStack Query
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: [
      'users',
      { page, pageSize, search: debouncedSearch, status: statusFilter, classFilter },
    ],
    queryFn: () =>
      userService.getUsers({
        page,
        pageSize,
        search: debouncedSearch,
        statusFilter: effectiveStatusFilter,
        classFilter,
      }),
    placeholderData: (previousData) => previousData,
  })

  const users = data?.data || []
  const totalItems = data?.total || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newUser: Omit<User, 'id' | 'created_at'>) => userService.createUser(newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsSheetOpen(false)
      toast({ title: 'Student created successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create student',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      userService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsSheetOpen(false)
      setEditingUser(null)
      toast({ title: 'Student updated successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update student',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteConfirmId(null)
      setIsSheetOpen(false)
      toast({ title: 'Student deleted successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete student',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsSheetOpen(true)
  }

  const handleDeleteTrigger = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleFormSubmit = (formData: any) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, updates: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const classOptions: SelectOption[] = [
    { value: 'all', label: 'All Classes', icon: GraduationCap },
    ...(classesData?.data.map((cls) => ({
      value: String(cls.id),
      label: cls.name,
      icon: GraduationCap,
    })) || []),
  ]

  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Status', icon: Filter },
    { value: 'active', label: 'Active', icon: CheckCircle2 },
    { value: 'inactive', label: 'Inactive', icon: XCircle },
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
                Students Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage students, school information, and access.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-border shadow-subtle">
            <div className="flex flex-1 items-center gap-4 w-full">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={handleSearchChange}
                  className="admin-input pl-10 h-11"
                />
              </div>
              <AdminSelect
                value={classFilter}
                onValueChange={(v: string) => {
                  setClassFilter(v)
                  setPage(1)
                }}
                options={classOptions}
                className="h-11 w-48"
              />
              <AdminSelect
                value={statusFilter}
                onValueChange={(v: string) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
                options={statusOptions}
                className="h-11 w-40"
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
            <StudentsTable
              users={users}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
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
        title={editingUser ? 'Edit Student' : 'Create Student'}
        description={
          editingUser
            ? `Modify student information for ${editingUser.name}`
            : 'Fill in the details to add a new student.'
        }
      >
        <StudentForm
          initialData={editingUser}
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
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone."
      />
    </div>
  )
}
