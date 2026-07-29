'use client'

import { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
}

export default function StatCard({ label, value, icon: Icon }: StatCardProps) {
  const isEmpty = value === '0'

  return (
    <div
      className={cn(
        'admin-card group flex items-center gap-4 transition-all duration-300',
        isEmpty && 'opacity-60'
      )}
    >
      {/* Icon */}
      <div className={cn('admin-stat-icon flex-shrink-0', isEmpty && 'opacity-50')}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {/* LABEL (Top Red Box) */}
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
          {label}
        </p>

        {/* VALUE (Bottom Red Circle) */}
        {isEmpty ? (
          <span className="text-xl font-black text-slate-300">N/A</span>
        ) : (
          <h3 className="text-xl font-black text-slate-900 tabular-nums">{value}</h3>
        )}
      </div>
    </div>
  )
}
