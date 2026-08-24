'use client'

import { useQuery } from '@tanstack/react-query'
import { Quote, Sparkles } from 'lucide-react'
import { useMemo } from 'react'

export function MotivationQuote() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const { data, isLoading } = useQuery({
    queryKey: ['daily-motivation-quote', today],
    queryFn: async () => {
      const response = await fetch(`/api/motivation-quote?date=${today}`)
      if (!response.ok) throw new Error('Unable to fetch motivation quote')
      return response.json() as Promise<{ quote: string; date: string }>
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })

  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 md:p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-philosophy/5 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative z-10 flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-philosophy/10">
          <Sparkles className="h-4 w-4 text-philosophy dark:text-lavender-mist" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
            Daily Motivation
          </p>
          <h3 className="text-sm font-bold text-philosophy dark:text-lavender-mist">
            Siksha Inspire
          </h3>
        </div>
      </div>

      <div className="relative z-10 flex items-start gap-3 pl-1">
        <Quote className="mt-0.5 h-5 w-5 shrink-0 text-philosophy/30 dark:text-lavender-mist/30" />
        {isLoading ? (
          <div className="w-full space-y-2 animate-pulse">
            <div className="h-4 w-[90%] rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-4 w-[65%] rounded-full bg-neutral-100 dark:bg-neutral-800" />
          </div>
        ) : (
          <p className="text-sm font-medium leading-6 text-neutral-700 dark:text-neutral-300 md:text-base">
            {data?.quote || 'Keep learning, keep growing, and trust your progress.'}
          </p>
        )}
      </div>
    </div>
  )
}
