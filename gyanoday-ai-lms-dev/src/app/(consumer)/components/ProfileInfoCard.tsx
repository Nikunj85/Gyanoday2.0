'use client'

import { ReactNode } from 'react'

interface ProfileInfoCardProps {
  title: string
  children: ReactNode
}

export function ProfileInfoCard({ title, children }: ProfileInfoCardProps) {
  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-[40px] p-8 md:p-9 shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-neutral-100 dark:border-neutral-800 flex flex-col items-center transition-colors duration-300">
        <h3 className="text-philosophy dark:text-lavender-mist text-center font-semibold text-lg md:text-xl mb-6 flex items-center justify-center gap-2">
          <span className="opacity-50">::</span> {title} <span className="opacity-50">::</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 w-full">{children}</div>
      </div>
      <div className="h-1" /> {/* Spacing */}
    </>
  )
}
