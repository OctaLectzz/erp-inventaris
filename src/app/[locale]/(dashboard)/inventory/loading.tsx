import { Card, CardContent } from '@/components/ui/card'

export default function InventoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-md bg-muted" />
          <div className="h-4 w-96 rounded-md bg-muted/70" />
        </div>
        <div className="h-7 w-32 rounded-full bg-muted" />
      </div>

      {/* Control Bar Skeleton */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="h-9 w-full max-w-md rounded-md bg-muted" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-32 rounded-md bg-muted" />
              <div className="h-9 w-32 rounded-md bg-muted" />
              <div className="h-9 w-28 rounded-md bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card className="border-border">
        <div className="space-y-3 p-5">
          <div className="h-10 w-full rounded-md bg-muted" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-md bg-muted/50" />
          ))}
        </div>
      </Card>
    </div>
  )
}
