'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, ArrowDownRight, Receipt, Settings } from 'lucide-react'
import {
  getDealerTransactions,
  type DealerTransactionListItem,
} from '@/lib/actions/balance-requests'
import type { TransactionType } from '@/generated/prisma'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function TransactionTypeBadge({ type }: { type: TransactionType }) {
  switch (type) {
    case 'DEPOSIT':
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <ArrowUpRight className="mr-1 h-3 w-3" />
          Deposit
        </Badge>
      )
    case 'WITHDRAWAL':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <ArrowDownRight className="mr-1 h-3 w-3" />
          Withdrawal
        </Badge>
      )
    case 'INVOICE_PAYMENT':
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Receipt className="mr-1 h-3 w-3" />
          Invoice Payment
        </Badge>
      )
    case 'ADJUSTMENT':
      return (
        <Badge variant="outline" className="text-purple-600 border-purple-600">
          <Settings className="mr-1 h-3 w-3" />
          Adjustment
        </Badge>
      )
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function getAmountColor(type: TransactionType): string {
  switch (type) {
    case 'DEPOSIT':
      return 'text-green-600'
    case 'WITHDRAWAL':
    case 'INVOICE_PAYMENT':
      return 'text-red-600'
    case 'ADJUSTMENT':
      return 'text-purple-600'
    default:
      return ''
  }
}

function getAmountPrefix(type: TransactionType): string {
  switch (type) {
    case 'DEPOSIT':
      return '+'
    case 'WITHDRAWAL':
    case 'INVOICE_PAYMENT':
      return '-'
    case 'ADJUSTMENT':
      return ''
    default:
      return ''
  }
}

interface TransactionsTableProps {
  type?: string
  page?: number
}

export function TransactionsTable({ type, page = 1 }: TransactionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [data, setData] = useState<{
    transactions: DealerTransactionListItem[]
    totalCount: number
    totalPages: number
    currentPage: number
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const result = await getDealerTransactions({
        type: type === 'all' || !type ? 'all' : (type as TransactionType),
        page,
        pageSize: 10,
      })
      setData(result)
    }
    fetchData()
  }, [type, page])

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'transactions')
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== 'page') {
      params.delete('page')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={type || 'all'}
          onValueChange={(value) => updateParams('type', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Transaction Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DEPOSIT">Deposits</SelectItem>
            <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
            <SelectItem value="INVOICE_PAYMENT">Invoice Payments</SelectItem>
            <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Balance After</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              data.transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <TransactionTypeBadge type={transaction.type} />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getAmountColor(transaction.type)}`}>
                    {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {formatCurrency(transaction.balanceAfter)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                    {transaction.description || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <Pagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={10}
        />
      )}
    </div>
  )
}
