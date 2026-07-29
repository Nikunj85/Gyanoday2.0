'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AIChatBot } from '@/components/common/AIChatBot'
import { Toaster } from '@/components/ui/toaster'
import { LanguageProvider, useLanguage } from '@/providers/language-provider'
import { QueryProvider } from '@/providers/query-provider'
import { useUserStore } from '@/store/user-store'

import { Footer } from './layout/Footer'
import { Header } from './layout/Header'
import { SimpleFooter } from './layout/SimpleFooter'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  const refreshProfile = useUserStore((state) => state.refreshProfile)

  useEffect(() => {
    setMounted(true)
    refreshProfile()
  }, [refreshProfile])

  // Define paths where the Footer should be shown
  const showFooter = [
    '/',
    '/about',
    '/faq',
    '/contact',
    '/profile',
    '/student-dashboard',
    '/dashboard',
  ].includes(pathname || '')

  // Define paths where the SimpleFooter should be shown (Subject Detail, Test, Result)
  const showSimpleFooter = pathname?.startsWith('/subjects/') || pathname?.startsWith('/quiz')

  if (!mounted) {
    return <div className="min-h-screen bg-white" />
  }

  return (
    <QueryProvider>
      <LanguageProvider>
        <div className="relative bg-white-smoke min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">{children}</main>
          {showFooter && <Footer />}
          {showSimpleFooter && <SimpleFooter />}
        </div>
        <Toaster />
        {pathname?.startsWith('/subjects/') && <AIChatBot />}
      </LanguageProvider>
    </QueryProvider>
  )
}
