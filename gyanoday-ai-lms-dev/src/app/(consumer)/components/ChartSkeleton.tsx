'use client'

interface ChartSkeletonProps {
  type: 'bar' | 'area'
}

export const ChartSkeleton = ({ type }: ChartSkeletonProps) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col p-4 md:p-12 pl-4 bg-white dark:bg-neutral-900 rounded-[16px] animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 md:w-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-4 w-20 md:w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
          <div className="h-4 w-20 md:w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
        </div>
      </div>

      {type === 'bar' ? (
        <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 mt-8 pb-8 pr-4">
          {[40, 70, 45, 90, 60, 30, 80].map((height, i) => (
            <div key={i} className="w-full flex flex-col gap-3 justify-end h-full items-center">
              <div className="w-full flex justify-center gap-1 h-full items-end">
                <div
                  className="w-1/2 md:w-8 bg-primary/20 rounded-t-md animate-pulse"
                  style={{ height: `${height}%` }}
                />
                <div
                  className="w-1/2 md:w-8 bg-lavender-mist/20 rounded-t-md animate-pulse delay-75"
                  style={{ height: `${height * 0.7}%` }}
                />
              </div>
              <div className="h-3 w-8 md:w-12 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 w-full mt-4 relative pb-10">
          <div className="absolute inset-0 bottom-10 bg-gradient-to-t from-philosophy/10 to-transparent rounded-lg animate-pulse" />
          <div className="absolute inset-x-0 bottom-1/3 border-b-2 border-dashed border-lavender-mist/30 animate-pulse" />
          <div className="absolute inset-x-0 bottom-2/3 border-b-2 border-philosophy/20 animate-pulse delay-100" />
          <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 pb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
              <div
                key={i}
                className="h-3 w-6 md:w-8 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
