'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

import Header from '@/components/admin/Header'
import Sidebar from '@/components/admin/Sidebar'

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Exclude login page from the layout
  if (pathname === '/mycp/login') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-white selection:bg-secondary selection:text-primary">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      <main className="flex-1 transition-all duration-300 lg:ml-72">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="p-4 animate-fade-in md:p-8">{children}</div>
      </main>
    </div>
  )
}
