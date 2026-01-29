import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Car,
  CreditCard,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  UserPlus,
  CarFront,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import { getDashboardStats, getRecentActivity, type RecentActivity } from '@/lib/actions/admin-dashboard'
import { requireAdmin } from '@/lib/auth'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

function VehicleStatusSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-10" />
        </div>
      ))}
    </div>
  )
}

async function StatsCards() {
  const stats = await getDashboardStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeDealers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.blockedDealers > 0 && (
              <span className="text-destructive">{stats.blockedDealers} blocked</span>
            )}
            {stats.blockedDealers === 0 && 'Active dealer accounts'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeVehicles}</div>
          <p className="text-xs text-muted-foreground">
            {stats.archivedVehicles > 0 && (
              <span>{stats.archivedVehicles} archived</span>
            )}
            {stats.archivedVehicles === 0 && 'Vehicles in the system'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingBalanceRequests}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalPendingAmount > 0 ? (
              <span className="text-amber-600">
                {formatCurrency(stats.totalPendingAmount)} pending
              </span>
            ) : (
              'Balance requests awaiting approval'
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.invoicesThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingInvoices > 0 ? (
              <span className="text-amber-600">{stats.pendingInvoices} pending payment</span>
            ) : (
              'Invoices this month'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function VehiclesByStatus() {
  const stats = await getDashboardStats()

  if (stats.vehiclesByStatus.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No vehicles in the system yet
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {stats.vehiclesByStatus.map((status) => (
        <div key={status.statusId} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: status.statusColor || '#6b7280' }}
            />
            <span className="text-sm">{status.statusName}</span>
          </div>
          <Badge variant="secondary">{status.count}</Badge>
        </div>
      ))}
    </div>
  )
}

function getActivityIcon(type: RecentActivity['type']) {
  switch (type) {
    case 'vehicle_added':
      return <CarFront className="h-4 w-4" />
    case 'status_change':
      return <RefreshCw className="h-4 w-4" />
    case 'balance_request':
      return <CreditCard className="h-4 w-4" />
    case 'invoice_created':
      return <Receipt className="h-4 w-4" />
    case 'dealer_added':
      return <UserPlus className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function getActivityColor(type: RecentActivity['type']) {
  switch (type) {
    case 'vehicle_added':
      return 'bg-blue-100 text-blue-600'
    case 'status_change':
      return 'bg-purple-100 text-purple-600'
    case 'balance_request':
      return 'bg-amber-100 text-amber-600'
    case 'invoice_created':
      return 'bg-green-100 text-green-600'
    case 'dealer_added':
      return 'bg-indigo-100 text-indigo-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

async function RecentActivityList() {
  const activities = await getRecentActivity(8)

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No recent activity
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/admin/dealers/new">
          <UserPlus className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Add Dealer</div>
            <div className="text-xs text-muted-foreground">Register new dealer account</div>
          </div>
        </Link>
      </Button>
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/admin/vehicles/new">
          <Plus className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Add Vehicle</div>
            <div className="text-xs text-muted-foreground">Register new vehicle</div>
          </div>
        </Link>
      </Button>
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/admin/balance-requests">
          <CreditCard className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Balance Requests</div>
            <div className="text-xs text-muted-foreground">Review pending requests</div>
          </div>
        </Link>
      </Button>
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/admin/invoices/new">
          <FileText className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Create Invoice</div>
            <div className="text-xs text-muted-foreground">Generate new invoice</div>
          </div>
        </Link>
      </Button>
    </div>
  )
}

export default async function AdminDashboardPage() {
  await requireAdmin()

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your auto dealer platform"
      />

      {/* Stats Cards */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <StatsCards />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-4 mt-4 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/activity">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ActivitySkeleton />}>
              <RecentActivityList />
            </Suspense>
          </CardContent>
        </Card>

        {/* Vehicles by Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vehicles by Status</CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/vehicles">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<VehicleStatusSkeleton />}>
              <VehiclesByStatus />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <QuickActions />
        </CardContent>
      </Card>
    </>
  )
}
