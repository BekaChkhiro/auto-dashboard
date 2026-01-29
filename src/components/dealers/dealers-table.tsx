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
import { DealerStatusBadge } from './dealer-status-badge'
import { DealerRowActions } from './dealer-row-actions'
import { SortableHeader } from './sortable-header'
import { getDealers, type DealerListParams } from '@/lib/actions/dealers'
import { formatCurrency, formatDate } from '@/lib/formatting'

interface DealersTableProps {
  params: DealerListParams
}

export async function DealersTable({ params }: DealersTableProps) {
  const { dealers, totalCount, totalPages, currentPage } = await getDealers(params)

  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  const pageSize = params.pageSize || 10

  if (dealers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No dealers found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {params.search || params.status !== 'all'
            ? 'Try adjusting your search or filter criteria'
            : 'Add your first dealer to get started'}
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
                column="name"
                label="Name"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                column="email"
                label="Email"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="hidden md:table-cell">Phone</TableHead>
            <TableHead className="hidden lg:table-cell">Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">
              <SortableHeader
                column="balance"
                label="Balance"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="hidden lg:table-cell">Vehicles</TableHead>
            <TableHead className="hidden xl:table-cell">
              <SortableHeader
                column="createdAt"
                label="Joined"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dealers.map((dealer) => (
            <TableRow key={dealer.id}>
              <TableCell>
                <Link
                  href={`/admin/dealers/${dealer.id}`}
                  className="font-medium hover:underline"
                >
                  {dealer.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dealer.email}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {dealer.phone}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {dealer.companyName || '-'}
              </TableCell>
              <TableCell>
                <DealerStatusBadge status={dealer.status} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {formatCurrency(dealer.balance, 'en')}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {dealer.vehicleCount}
              </TableCell>
              <TableCell className="hidden xl:table-cell text-muted-foreground">
                {formatDate(dealer.createdAt, 'en', 'short')}
              </TableCell>
              <TableCell>
                <DealerRowActions
                  dealerId={dealer.id}
                  dealerName={dealer.name}
                  status={dealer.status}
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
