'use client'

import { useFormik } from 'formik'
import { Trash2 } from 'lucide-react'
import * as z from 'zod'

import { AdminSelect, SelectOption } from '@/components/common/admin-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Class } from '@/types'
import { Language, LANGUAGE_LABELS } from '@/types/users'

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Class name is required.' })
    .min(2, { message: 'Class name must be at least 2 characters.' }),
  order_num: z.coerce.number().min(0),
  is_active: z.boolean(),
  language: z.string().min(1, 'Please select a language'),
})

type ClassFormValues = z.infer<typeof formSchema>

interface ClassFormProps {
  initialData?: Class | null
  onSubmit: (data: ClassFormValues) => void
  onDelete?: (id: string) => void
  isSubmitting?: boolean
  existingClasses?: Class[]
}

export function ClassForm({
  initialData,
  onSubmit,
  onDelete,
  isSubmitting = false,
  existingClasses = [],
}: ClassFormProps) {
  const statusOptions: SelectOption[] = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ]

  const languageOptions: SelectOption[] = Object.values(Language).map((lang) => ({
    value: lang,
    label: LANGUAGE_LABELS[lang],
  }))

  const formik = useFormik<ClassFormValues>({
    initialValues: {
      name: initialData?.name || '',
      order_num: initialData?.order_num || 0,
      is_active: initialData ? !!initialData.is_active : true,
      language: initialData?.language || Language.EN,
    },
    validate: (values) => {
      const result = formSchema.safeParse(values)
      const errors: Record<string, string> = {}

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const key = String(issue.path[0])
          if (!errors[key]) {
            errors[key] = issue.message
          }
        })
      }

      // Check for duplicate class name with same language
      const isDuplicate = existingClasses.some(
        (cls) =>
          cls.name.toLowerCase() === values.name.toLowerCase() &&
          cls.language === values.language &&
          cls.id !== initialData?.id
      )

      if (isDuplicate) {
        errors.name = `A class with name "${values.name}" already exists in ${LANGUAGE_LABELS[values.language as Language]}. Please use a different name or language.`
      }

      return errors
    },
    onSubmit: onSubmit,
    enableReinitialize: true,
  })

  return (
    <div className="space-y-6 py-4">
      <form key={initialData?.id || 'new'} onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="grid gap-1">
            <Label htmlFor="name" className="admin-label">
              Class Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Class 10"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="admin-input"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.name}</p>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="order_num" className="admin-label">
              Sort Order
            </Label>
            <Input
              id="order_num"
              name="order_num"
              type="number"
              value={formik.values.order_num}
              onChange={(e) =>
                formik.setFieldValue('order_num', Number((e.target as HTMLInputElement).value))
              }
              onBlur={formik.handleBlur}
              className="admin-input"
            />
            {formik.touched.order_num && formik.errors.order_num && (
              <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.order_num}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1">
              <Label className="admin-label">Language</Label>
              <AdminSelect
                value={formik.values.language}
                onValueChange={(val) => formik.setFieldValue('language', val)}
                options={languageOptions}
                placeholder="Select language"
              />
              {formik.touched.language && formik.errors.language && (
                <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.language}</p>
              )}
            </div>

            <div className="grid gap-1">
              <Label className="admin-label">Status</Label>
              <AdminSelect
                value={formik.values.is_active ? 'true' : 'false'}
                onValueChange={(val) => formik.setFieldValue('is_active', val === 'true')}
                options={statusOptions}
                placeholder="Select status"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border">
          {initialData && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(initialData.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Class
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="admin-button-primary min-w-[140px]"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Class' : 'Create Class'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
