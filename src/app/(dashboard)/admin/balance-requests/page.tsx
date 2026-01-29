import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  BalanceRequestsTable,
  BalanceRequestsTableSkeleton,
  BalanceRequestSearchFilters,
} from '@/components/balance-requests'
import type { BalanceRequestListParams } from '@/lib/actions/balance-requests'
import type { BalanceRequestStatus } from '@/generated/prisma'

interface BalanceRequestsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function BalanceRequestsPage({ searchParams }: BalanceRequestsPageProps) {
  await requireAdmin()

  const params = await searchParams

  // Parse search params
  const search = params.search || ''
  const status = (params.status as 'all' | BalanceRequestStatus) || 'all'
  const sortBy = (params.sortBy as 'createdAt' | 'amount' | 'dealerName') || 'createdAt'
  const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc'
  const page = parseInt(params.page || '1', 10)

  const tableParams: BalanceRequestListParams = {
    search,
    status,
    sortBy,
    sortOrder,
    page,
    pageSize: 10,
  }

  // Create a unique key for Suspense based on params to trigger re-fetch
  const suspenseKey = JSON.stringify(tableParams)

  return (
    <>
      <PageHeader
        title="Balance Requests"
        description="Review and process dealer balance top-up requests"
      />

      <Card>
        <CardHeader className="pb-4">
          <BalanceRequestSearchFilters initialSearch={search} initialStatus={status} />
        </CardHeader>
        <CardContent>
          <Suspense key={suspenseKey} fallback={<BalanceRequestsTableSkeleton />}>
            <BalanceRequestsTable params={tableParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
