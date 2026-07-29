'use client'

import { useQuery } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { BookOpen, Eye, EyeOff, FileText, Trash2, Video } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import * as z from 'zod'

import { generateChapterSummary } from '@/app/actions/chapter-actions'
import { AdminSelect, SelectOption } from '@/components/common/admin-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { classService } from '@/services/class-service'
import { subjectService } from '@/services/subject-service'
import { Chapter } from '@/types'
import { Language, LANGUAGE_LABELS } from '@/types/users'

import { FileUpload } from './file-upload'

const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/

const formSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Chapter title is required.' })
      .min(2, { message: 'Chapter title must be at least 2 characters.' }),
    description: z.string().optional(),
    order_num: z.number().min(0),
    is_visible: z.boolean(),
    subject_id: z.string().min(1, { message: 'Subject is required.' }),
    class_id: z.string().min(1, { message: 'Class is required.' }),
    language: z.string().min(1, { message: 'Language is required.' }),
    pdf_url: z.string().optional(),
    video_url: z.string().optional(),
    generate_ai_summary: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.generate_ai_summary && !data.pdf_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A PDF file must be uploaded to generate an AI description.',
        path: ['pdf_url'],
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

interface SupabaseStorageError {
  message: string
  error?: string
  status?: number
}

interface ChapterFormProps {
  chapter?: Chapter | null
  onSubmit: (data: FormValues) => void
  onDelete?: (id: string) => void
  isSubmitting?: boolean
}

export function ChapterForm({
  chapter,
  onSubmit,
  onDelete,
  isSubmitting = false,
}: ChapterFormProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const formik = useFormik<FormValues>({
    initialValues: {
      title: chapter?.title || '',
      description: chapter?.description || '',
      order_num: chapter?.order_num || 0,
      is_visible: chapter?.is_visible ?? true,
      subject_id: chapter?.subject_id || '',
      class_id: chapter?.class_id || '',
      language: chapter?.language || Language.EN,
      pdf_url: chapter?.pdf_url || '',
      video_url: chapter?.video_url || '',
      generate_ai_summary: false,
    },
    validate: (values) => {
      const result = formSchema.safeParse(values)
      if (result.success) return {}
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0])
        if (!errors[key]) {
          errors[key] = issue.message
        }
      })
      return errors
    },
    onSubmit: handleSubmit,
    enableReinitialize: true,
  })

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getAll(),
  })

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => classService.getClasses({ page: 1, pageSize: 100 }),
  })

  const languageOptions: SelectOption[] = Object.values(Language).map((lang) => ({
    value: lang,
    label: LANGUAGE_LABELS[lang],
  }))

  const [videoUrl, setVideoUrl] = useState(chapter?.video_url || '')

  useEffect(() => {
    if (chapter) {
      formik.setValues({
        title: chapter.title,
        description: chapter.description || '',
        order_num: chapter.order_num,
        is_visible: chapter.is_visible,
        subject_id: chapter.subject_id,
        class_id: chapter.class_id,
        language: chapter.language,
        pdf_url: chapter.pdf_url || '',
        video_url: chapter.video_url || '',
        generate_ai_summary: false,
      })
      setVideoUrl(chapter.video_url || '')
    }
  }, [chapter])

  // Reset class and subject if they don't match the selected language
  const selectedLanguage = formik.values.language
  useEffect(() => {
    const currentClassId = formik.values.class_id
    const currentSubjectId = formik.values.subject_id

    if (currentClassId && classesData?.data) {
      const selectedClass = classesData.data.find((c) => String(c.id) === currentClassId)
      if (selectedClass && selectedClass.language !== selectedLanguage) {
        formik.setFieldValue('class_id', '')
      }
    }

    if (currentSubjectId && subjects) {
      const selectedSubject = subjects.find((s) => String(s.id) === currentSubjectId)
      if (selectedSubject && selectedSubject.language !== selectedLanguage) {
        formik.setFieldValue('subject_id', '')
      }
    }
  }, [selectedLanguage, classesData, subjects])

  const getYouTubeId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleFileUpload = async (file: File) => {
    try {
      // 1. Prepare file info
      const subjectId = formik.values.subject_id
      const subject = subjects?.find((s) => String(s.id) === subjectId)

      if (!subject) {
        toast({
          title: 'Error',
          description: 'Please select a subject first.',
          variant: 'destructive',
        })
        return
      }

      const sanitize = (str: string) =>
        str
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/-+/g, '-')
      const subjectNameSanitized = sanitize(subject.name)

      // Folder is subject wise
      const folderName = subjectNameSanitized.toLowerCase()

      // Use original filename with timestamp for uniqueness
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      const sanitizedFileName = sanitize(fileNameWithoutExt)

      // Format: originalfilename-timestamp.ext
      const newFileName = `${sanitizedFileName}-${timestamp}.${fileExt}`
      const filePath = `${folderName}/${newFileName}`

      // 2. Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('chapter-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // No need for upsert since filename is unique
        })

      if (uploadError) {
        throw uploadError
      }

      // 3. Get the Public URL
      const { data } = supabase.storage.from('chapter-pdfs').getPublicUrl(filePath)

      if (!data.publicUrl) {
        throw new Error('Failed to generate public URL')
      }

      // 4. Update form state
      formik.setFieldValue('pdf_url', data.publicUrl)

      toast({
        title: 'File uploaded successfully',
        description: 'Your PDF has been saved.',
      })

      return data.publicUrl
    } catch (err: unknown) {
      console.error('Upload error details:', err)

      const error = err as SupabaseStorageError
      let errorMessage = error.message || 'An unexpected error occurred during upload.'

      if (
        error.error === 'not_found' ||
        error.message?.includes('Bucket not found') ||
        error.message?.includes('The resource was not found')
      ) {
        errorMessage = "Storage bucket 'chapter-pdfs' not found. Please create it in Supabase."
      }

      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      throw error
    }
  }

  async function handleSubmit(values: FormValues) {
    // Ensure numeric value
    onSubmit({
      ...values,
      order_num: Number(values.order_num),
    })
  }

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-8 pb-10">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="title" className="admin-label">
              Chapter Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Chapter 1: Introduction to Algebra"
              {...formik.getFieldProps('title')}
              className="admin-input"
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-xs text-rose-500 font-bold mt-1">{formik.errors.title}</p>
            )}
          </div>

          <div className="grid gap-1">
            {!chapter && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="admin-label !mb-0 cursor-pointer">
                      Generate AI Description from PDF?
                    </Label>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Automatic description generation if PDF is uploaded
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formik.values.generate_ai_summary}
                  onCheckedChange={(val) => formik.setFieldValue('generate_ai_summary', val)}
                />
              </div>
            )}

            {!formik.values.generate_ai_summary && (
              <>
                <Label htmlFor="description" className="admin-label">
                  Description
                </Label>
                <textarea
                  id="description"
                  rows={4}
                  {...formik.getFieldProps('description')}
                  className="admin-input min-h-[120px] resize-y"
                  placeholder="Briefly describe what students will learn..."
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="grid gap-1">
              <Label htmlFor="language" className="admin-label">
                Language
              </Label>
              <AdminSelect
                value={formik.values.language}
                onValueChange={(val) => formik.setFieldValue('language', val, true)}
                options={languageOptions}
                placeholder="Select language"
              />
              {formik.touched.language && formik.errors.language && (
                <p className="text-xs text-rose-500 font-bold mt-1">{formik.errors.language}</p>
              )}
            </div>

            <div className="grid gap-2">{/* Empty space */}</div>

            <div className="grid gap-2">
              <Label htmlFor="class_id" className="admin-label">
                Class
              </Label>
              <AdminSelect
                value={formik.values.class_id}
                onValueChange={(val) => formik.setFieldValue('class_id', val, true)}
                disabled={isLoadingClasses}
                options={
                  classesData?.data
                    .filter((cls) => cls.language === formik.values.language)
                    .map((cls) => ({
                      value: String(cls.id),
                      label: cls.name,
                    })) || []
                }
                placeholder="Select a class"
                emptyMessage="No classes found for this language"
              />
              {formik.touched.class_id && formik.errors.class_id && (
                <p className="text-xs text-rose-500 font-bold mt-1">{formik.errors.class_id}</p>
              )}
            </div>

            <div className="grid gap-2">{/* Empty space */}</div>

            <div className="grid gap-2">
              <Label htmlFor="subject_id" className="admin-label">
                Subject
              </Label>
              <AdminSelect
                value={formik.values.subject_id}
                onValueChange={(val) => formik.setFieldValue('subject_id', val, true)}
                disabled={isLoadingSubjects}
                options={
                  subjects?.[0]
                    ? subjects
                        .filter((subject: any) => subject.language === formik.values.language)
                        .map((subject: any) => ({
                          value: String(subject.id),
                          label: subject.name,
                          icon: BookOpen,
                        }))
                    : []
                }
                placeholder="Select a subject"
                emptyMessage="No subjects found for this language"
              />
              {formik.touched.subject_id && formik.errors.subject_id && (
                <p className="text-xs text-rose-500 font-bold mt-1">{formik.errors.subject_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-1 p-4 border rounded-xl bg-slate-50/50">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <FileText size={18} />
              <span>PDF Document</span>
            </div>
            <FileUpload
              onUpload={handleFileUpload}
              onRemove={() => {
                formik.setFieldValue('pdf_url', '')
              }}
              value={formik.values.pdf_url}
            />
            {formik.touched.pdf_url && formik.errors.pdf_url && (
              <p className="text-xs text-rose-500 font-bold mt-2">{formik.errors.pdf_url}</p>
            )}
            {formik.values.pdf_url && (
              <Link
                href={formik.values.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm text-green-600 flex items-center gap-1 hover:underline"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                PDF uploaded successfully (click to open)
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Video size={18} />
                <span>Video Content</span>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="video_url" className="text-xs">
                  YouTube URL
                </Label>
                <Input
                  id="video_url"
                  {...formik.getFieldProps('video_url')}
                  onChange={(e) => {
                    formik.setFieldValue('video_url', e.target.value)
                    setVideoUrl(e.target.value)
                  }}
                  placeholder="Enter YouTube video URL"
                  className="bg-white"
                />
              </div>
              {formik.values.video_url && (
                <a
                  href={formik.values.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Video link available (click to open)
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Settings & Workflow */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <Label className="admin-label">Sort Order</Label>
            <Input type="number" {...formik.getFieldProps('order_num')} className="admin-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  formik.values.is_visible
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-50 text-slate-400'
                )}
              >
                {formik.values.is_visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </div>
              <div>
                <Label className="admin-label !mb-0 cursor-pointer">Visibility</Label>
                <p className="text-[10px] text-slate-500 font-medium">
                  {formik.values.is_visible ? 'Visible to students' : 'Hidden from students'}
                </p>
              </div>
            </div>
            <Switch
              checked={formik.values.is_visible}
              onCheckedChange={(val) => formik.setFieldValue('is_visible', val)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-100 z-10">
        {chapter && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(chapter.id)}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Chapter
          </Button>
        ) : (
          <div />
        )}
        <Button type="submit" className="admin-button-primary px-8" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : chapter ? 'Save Changes' : 'Create Chapter'}
        </Button>
      </div>
    </form>
  )
}
