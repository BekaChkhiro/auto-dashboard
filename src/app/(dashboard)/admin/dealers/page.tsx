import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DealersTable, DealersTableSkeleton, DealerSearchFilters } from '@/components/dealers'
import type { DealerListParams } from '@/lib/actions/dealers'

interface DealersPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function DealersPage({ searchParams }: DealersPageProps) {
  await requireAdmin()

  const params = await searchParams

  // Parse search params
  const search = params.search || ''
  const status = (params.status as 'all' | 'ACTIVE' | 'BLOCKED') || 'all'
  const sortBy = (params.sortBy as 'name' | 'email' | 'createdAt' | 'balance') || 'createdAt'
  const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc'
  const page = parseInt(params.page || '1', 10)

  const tableParams: DealerListParams = {
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
        title="Dealers"
        description="Manage dealer accounts and their information"
        actions={
          <Button asChild>
            <Link href="/admin/dealers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Dealer
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <DealerSearchFilters initialSearch={search} initialStatus={status} />
        </CardHeader>
        <CardContent>
          <Suspense key={suspenseKey} fallback={<DealersTableSkeleton />}>
            <DealersTable params={tableParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
