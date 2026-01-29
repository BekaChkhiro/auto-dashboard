import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { VehicleStatusBadge } from './vehicle-status-badge'
import { VehicleRowActions } from './vehicle-row-actions'
import { SortableHeader } from '@/components/dealers/sortable-header'
import { getVehicles, type VehicleListParams } from '@/lib/actions/vehicles'
import { formatDate } from '@/lib/formatting'

interface VehiclesTableProps {
  params: VehicleListParams
}

export async function VehiclesTable({ params }: VehiclesTableProps) {
  const { vehicles, totalCount, totalPages, currentPage } = await getVehicles(params)

  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  const pageSize = params.pageSize || 10

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No vehicles found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {params.search || params.statusId || params.dealerId || params.makeId || params.year
            ? 'Try adjusting your search or filter criteria'
            : params.showArchived
              ? 'No archived vehicles yet'
              : 'Add your first vehicle to get started'}
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
            <TableHead className="hidden md:table-cell">Dealer</TableHead>
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
                  href={`/admin/vehicles/${vehicle.id}`}
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
              <TableCell className="hidden md:table-cell">
                <Link
                  href={`/admin/dealers/${vehicle.dealer.id}`}
                  className="text-muted-foreground hover:underline"
                >
                  {vehicle.dealer.name}
                </Link>
              </TableCell>
              <TableCell>
                <VehicleStatusBadge status={vehicle.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {formatDate(vehicle.createdAt, 'en', 'short')}
              </TableCell>
              <TableCell>
                <VehicleRowActions
                  vehicleId={vehicle.id}
                  vehicleVin={vehicle.vin}
                  isArchived={vehicle.isArchived}
                />
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
