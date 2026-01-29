import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { VehiclesTableSkeleton } from '@/components/vehicles'

export default function VehiclesLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader className="pb-4">
          {/* Filters Skeleton */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Skeleton className="h-9 w-full max-w-sm" />
              <Skeleton className="h-9 w-full sm:w-[150px]" />
              <Skeleton className="h-9 w-full sm:w-[150px]" />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Skeleton className="h-9 w-full sm:w-[150px]" />
              <Skeleton className="h-9 w-full sm:w-[120px]" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VehiclesTableSkeleton />
        </CardContent>
      </Card>
    </>
  )
}
