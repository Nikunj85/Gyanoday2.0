'use client'

import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useRef } from 'react'

import { createClient } from '@/lib/supabase/client'
import { useAdminStore } from '@/store/admin-store'

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading } = useAdminStore()
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  // Keep ref updated
  pathnameRef.current = pathname

  useEffect(() => {
    let mounted = true
    let loadingTimeout: NodeJS.Timeout | null = null

    // Use a regular function instead of an async function for the entry point
    const initAuth = () => {
      if (!mounted) return

      setIsLoading(true)

      // Safety timeout
      loadingTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('AdminAuthProvider: Auth initialization timed out')
          setIsLoading(false)
        }
      }, 10000)

      // Run the async logic in a separate block
      ;(async () => {
        try {
          const {
            data: { user: authUser },
            error: authError,
          } = await supabase.auth.getUser()

          if (!mounted) return

          // Ignore "Refresh Token Not Found" errors as they are common when session expires
          if (authError) {
            if (!authError.message.includes('Refresh Token Not Found')) {
            }
            setUser(null)
            if (pathnameRef.current.startsWith('/mycp') && pathnameRef.current !== '/mycp/login') {
              router.push('/mycp/login')
            }
            return
          }

          if (authUser) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single()

            if (!mounted) return

            if (userError) {
              console.error('AdminAuthProvider: Error fetching user data:', userError)
            }

            if (userData && userData.role === 'admin') {
              setUser(userData)
            } else {
              setUser(null)
              if (
                pathnameRef.current.startsWith('/mycp') &&
                pathnameRef.current !== '/mycp/login'
              ) {
                router.push('/mycp/login')
              }
            }
          } else {
            setUser(null)
            if (pathnameRef.current.startsWith('/mycp') && pathnameRef.current !== '/mycp/login') {
              router.push('/mycp/login')
            }
          }
        } catch (error: any) {
          if (!mounted) return

          const errorMessage = error?.message || String(error)
          if (errorMessage.includes('callback is no longer runnable')) {
            return
          }

          console.error('AdminAuthProvider: Unexpected error during initAuth:', error)
          setUser(null)
        } finally {
          if (mounted) {
            if (loadingTimeout) clearTimeout(loadingTimeout)
            setIsLoading(false)
          }
        }
      })()
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return
      ;(async () => {
        try {
          if (session?.user) {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (mounted && userData && userData.role === 'admin') {
                setUser(userData)
                setIsLoading(false)
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            if (pathnameRef.current.startsWith('/mycp') && pathnameRef.current !== '/mycp/login') {
              router.push('/mycp/login')
            }
          }
        } catch (error: any) {
          if (!mounted) return
          const errorMessage = error?.message || String(error)
          if (!errorMessage.includes('callback is no longer runnable')) {
            console.error('AdminAuthProvider: Error in onAuthStateChange:', error)
          }
        }
      })()
    })

    return () => {
      mounted = false
      if (loadingTimeout) clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [setUser, setIsLoading, supabase, router]) // Removed pathname from dependencies

  return <>{children}</>
}
