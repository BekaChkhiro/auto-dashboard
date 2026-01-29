import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { requireDealer } from '@/lib/auth'
import { getDealerBalanceOverview } from '@/lib/actions/balance-requests'
import { BalanceRequestForm } from '@/components/dealer/balance/balance-request-form'
import { BalanceRequestsTable } from '@/components/dealer/balance/balance-requests-table'
import { TransactionsTable } from '@/components/dealer/balance/transactions-table'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function BalanceOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function BalanceOverview() {
  const overview = await getDealerBalanceOverview()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${overview.currentBalance < 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(overview.currentBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Available for payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.pendingRequestsCount}</div>
          <p className="text-xs text-muted-foreground">
            {overview.pendingRequestsTotal > 0 ? (
              <span className="text-amber-600">
                {formatCurrency(overview.pendingRequestsTotal)} awaiting approval
              </span>
            ) : (
              'No pending requests'
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(overview.totalDeposits)}
          </div>
          <p className="text-xs text-muted-foreground">
            All time deposits
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(overview.totalWithdrawals)}
          </div>
          <p className="text-xs text-muted-foreground">
            Invoice payments & withdrawals
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface DealerBalancePageProps {
  searchParams: Promise<{
    tab?: string
    status?: string
    type?: string
    page?: string
  }>
}

export default async function DealerBalancePage({ searchParams }: DealerBalancePageProps) {
  await requireDealer()
  const params = await searchParams

  const activeTab = params.tab || 'overview'

  return (
    <>
      <PageHeader
        title="Balance Management"
        description="View your balance, request top-ups, and track transactions"
      />

      {/* Balance Overview Cards */}
      <Suspense fallback={<BalanceOverviewSkeleton />}>
        <BalanceOverview />
      </Suspense>

      {/* Tabs Section */}
      <Card className="mt-6">
        <Tabs defaultValue={activeTab} className="w-full">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="overview">Request Top-up</TabsTrigger>
              <TabsTrigger value="requests">My Requests</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Request Balance Top-up</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a request to add funds to your account. Upload your payment receipt for verification.
                  </p>
                </div>
                <BalanceRequestForm />
              </div>
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Balance Request History</h3>
                  <p className="text-sm text-muted-foreground">
                    View the status of your balance top-up requests.
                  </p>
                </div>
                <Suspense fallback={<TableSkeleton />}>
                  <BalanceRequestsTable
                    status={params.status}
                    page={params.page ? parseInt(params.page) : 1}
                  />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Transaction History</h3>
                  <p className="text-sm text-muted-foreground">
                    View all deposits, withdrawals, and invoice payments.
                  </p>
                </div>
                <Suspense fallback={<TableSkeleton />}>
                  <TransactionsTable
                    type={params.type}
                    page={params.page ? parseInt(params.page) : 1}
                  />
                </Suspense>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
