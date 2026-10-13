import { Card, CardContent } from '@/components/ui/card'

export default function InventoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-64 rounded-md" />
          <div className="bg-muted/70 h-4 w-96 rounded-md" />
        </div>
        <div className="bg-muted h-7 w-32 rounded-full" />
      </div>

      {/* Control Bar Skeleton */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="bg-muted h-9 w-full max-w-md rounded-md" />
            <div className="flex items-center gap-2">
              <div className="bg-muted h-9 w-32 rounded-md" />
              <div className="bg-muted h-9 w-32 rounded-md" />
              <div className="bg-muted h-9 w-28 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card className="border-border">
        <div className="space-y-3 p-5">
          <div className="bg-muted h-10 w-full rounded-md" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted/50 h-12 w-full rounded-md" />
          ))}
        </div>
      </Card>
    </div>
  )
}
