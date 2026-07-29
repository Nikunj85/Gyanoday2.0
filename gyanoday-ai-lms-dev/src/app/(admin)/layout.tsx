import './admin-globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Toaster } from '@/components/ui/toaster'
import { AdminAuthProvider } from '@/providers/admin-auth-provider'
import { QueryProvider } from '@/providers/query-provider'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Gyanoday CP - Admin Dashboard',
  description: 'Admin control panel for Gyanoday AI',
  icons: {
    icon: [
      { url: '/G_icon.png' },
      { url: '/G_icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/G_icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/G_icon.png',
    apple: [{ url: '/G_icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-white text-slate-900`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AdminAuthProvider>{children}</AdminAuthProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
