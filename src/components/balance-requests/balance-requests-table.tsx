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
import { BalanceRequestStatusBadge } from './balance-request-status-badge'
import { BalanceRequestRowActions } from './balance-request-row-actions'
import { SortableHeader } from './sortable-header'
import { getBalanceRequests, type BalanceRequestListParams } from '@/lib/actions/balance-requests'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatting'

interface BalanceRequestsTableProps {
  params: BalanceRequestListParams
}

export async function BalanceRequestsTable({ params }: BalanceRequestsTableProps) {
  const { requests, totalCount, totalPages, currentPage } = await getBalanceRequests(params)

  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  const pageSize = params.pageSize || 10

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No balance requests found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {params.search || params.status !== 'all'
            ? 'Try adjusting your search or filter criteria'
            : 'Balance requests will appear here when dealers submit them'}
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
                column="dealerName"
                label="Dealer"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                column="amount"
                label="Amount"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Comment</TableHead>
            <TableHead className="hidden lg:table-cell">Processed By</TableHead>
            <TableHead>
              <SortableHeader
                column="createdAt"
                label="Submitted"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <Link
                    href={`/admin/dealers/${request.dealer.id}`}
                    className="font-medium hover:underline"
                  >
                    {request.dealer.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {request.dealer.email}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(request.amount, 'en')}
              </TableCell>
              <TableCell>
                <BalanceRequestStatusBadge status={request.status} />
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px]">
                <p className="text-sm text-muted-foreground truncate">
                  {request.comment || '-'}
                </p>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {request.processedBy ? (
                  <div>
                    <p className="text-sm">{request.processedBy.name}</p>
                    {request.processedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(request.processedAt, 'en', 'short')}
                      </p>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{formatDate(request.createdAt, 'en', 'short')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(request.createdAt, 'en')}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <BalanceRequestRowActions
                  requestId={request.id}
                  dealerName={request.dealer.name}
                  amount={request.amount}
                  status={request.status}
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
