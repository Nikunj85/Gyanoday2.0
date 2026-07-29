import './globals.css'
import 'katex/dist/katex.min.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import ClientLayout from './ClientLayout'
import MaintenancePage from './components/MaintenancePage'

const isMaintenanceMode = process.env.NEXT_PUBLIC_IS_UNDER_MAINTENANCE === 'true'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Gyanoday AI',
  description: 'AI-powered educational platform',
  icons: {
    icon: [{ url: '/G3_icon.png' }],
    shortcut: '/G3_icon.png',
    apple: [{ url: '/G3_icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {isMaintenanceMode ? <MaintenancePage /> : <ClientLayout>{children}</ClientLayout>}
      </body>
    </html>
  )
}
