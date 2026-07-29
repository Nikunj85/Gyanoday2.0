'use client'

import { QuizLoading } from './QuizLoading'

export const QuizCardSkeleton = () => {
  return (
    <div className="w-full max-w-[1500px] mx-auto py-5 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side - Question Skeleton */}
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] min-h-[500px] flex flex-col border border-gray-100 dark:border-neutral-800 transition-colors duration-300 relative">
          {/* Shimmer overlay - z-0 to stay behind content */}
          <div className="absolute inset-0 animate-shimmer pointer-events-none z-0 rounded-[32px]" />

          <div className="h-6 w-32 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-8 relative z-10" />

          <div className="flex-grow flex flex-col justify-center items-center relative z-10">
            <QuizLoading showDecorations={false} />

            {/* Mock Image Area - lowered opacity */}
            <div className="w-full max-w-[300px] aspect-[4/3] bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl mt-4" />
          </div>
        </div>

        {/* Right Side - Options Skeleton */}
        <div className="space-y-6 relative overflow-hidden">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 animate-shimmer pointer-events-none z-10" />

          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full flex items-center gap-4 p-7 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-transparent dark:border-neutral-800 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                <div className="h-6 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Actions Skeleton */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="flex-1 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
            <div className="flex-1 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
