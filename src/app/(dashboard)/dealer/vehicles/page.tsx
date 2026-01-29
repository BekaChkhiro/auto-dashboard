import { Suspense } from 'react'
import { requireDealer } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DealerVehiclesTable,
  DealerVehiclesTableSkeleton,
  DealerVehicleFilters,
} from '@/components/dealer'
import {
  getDealerVehicleFilterOptions,
  type DealerVehicleListParams,
} from '@/lib/actions/dealer-dashboard'

interface DealerVehiclesPageProps {
  searchParams: Promise<{
    search?: string
    statusId?: string
    makeId?: string
    year?: string
    showArchived?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function DealerVehiclesPage({ searchParams }: DealerVehiclesPageProps) {
  await requireDealer()

  const params = await searchParams

  // Parse search params
  const search = params.search || ''
  const statusId = params.statusId || ''
  const makeId = params.makeId || ''
  const year = params.year || ''
  const showArchived = params.showArchived === 'true'
  const sortBy = (params.sortBy as 'createdAt' | 'year' | 'vin' | 'lotNumber') || 'createdAt'
  const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc'
  const page = parseInt(params.page || '1', 10)

  const tableParams: DealerVehicleListParams = {
    search,
    statusId: statusId || undefined,
    makeId: makeId || undefined,
    year: year || undefined,
    showArchived,
    sortBy,
    sortOrder,
    page,
    pageSize: 10,
  }

  // Get filter options scoped to dealer's vehicles
  const filterOptions = await getDealerVehicleFilterOptions()

  // Create a unique key for Suspense based on params to trigger re-fetch
  const suspenseKey = JSON.stringify(tableParams)

  return (
    <>
      <PageHeader
        title="My Vehicles"
        description="View and track your vehicles' transportation status"
      />

      <Card>
        <CardHeader className="pb-4">
          <DealerVehicleFilters
            initialSearch={search}
            initialStatusId={statusId}
            initialMakeId={makeId}
            initialYear={year}
            initialShowArchived={showArchived}
            filterOptions={filterOptions}
          />
        </CardHeader>
        <CardContent>
          <Suspense key={suspenseKey} fallback={<DealerVehiclesTableSkeleton />}>
            <DealerVehiclesTable params={tableParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
