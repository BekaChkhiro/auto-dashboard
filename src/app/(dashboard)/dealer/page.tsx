import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Car,
  Wallet,
  FileText,
  Bell,
  ArrowRight,
  RefreshCw,
  CreditCard,
  Plus,
} from 'lucide-react'
import {
  getDealerDashboardStats,
  getDealerRecentNotifications,
  type DealerNotification,
} from '@/lib/actions/dealer-dashboard'
import { requireDealer } from '@/lib/auth'

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

function NotificationsSkeleton() {
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
  const stats = await getDealerDashboardStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeVehicles}</div>
          <p className="text-xs text-muted-foreground">
            {stats.archivedVehicles > 0 ? (
              <span>{stats.archivedVehicles} archived</span>
            ) : (
              'Vehicles in your inventory'
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.currentBalance)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingBalanceRequests > 0 ? (
              <span className="text-amber-600">
                {stats.pendingBalanceRequests} pending request{stats.pendingBalanceRequests > 1 ? 's' : ''}
              </span>
            ) : (
              'Current account balance'
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingInvoiceAmount > 0 ? (
              <span className="text-amber-600">
                {formatCurrency(stats.pendingInvoiceAmount)} due
              </span>
            ) : (
              'Awaiting payment'
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Notifications</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
          <p className="text-xs text-muted-foreground">
            {stats.unreadNotifications > 0 ? (
              <span className="text-blue-600">Unread notifications</span>
            ) : (
              'All caught up'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function VehiclesByStatus() {
  const stats = await getDealerDashboardStats()

  // Filter to only show statuses with vehicles
  const statusesWithVehicles = stats.vehiclesByStatus.filter((s) => s.count > 0)

  if (statusesWithVehicles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No vehicles in your inventory yet
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

function getNotificationIcon(type: DealerNotification['type']) {
  switch (type) {
    case 'STATUS_CHANGE':
      return <RefreshCw className="h-4 w-4" />
    case 'BALANCE':
      return <CreditCard className="h-4 w-4" />
    case 'INVOICE':
      return <FileText className="h-4 w-4" />
    case 'SYSTEM':
      return <Bell className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function getNotificationColor(type: DealerNotification['type']) {
  switch (type) {
    case 'STATUS_CHANGE':
      return 'bg-purple-100 text-purple-600'
    case 'BALANCE':
      return 'bg-green-100 text-green-600'
    case 'INVOICE':
      return 'bg-amber-100 text-amber-600'
    case 'SYSTEM':
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

async function RecentNotificationsList() {
  const notifications = await getDealerRecentNotifications(8)

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No notifications yet
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div key={notification.id} className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{notification.title}</p>
              {!notification.isRead && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/dealer/vehicles">
          <Car className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">My Vehicles</div>
            <div className="text-xs text-muted-foreground">View your inventory</div>
          </div>
        </Link>
      </Button>
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/dealer/balance">
          <Plus className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Request Balance</div>
            <div className="text-xs text-muted-foreground">Add funds to account</div>
          </div>
        </Link>
      </Button>
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/dealer/invoices">
          <FileText className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">My Invoices</div>
            <div className="text-xs text-muted-foreground">View and pay invoices</div>
          </div>
        </Link>
      </Button>
      <Button asChild variant="outline" className="justify-start h-auto py-3">
        <Link href="/dealer/notifications">
          <Bell className="mr-2 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Notifications</div>
            <div className="text-xs text-muted-foreground">View all updates</div>
          </div>
        </Link>
      </Button>
    </div>
  )
}

export default async function DealerDashboardPage() {
  await requireDealer()

  return (
    <>
      <PageHeader
        title="Dealer Dashboard"
        description="Your vehicle inventory and account overview"
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
        {/* Recent Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Latest updates on your vehicles and account</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dealer/notifications">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<NotificationsSkeleton />}>
              <RecentNotificationsList />
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
              <Link href="/dealer/vehicles">
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
