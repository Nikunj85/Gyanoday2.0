export default function RegisterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Email Skeleton */}
        <div className="lg:col-span-1">
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl"></div>
        </div>
        {/* Password Skeleton */}
        <div className="lg:col-span-1">
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl"></div>
        </div>
        {/* Name Skeleton */}
        <div className="lg:col-span-2">
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl"></div>
        </div>
        {/* Phone Skeleton */}
        <div>
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl"></div>
        </div>
        {/* Language Skeleton */}
        <div>
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl"></div>
        </div>
        {/* Class Skeleton */}
        <div>
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl"></div>
        </div>
        {/* School Skeleton */}
        <div className="lg:col-span-3">
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl"></div>
        </div>
      </div>
      {/* Button Skeleton */}
      <div className="flex justify-center mt-6">
        <div className="h-12 w-full lg:max-w-md bg-primary/30 rounded-xl"></div>
      </div>
    </div>
  )
}
