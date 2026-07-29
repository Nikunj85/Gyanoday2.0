'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/user-store'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  school_name: z.string().min(2, 'School name is required'),
  class: z.string().min(1, 'Class is required'),
  language: z.string().min(1, 'Language is required'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface EditProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileDialog({ isOpen, onClose }: EditProfileDialogProps) {
  const { user, refreshProfile } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      school_name: user?.school_name || '',
      class: user?.class?.name || '',
      language: user?.language || 'English',
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          school_name: data.school_name,
          language: data.language,
        })
        .eq('id', user?.id)

      if (error) throw error

      await refreshProfile()
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-primary p-6 flex justify-between items-center text-white">
          <h2 className="text-2xl font-black">Edit Profile</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B3A8E] font-bold">User Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl border-2 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B3A8E] font-bold opacity-50">
                      Email Address (Cannot be changed)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="rounded-xl border-2 bg-gray-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="school_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B3A8E] font-bold">School Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl border-2 focus:border-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B3A8E] font-bold opacity-50">
                        Class (Read-only)
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="rounded-xl border-2 bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B3A8E] font-bold">Language</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl border-2 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-2 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-8"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
