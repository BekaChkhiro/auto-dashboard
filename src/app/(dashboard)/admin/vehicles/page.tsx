import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VehiclesTable, VehiclesTableSkeleton, VehicleSearchFilters } from '@/components/vehicles'
import { getVehicleFilterOptions, type VehicleListParams } from '@/lib/actions/vehicles'

interface VehiclesPageProps {
  searchParams: Promise<{
    search?: string
    statusId?: string
    dealerId?: string
    makeId?: string
    year?: string
    portId?: string
    showArchived?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  await requireAdmin()

  const params = await searchParams

  // Parse search params
  const search = params.search || ''
  const statusId = params.statusId || ''
  const dealerId = params.dealerId || ''
  const makeId = params.makeId || ''
  const year = params.year || ''
  const portId = params.portId || ''
  const showArchived = params.showArchived === 'true'
  const sortBy = (params.sortBy as 'createdAt' | 'year' | 'vin' | 'lotNumber') || 'createdAt'
  const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc'
  const page = parseInt(params.page || '1', 10)

  const tableParams: VehicleListParams = {
    search,
    statusId: statusId || undefined,
    dealerId: dealerId || undefined,
    makeId: makeId || undefined,
    year: year || undefined,
    portId: portId || undefined,
    showArchived,
    sortBy,
    sortOrder,
    page,
    pageSize: 10,
  }

  // Get filter options
  const filterOptions = await getVehicleFilterOptions()

  // Create a unique key for Suspense based on params to trigger re-fetch
  const suspenseKey = JSON.stringify(tableParams)

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Manage vehicles and track their transportation status"
        actions={
          <Button asChild>
            <Link href="/admin/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <VehicleSearchFilters
            initialSearch={search}
            initialStatusId={statusId}
            initialDealerId={dealerId}
            initialMakeId={makeId}
            initialYear={year}
            initialShowArchived={showArchived}
            filterOptions={filterOptions}
          />
        </CardHeader>
        <CardContent>
          <Suspense key={suspenseKey} fallback={<VehiclesTableSkeleton />}>
            <VehiclesTable params={tableParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
