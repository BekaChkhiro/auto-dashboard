import { Suspense } from 'react'
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { requireAdmin } from '@/lib/auth'
import {
  getReportsSummary,
  getDealerBalancesSummary,
  getVehicleStatusDistribution,
  getMonthlyTrends,
  type DateRange,
} from '@/lib/actions/reports'
import { ReportsFilters } from '@/components/reports/reports-filters'
import { ReportsSummaryCards } from '@/components/reports/reports-summary-cards'
import { VehicleStatusChart } from '@/components/reports/vehicle-status-chart'
import { MonthlyTrendsChart, RevenueChart } from '@/components/reports/monthly-trends-chart'
import { DealerBalancesTable } from '@/components/reports/dealer-balances-table'
import { ExportDropdown } from '@/components/reports/export-dropdown'

interface PageProps {
  searchParams: Promise<{
    from?: string
    to?: string
    preset?: string
  }>
}

function getDateRange(
  from: string | undefined,
  to: string | undefined,
  preset: string | undefined
): DateRange {
  // Handle presets
  if (preset) {
    const now = new Date()
    switch (preset) {
      case '7d':
        return { from: subDays(now, 7), to: now }
      case '30d':
        return { from: subDays(now, 30), to: now }
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) }
      case '3m':
        return { from: subMonths(now, 3), to: now }
      case '6m':
        return { from: subMonths(now, 6), to: now }
    }
  }

  // Handle custom dates
  if (from && to) {
    return {
      from: new Date(from),
      to: new Date(to),
    }
  }

  // Default to last 30 days
  return {
    from: subDays(new Date(), 30),
    to: new Date(),
  }
}

// Skeleton components
function SummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      <Skeleton className="h-[250px] w-full" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

// Async data components
async function SummaryCardsSection({ dateRange }: { dateRange: DateRange }) {
  const summary = await getReportsSummary(dateRange)
  return <ReportsSummaryCards summary={summary} />
}

async function VehicleStatusSection() {
  const statusDistribution = await getVehicleStatusDistribution()
  return <VehicleStatusChart data={statusDistribution} />
}

async function MonthlyTrendsSection({ dateRange }: { dateRange: DateRange }) {
  const trends = await getMonthlyTrends(dateRange)
  return <MonthlyTrendsChart data={trends} />
}

async function RevenueSection({ dateRange }: { dateRange: DateRange }) {
  const trends = await getMonthlyTrends(dateRange)
  return <RevenueChart data={trends} />
}

async function DealerBalancesSection({ dateRange }: { dateRange: DateRange }) {
  const dealers = await getDealerBalancesSummary(dateRange)
  return <DealerBalancesTable dealers={dealers} />
}

export default async function ReportsPage({ searchParams }: PageProps) {
  await requireAdmin()

  const params = await searchParams
  const dateRange = getDateRange(params.from, params.to, params.preset)
  const suspenseKey = JSON.stringify({ from: params.from, to: params.to, preset: params.preset })

  return (
    <>
      <PageHeader
        title="Reports"
        description="Analytics and insights for your auto dealer platform"
        actions={
          <ExportDropdown
            dateFrom={params.from}
            dateTo={params.to}
          />
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <ReportsFilters
            initialFrom={params.from}
            initialTo={params.to}
            initialPreset={params.preset || '30d'}
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Suspense key={`summary-${suspenseKey}`} fallback={<SummaryCardsSkeleton />}>
        <SummaryCardsSection dateRange={dateRange} />
      </Suspense>

      {/* Charts Row */}
      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        {/* Vehicle Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status Distribution</CardTitle>
            <CardDescription>Current breakdown of vehicles by status</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <VehicleStatusSection />
            </Suspense>
          </CardContent>
        </Card>

        {/* Monthly Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends</CardTitle>
            <CardDescription>Monthly activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense key={`trends-${suspenseKey}`} fallback={<ChartSkeleton />}>
              <MonthlyTrendsSection dateRange={dateRange} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue from paid invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense key={`revenue-${suspenseKey}`} fallback={<ChartSkeleton />}>
            <RevenueSection dateRange={dateRange} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Dealer Balances Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dealer Balances</CardTitle>
          <CardDescription>Overview of all dealer accounts and their financial status</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense key={`dealers-${suspenseKey}`} fallback={<TableSkeleton />}>
            <DealerBalancesSection dateRange={dateRange} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
