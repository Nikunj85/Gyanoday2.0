'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { BookOpen, Eye, Filter, Languages, Plus, Search } from 'lucide-react'
import { EyeOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { generateChapterSummary } from '@/app/actions/chapter-actions'
import { AdminSelect, SelectOption } from '@/components/common/admin-select'
import { FormSidebar } from '@/components/common/form-sidebar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { toast } from '@/components/ui/use-toast'
import { chapterService } from '@/services/chapter-service'
import { classService } from '@/services/class-service'
import { subjectService } from '@/services/subject-service'
import { Chapter } from '@/types'
import { Language, LANGUAGE_LABELS } from '@/types/users'

import { ChapterForm } from './components/chapter-form'
import { ChaptersTable } from './components/chapters-table'

export default function ChaptersPage() {
  const queryClient = useQueryClient()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Search and filter states
  const [search, setSearch] = useState('')

  const [isVisibleFilter, setIsVisibleFilter] = useState<boolean | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null)
  const [classFilter, setClassFilter] = useState<string | null>(null)
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch subjects for filter

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch classes for filter
  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => classService.getClasses({ page: 1, pageSize: 100 }),
  })

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value)
        setPage(1)
      }, 300),
    []
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value)
    },
    [debouncedSearch]
  )

  // Fetch chapters
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: [
      'chapters',
      { page, pageSize, search, isVisibleFilter, subjectFilter, classFilter, languageFilter },
    ],
    queryFn: () =>
      chapterService.getChapters({
        page,
        pageSize,
        search,
        isVisibleFilter,
        subjectId: subjectFilter,
        classId: classFilter,
        languageFilter,
      }),
    staleTime: 1000 * 60,
    placeholderData: (previousData) => previousData,
  })

  const chapters = data?.data || []
  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  // Mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const { generate_ai_summary, ...chapterData } = data
      return chapterService.create(chapterData)
    },
    onSuccess: (data, variables: any) => {
      toast({ title: 'Chapter created successfully' })
      setIsSheetOpen(false)
      queryClient.invalidateQueries({ queryKey: ['chapters'] })

      if (variables.generate_ai_summary && data?.pdf_url && data?.id) {
        handleGenerateSummary(data)
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create chapter',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates: data }: { id: string; updates: any }) => {
      const { generate_ai_summary, ...updates } = data
      return chapterService.update(id, updates)
    },
    onSuccess: (data) => {
      toast({ title: 'Chapter updated successfully' })
      setIsSheetOpen(false)
      setEditingChapter(null)
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update chapter',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chapterService.delete(id),
    onSuccess: () => {
      toast({ title: 'Chapter deleted successfully' })
      setDeleteConfirmId(null)
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete chapter',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (orders: { id: string; order_num: number }[]) => chapterService.reorder(orders),
    onSuccess: () => {
      toast({ title: 'Chapters reordered successfully' })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to reorder chapters',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleGenerateSummary = async (chapter: Chapter) => {
    toast({
      title: 'Generating Summary',
      description: 'Please wait while AI analyzes the PDF material...',
    })

    const result = await generateChapterSummary(chapter.id, chapter.pdf_url ?? '', chapter.language)

    if (result.success) {
      toast({
        title: 'Summary Generated',
        description: 'Chapter description has been updated with the AI summary.',
      })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    } else {
      toast({
        title: 'Summary Generation Failed',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const handleCreate = () => {
    setEditingChapter(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setIsSheetOpen(true)
  }

  const handleDeleteTrigger = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId)
    }
  }

  const subjectOptions: SelectOption[] = useMemo(
    () => [
      { value: 'all', label: 'All Subjects', icon: Filter },
      ...(subjectsData?.map((subject: any) => ({
        value: String(subject.id),
        label: subject.name,
        icon: BookOpen,
      })) || []),
    ],
    [subjectsData]
  )

  const classOptions: SelectOption[] = useMemo(
    () => [
      { value: 'all', label: 'All Classes', icon: Filter },
      ...(classesData?.data.map((cls) => ({
        value: String(cls.id),
        label: cls.name,
      })) || []),
    ],
    [classesData]
  )

  const languageOptions: SelectOption[] = [
    { value: 'all', label: 'All Languages', icon: Languages },
    ...Object.values(Language).map((lang) => ({
      value: lang,
      label: LANGUAGE_LABELS[lang],
      icon: Languages,
    })),
  ]

  const visibilityOptions: SelectOption[] = [
    { value: 'all', label: 'All Visibility', icon: Filter },
    { value: 'true', label: 'Visible', icon: Eye },
    { value: 'false', label: 'Hidden', icon: EyeOff },
  ]

  const pageSizeOptions: SelectOption[] = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
  ]

  const handleFormSubmit = (data: any) => {
    if (editingChapter) {
      updateMutation.mutate({ id: editingChapter.id, updates: data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="min-h-full animate-fade-in">
      <div className="mx-auto max-w-8xl">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-primary">
                Chapters Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage academic chapters, content, and ordering.
              </p>
            </div>
            <Button onClick={handleCreate} className="admin-button-primary">
              <Plus className="mr-2 h-5 w-5" /> Add New Chapter
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-border shadow-subtle">
              <div className="flex flex-1 items-center gap-4 w-full flex-wrap">
                <div className="relative flex-1 max-w-sm min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chapters..."
                    onChange={handleSearchChange}
                    className="admin-input pl-10 h-11"
                  />
                </div>

                <AdminSelect
                  value={classFilter || 'all'}
                  onValueChange={(value) => {
                    setClassFilter(value === 'all' ? null : value)
                    setPage(1)
                  }}
                  options={classOptions}
                  className="w-[200px]"
                  placeholder="All Classes"
                />

                <AdminSelect
                  value={subjectFilter || 'all'}
                  onValueChange={(value) => {
                    setSubjectFilter(value === 'all' ? null : value)
                    setPage(1)
                  }}
                  options={subjectOptions}
                  className="w-[240px]"
                  placeholder="All Subjects"
                />

                <AdminSelect
                  value={languageFilter}
                  onValueChange={(value) => {
                    setLanguageFilter(value)
                    setPage(1)
                  }}
                  options={languageOptions}
                  className="w-[200px]"
                  placeholder="Language"
                />

                <AdminSelect
                  value={isVisibleFilter === null ? 'all' : String(isVisibleFilter)}
                  onValueChange={(value) => {
                    setIsVisibleFilter(value === 'all' ? null : value === 'true')
                    setPage(1)
                  }}
                  options={visibilityOptions}
                  className="w-40"
                  placeholder="Visibility"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                  View:
                </span>
                <AdminSelect
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                  options={pageSizeOptions}
                  className="w-20 h-9 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            <ChaptersTable
              chapters={chapters}
              subjects={subjectsData}
              isLoading={isLoading || isPlaceholderData}
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
              onReorder={reorderMutation.mutate}
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
        title={editingChapter ? 'Edit Chapter' : 'Create Chapter'}
        description={
          editingChapter
            ? `Modify chapter information for ${editingChapter.title}`
            : 'Fill in the details to add a new chapter to the system.'
        }
      >
        <ChapterForm
          chapter={editingChapter}
          onSubmit={handleFormSubmit}
          onDelete={handleDeleteTrigger}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </FormSidebar>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent className="bg-white border border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-primary">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the chapter and remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-secondary/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="admin-button-primary bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
