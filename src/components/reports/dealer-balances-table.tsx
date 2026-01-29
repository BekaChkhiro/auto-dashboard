import Link from 'next/link'
import type { DealerBalanceSummary } from '@/lib/actions/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface DealerBalancesTableProps {
  dealers: DealerBalanceSummary[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function DealerBalancesTable({ dealers }: DealerBalancesTableProps) {
  if (dealers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No dealers found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dealer</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-center">Vehicles</TableHead>
            <TableHead className="text-center">Pending Invoices</TableHead>
            <TableHead className="text-right">Pending Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dealers.map((dealer) => (
            <TableRow key={dealer.id}>
              <TableCell>
                <Link
                  href={`/admin/dealers/${dealer.id}/edit`}
                  className="hover:underline"
                >
                  <div>
                    <div className="font-medium">{dealer.name}</div>
                    {dealer.companyName && (
                      <div className="text-sm text-muted-foreground">
                        {dealer.companyName}
                      </div>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                <span
                  className={
                    dealer.balance > 0
                      ? 'text-green-600'
                      : dealer.balance < 0
                        ? 'text-red-600'
                        : ''
                  }
                >
                  {formatCurrency(dealer.balance)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{dealer.vehicleCount}</Badge>
              </TableCell>
              <TableCell className="text-center">
                {dealer.pendingInvoicesCount > 0 ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {dealer.pendingInvoicesCount}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {dealer.totalPendingAmount > 0 ? (
                  <span className="text-amber-600">
                    {formatCurrency(dealer.totalPendingAmount)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
