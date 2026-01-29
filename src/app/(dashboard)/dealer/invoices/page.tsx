import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Clock, CheckCircle } from 'lucide-react'
import { requireDealer } from '@/lib/auth'
import { getDealerInvoiceStats } from '@/lib/actions/dealer-invoices'
import {
  DealerInvoicesTable,
  DealerInvoicesTableSkeleton,
  DealerInvoiceFilters,
} from '@/components/dealer/invoices'
import type { InvoiceStatus } from '@/generated/prisma'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function InvoiceStats() {
  const stats = await getDealerInvoiceStats()

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingCount + stats.paidCount}</div>
          <p className="text-xs text-muted-foreground">
            All time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingTotal > 0 ? (
              <span className="text-amber-600">{formatCurrency(stats.pendingTotal)} to pay</span>
            ) : (
              'No pending invoices'
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.paidCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.paidTotal > 0 ? formatCurrency(stats.paidTotal) + ' total paid' : 'No paid invoices'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface DealerInvoicesPageProps {
  searchParams: Promise<{
    status?: string
    page?: string
  }>
}

export default async function DealerInvoicesPage({ searchParams }: DealerInvoicesPageProps) {
  await requireDealer()
  const params = await searchParams

  const status = (params.status || 'all') as 'all' | InvoiceStatus
  const page = params.page ? parseInt(params.page) : 1

  return (
    <>
      <PageHeader
        title="Invoices"
        description="View and pay your invoices"
      />

      {/* Stats Cards */}
      <Suspense fallback={<StatsSkeleton />}>
        <InvoiceStats />
      </Suspense>

      {/* Invoices List */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Your Invoices</CardTitle>
            <DealerInvoiceFilters currentStatus={status} />
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DealerInvoicesTableSkeleton />}>
            <DealerInvoicesTable params={{ status, page }} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
