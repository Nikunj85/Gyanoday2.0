'use client'

import { useQuery } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { Loader2, Trash2 } from 'lucide-react'
import * as z from 'zod'

import { AdminSelect, SelectOption } from '@/components/common/admin-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { classService } from '@/services/class-service'
import { Language, LANGUAGE_LABELS, User, UserRole } from '@/types/users'

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: 'Student full name is required.',
    })
    .min(2, {
      message: 'Student full name must be at least 2 characters.',
    }),
  email: z
    .string()
    .min(1, {
      message: 'Email is required.',
    })
    .email({
      message: 'Invalid email address.',
    }),
  phone: z.string().regex(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits.',
  }),
  role: z.nativeEnum(UserRole),
  class_id: z.string().nullable(),
  language: z.nativeEnum(Language),
  school_name: z.string().min(2, {
    message: 'School name is required.',
  }),
  is_active: z.boolean(),
})

interface StudentFormProps {
  initialData?: User | null
  onSubmit: (data: z.infer<typeof formSchema>) => void
  onDelete?: (id: string) => void
  isSubmitting?: boolean
}

export function StudentForm({
  initialData,
  onSubmit,
  onDelete,
  isSubmitting = false,
}: StudentFormProps) {
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => classService.getClasses({ page: 1, pageSize: 100 }),
  })

  const classOptions: SelectOption[] = [
    { value: 'none', label: 'No Class' },
    ...(classesData?.data.map((cls) => ({
      value: String(cls.id),
      label: cls.name,
    })) || []),
  ]

  const languageOptions: SelectOption[] = Object.values(Language).map((lang) => ({
    value: lang,
    label: LANGUAGE_LABELS[lang],
  }))

  const roleOptions: SelectOption[] = Object.values(UserRole).map((role) => ({
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
  }))

  const statusOptions: SelectOption[] = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ]

  const formik = useFormik<z.infer<typeof formSchema>>({
    initialValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      role: initialData?.role || UserRole.Student,
      class_id: initialData?.class_id || null,
      language: initialData?.language || Language.EN,
      school_name: initialData?.school_name || '',
      is_active: initialData ? !!initialData.is_active : true,
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
    onSubmit: onSubmit,
    enableReinitialize: true,
  })

  return (
    <div className="space-y-6 py-4">
      <form key={initialData?.id || 'new'} onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="space-y-5">
          {/* Basic Info Group */}
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="name" className="admin-label">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. John Doe"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="admin-input"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label htmlFor="email" className="admin-label">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="admin-input"
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.email}</p>
                )}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="phone" className="admin-label">
                  Phone Number
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium select-none pointer-events-none">
                    +91
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    className="admin-input pl-12"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formik.values.phone}
                    onChange={(e) => {
                      const value = (e.target as HTMLInputElement).value
                        .replace(/\D/g, '')
                        .slice(0, 10)
                      formik.setFieldValue('phone', value)
                    }}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.phone && formik.errors.phone && (
                  <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role & Access Group */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="grid gap-1">
              <Label className="admin-label">Status</Label>
              <AdminSelect
                value={formik.values.is_active ? 'true' : 'false'}
                onValueChange={(val) => formik.setFieldValue('is_active', val === 'true')}
                options={statusOptions}
                placeholder="Select status"
              />
            </div>
            <div className="grid gap-1">
              <Label className="admin-label">Class</Label>
              <AdminSelect
                value={formik.values.class_id || 'none'}
                onValueChange={(val) =>
                  formik.setFieldValue('class_id', val === 'none' ? null : val)
                }
                options={classOptions}
                placeholder="Select class"
                disabled={isLoadingClasses}
              />
            </div>
          </div>

          {/* Academic Group */}
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="grid gap-1">
              <Label className="admin-label">Language</Label>
              <AdminSelect
                value={formik.values.language}
                onValueChange={(val) => formik.setFieldValue('language', val)}
                options={languageOptions}
                placeholder="Select language"
              />
            </div>
          </div>

          <div className="grid gap-1 pt-2">
            <Label htmlFor="school_name" className="admin-label">
              School Name
            </Label>
            <Input
              id="school_name"
              placeholder="Enter school name"
              name="school_name"
              value={formik.values.school_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="admin-input"
            />
            {formik.touched.school_name && formik.errors.school_name && (
              <p className="text-xs text-red-500 font-medium mt-1">{formik.errors.school_name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
          {initialData && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(initialData.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Student
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : initialData ? (
                'Update Student'
              ) : (
                'Create Student'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
