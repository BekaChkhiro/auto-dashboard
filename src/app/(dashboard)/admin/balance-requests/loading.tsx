import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BalanceRequestsTableSkeleton } from '@/components/balance-requests'

export default function BalanceRequestsLoading() {
  return (
    <>
      <PageHeader
        title="Balance Requests"
        description="Review and process dealer balance top-up requests"
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-full sm:w-[150px]" />
          </div>
        </CardHeader>
        <CardContent>
          <BalanceRequestsTableSkeleton />
        </CardContent>
      </Card>
    </>
  )
}
