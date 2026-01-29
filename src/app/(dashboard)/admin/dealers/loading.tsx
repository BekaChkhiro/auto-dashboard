import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DealersTableSkeleton } from '@/components/dealers'

export default function DealersLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <Card>
        <CardHeader className="pb-4">
          {/* Search and Filters Skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-full sm:w-[150px]" />
          </div>
        </CardHeader>
        <CardContent>
          <DealersTableSkeleton />
        </CardContent>
      </Card>
    </>
  )
}
