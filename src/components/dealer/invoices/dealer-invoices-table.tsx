import Link from 'next/link'
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
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { getDealerInvoices, type DealerInvoiceListParams } from '@/lib/actions/dealer-invoices'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatting'
import { Eye } from 'lucide-react'

interface DealerInvoicesTableProps {
  params: DealerInvoiceListParams
}

export async function DealerInvoicesTable({ params }: DealerInvoicesTableProps) {
  const { invoices, totalCount, totalPages, currentPage } = await getDealerInvoices(params)

  const pageSize = params.pageSize || 10

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No invoices found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {params.status !== 'all'
            ? 'Try adjusting your filter criteria'
            : 'You have no invoices yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden md:table-cell">Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link
                  href={`/dealer/invoices/${invoice.id}`}
                  className="font-medium hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
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
              <TableCell>
                <div>
                  <p className="text-sm">{formatDate(invoice.createdAt, 'en', 'short')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(invoice.createdAt, 'en')}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dealer/invoices/${invoice.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
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
