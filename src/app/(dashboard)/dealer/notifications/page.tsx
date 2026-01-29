import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, RefreshCw, CreditCard, FileText } from 'lucide-react'
import { requireDealer } from '@/lib/auth'
import {
  getDealerNotifications,
  getDealerNotificationStats,
} from '@/lib/actions/dealer-notifications'
import {
  NotificationsTable,
  NotificationsTableSkeleton,
  NotificationFilters,
} from '@/components/dealer/notifications'
import type { NotificationType } from '@/generated/prisma'

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
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

async function NotificationStats() {
  const stats = await getDealerNotificationStats()

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unread</CardTitle>
          <Bell className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.unreadCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.unreadCount === 0 ? 'All caught up!' : 'Requires attention'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Updates</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byType.STATUS_CHANGE}</div>
          <p className="text-xs text-muted-foreground">Vehicle status changes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byType.BALANCE}</div>
          <p className="text-xs text-muted-foreground">Balance updates</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byType.INVOICE}</div>
          <p className="text-xs text-muted-foreground">Invoice notifications</p>
        </CardContent>
      </Card>
    </div>
  )
}

interface NotificationsTableWrapperProps {
  type: NotificationType | 'all'
  status: 'all' | 'read' | 'unread'
  page: number
}

async function NotificationsTableWrapper({ type, status, page }: NotificationsTableWrapperProps) {
  const { notifications, totalCount, totalPages, currentPage } = await getDealerNotifications({
    type,
    status,
    page,
    pageSize: 10,
  })

  return (
    <NotificationsTable
      notifications={notifications}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={10}
    />
  )
}

async function NotificationFiltersWrapper({
  type,
  status,
}: {
  type: NotificationType | 'all'
  status: 'all' | 'read' | 'unread'
}) {
  const stats = await getDealerNotificationStats()

  return (
    <NotificationFilters
      currentType={type}
      currentStatus={status}
      unreadCount={stats.unreadCount}
    />
  )
}

interface DealerNotificationsPageProps {
  searchParams: Promise<{
    type?: string
    status?: string
    page?: string
  }>
}

export default async function DealerNotificationsPage({
  searchParams,
}: DealerNotificationsPageProps) {
  await requireDealer()
  const params = await searchParams

  const type = (params.type || 'all') as NotificationType | 'all'
  const status = (params.status || 'all') as 'all' | 'read' | 'unread'
  const page = params.page ? parseInt(params.page) : 1

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay updated with your vehicle status changes, balance updates, and invoices"
      />

      {/* Stats Cards */}
      <Suspense fallback={<StatsSkeleton />}>
        <NotificationStats />
      </Suspense>

      {/* Notifications List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-[140px]" />
                  <Skeleton className="h-10 w-[140px]" />
                </div>
                <NotificationsTableSkeleton />
              </div>
            }
          >
            <div className="space-y-4">
              <NotificationFiltersWrapper type={type} status={status} />
              <NotificationsTableWrapper type={type} status={status} page={page} />
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </>
  )
}
