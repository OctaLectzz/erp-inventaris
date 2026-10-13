import { Skeleton } from '@/components/ui/skeleton'

export default function MovementsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-7 w-40 rounded-full" />
      </div>

      {/* Control Bar Skeleton */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Table Skeleton */}
      <div className="border-border space-y-3 rounded-lg border p-4">
        <div className="border-border flex items-center justify-between border-b pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-border/50 flex items-center justify-between border-b py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  )
}
