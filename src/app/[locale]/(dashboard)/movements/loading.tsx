import { Card, CardContent } from '@/components/ui/card'

export default function MovementsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-64 rounded" />
          <div className="bg-muted/60 h-4 w-96 rounded" />
        </div>
        <div className="bg-muted/50 h-8 w-36 rounded-full" />
      </div>

      {/* Filter Card Skeleton */}
      <Card className="border-border">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="bg-muted/60 h-9 flex-1 rounded" />
            <div className="flex gap-2">
              <div className="bg-muted/60 h-9 w-28 rounded" />
              <div className="bg-muted/60 h-9 w-36 rounded" />
              <div className="bg-muted/60 h-9 w-36 rounded" />
              <div className="bg-muted/60 h-9 w-32 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card className="border-border">
        <div className="space-y-3 p-4">
          <div className="bg-muted/50 h-8 w-full rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted/30 h-12 w-full rounded" />
          ))}
        </div>
      </Card>
    </div>
  )
}
