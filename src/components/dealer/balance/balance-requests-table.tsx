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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Clock, CheckCircle, XCircle } from 'lucide-react'
import {
  getDealerBalanceRequests,
  type DealerBalanceRequestListItem,
} from '@/lib/actions/balance-requests'
import type { BalanceRequestStatus } from '@/generated/prisma'
import Image from 'next/image'

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

function StatusBadge({ status }: { status: BalanceRequestStatus }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-600">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    case 'APPROVED':
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function RequestDetailDialog({ request }: { request: DealerBalanceRequestListItem }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">{formatCurrency(request.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={request.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-sm">{formatDate(request.createdAt)}</p>
            </div>
            {request.processedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-sm">{formatDate(request.processedAt)}</p>
              </div>
            )}
          </div>

          {request.comment && (
            <div>
              <p className="text-sm text-muted-foreground">Your Comment</p>
              <p className="text-sm">{request.comment}</p>
            </div>
          )}

          {request.adminComment && (
            <div>
              <p className="text-sm text-muted-foreground">Admin Response</p>
              <p className="text-sm">{request.adminComment}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">Receipt</p>
            <div className="relative aspect-[4/3] w-full rounded-md overflow-hidden bg-muted">
              <Image
                src={request.receiptUrl}
                alt="Receipt"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface BalanceRequestsTableProps {
  status?: string
  page?: number
}

export function BalanceRequestsTable({ status, page = 1 }: BalanceRequestsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [data, setData] = useState<{
    requests: DealerBalanceRequestListItem[]
    totalCount: number
    totalPages: number
    currentPage: number
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const result = await getDealerBalanceRequests({
        status: status === 'all' || !status ? 'all' : (status as BalanceRequestStatus),
        page,
        pageSize: 10,
      })
      setData(result)
    }
    fetchData()
  }, [status, page])

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'requests')
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
          value={status || 'all'}
          onValueChange={(value) => updateParams('status', value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Comment</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No balance requests found.
                </TableCell>
              </TableRow>
            ) : (
              data.requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {formatDate(request.createdAt)}
                  </TableCell>
                  <TableCell>{formatCurrency(request.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {request.comment || '-'}
                  </TableCell>
                  <TableCell>
                    <RequestDetailDialog request={request} />
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
