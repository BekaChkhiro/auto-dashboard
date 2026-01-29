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
import { InvoiceStatusBadge } from './invoice-status-badge'
import { InvoiceRowActions } from './invoice-row-actions'
import { SortableHeader } from './sortable-header'
import { getInvoices, type InvoiceListParams } from '@/lib/actions/invoices'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatting'

interface InvoicesTableProps {
  params: InvoiceListParams
}

export async function InvoicesTable({ params }: InvoicesTableProps) {
  const { invoices, totalCount, totalPages, currentPage } = await getInvoices(params)

  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  const pageSize = params.pageSize || 10

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No invoices found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {params.search || params.status !== 'all'
            ? 'Try adjusting your search or filter criteria'
            : 'Create your first invoice to get started'}
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
                column="invoiceNumber"
                label="Invoice #"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
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
                column="totalAmount"
                label="Amount"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="hidden md:table-cell">Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Paid</TableHead>
            <TableHead>
              <SortableHeader
                column="createdAt"
                label="Created"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link
                  href={`/admin/invoices/${invoice.id}`}
                  className="font-medium hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <Link
                    href={`/admin/dealers/${invoice.dealer.id}`}
                    className="font-medium hover:underline"
                  >
                    {invoice.dealer.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {invoice.dealer.email}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(invoice.totalAmount, 'en')}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {invoice.itemCount} vehicle{invoice.itemCount !== 1 ? 's' : ''}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {invoice.paidAt ? (
                  <div>
                    <p className="text-sm">{formatDate(invoice.paidAt, 'en', 'short')}</p>
                    <p className="text-xs">
                      {invoice.paidFromBalance ? 'From balance' : 'External'}
                    </p>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{formatDate(invoice.createdAt, 'en', 'short')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(invoice.createdAt, 'en')}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <InvoiceRowActions
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                  totalAmount={invoice.totalAmount}
                  dealerName={invoice.dealer.name}
                  status={invoice.status}
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
