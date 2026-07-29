import { create } from 'zustand'

import { createClient } from '@/lib/supabase/client'

interface AdminUser {
  id: string
  email?: string
  name?: string
  role: string
  [key: string]: any
}

interface AdminState {
  user: AdminUser | null
  setUser: (user: AdminUser | null) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoading: true, // Start as true to avoid initial flicker
  setIsLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    const supabase = createClient()
    set({ isLoading: true })
    try {
      const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // After login, check if the user is an admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', authData.user.id)
        .single()

      if (userError || userData?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin only.')
      }

      const adminUser: AdminUser = {
        ...authData.user,
        name: userData.name,
        role: userData.role,
      }

      set({ user: adminUser })
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Failed to login' }
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, isLoading: false })
  },
}))
