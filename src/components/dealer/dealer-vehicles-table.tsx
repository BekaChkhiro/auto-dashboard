import Link from 'next/link'
import { Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { VehicleStatusBadge } from '@/components/vehicles/vehicle-status-badge'
import { SortableHeader } from '@/components/dealers/sortable-header'
import { getDealerVehicles, type DealerVehicleListParams } from '@/lib/actions/dealer-dashboard'
import { formatDate } from '@/lib/formatting'

interface DealerVehiclesTableProps {
  params: DealerVehicleListParams
}

export async function DealerVehiclesTable({ params }: DealerVehiclesTableProps) {
  const { vehicles, totalCount, totalPages, currentPage } = await getDealerVehicles(params)

  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  const pageSize = params.pageSize || 10

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No vehicles found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {params.search || params.statusId || params.makeId || params.year
            ? 'Try adjusting your search or filter criteria'
            : params.showArchived
              ? 'No archived vehicles yet'
              : 'No vehicles have been added to your account yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader
                column="vin"
                label="VIN"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <SortableHeader
                column="lotNumber"
                label="Lot #"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                column="year"
                label="Vehicle"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">
              <SortableHeader
                column="createdAt"
                label="Added"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id} className={vehicle.isArchived ? 'opacity-60' : ''}>
              <TableCell>
                <Link
                  href={`/dealer/vehicles/${vehicle.id}`}
                  className="font-mono text-sm hover:underline"
                >
                  {vehicle.vin}
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {vehicle.lotNumber}
              </TableCell>
              <TableCell>
                <div>
                  <span className="font-medium">
                    {vehicle.year} {vehicle.make.name}
                  </span>
                  <span className="text-muted-foreground ml-1">{vehicle.model.name}</span>
                </div>
                {vehicle.color && (
                  <span className="text-sm text-muted-foreground">{vehicle.color}</span>
                )}
              </TableCell>
              <TableCell>
                <VehicleStatusBadge status={vehicle.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {formatDate(vehicle.createdAt, 'en', 'short')}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dealer/vehicles/${vehicle.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View vehicle details</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  )
}
