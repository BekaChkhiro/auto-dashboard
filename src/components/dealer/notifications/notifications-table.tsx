'use client'

import { useState, useTransition } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/formatting'
import {
  Bell,
  RefreshCw,
  CreditCard,
  FileText,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import type { DealerNotification } from '@/lib/actions/dealer-notifications'
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  deleteNotification,
} from '@/lib/actions/dealer-notifications'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface NotificationsTableProps {
  notifications: DealerNotification[]
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
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
  }
}

function getNotificationTypeLabel(type: DealerNotification['type']) {
  switch (type) {
    case 'STATUS_CHANGE':
      return 'Status'
    case 'BALANCE':
      return 'Balance'
    case 'INVOICE':
      return 'Invoice'
    case 'SYSTEM':
      return 'System'
  }
}

function getNotificationTypeColor(type: DealerNotification['type']) {
  switch (type) {
    case 'STATUS_CHANGE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'BALANCE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'INVOICE':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'SYSTEM':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

function getReferenceLink(notification: DealerNotification): string | null {
  if (!notification.referenceType || !notification.referenceId) {
    return null
  }

  switch (notification.referenceType) {
    case 'Vehicle':
      return `/dealer/vehicles/${notification.referenceId}`
    case 'Invoice':
      return `/dealer/invoices/${notification.referenceId}`
    case 'BalanceRequest':
      return '/dealer/balance'
    default:
      return null
  }
}

export function NotificationsTable({
  notifications,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
}: NotificationsTableProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleMarkAsRead = (id: string) => {
    setProcessingId(id)
    startTransition(async () => {
      const result = await markNotificationAsRead(id)
      if (result.success) {
        toast({
          title: 'Notification marked as read',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
      setProcessingId(null)
    })
  }

  const handleMarkAsUnread = (id: string) => {
    setProcessingId(id)
    startTransition(async () => {
      const result = await markNotificationAsUnread(id)
      if (result.success) {
        toast({
          title: 'Notification marked as unread',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
      setProcessingId(null)
    })
  }

  const handleDelete = (id: string) => {
    setProcessingId(id)
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (result.success) {
        toast({
          title: 'Notification deleted',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
      setProcessingId(null)
    })
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">No notifications</p>
        <p className="text-sm text-muted-foreground mt-1">
          You&apos;re all caught up!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Type</TableHead>
            <TableHead>Notification</TableHead>
            <TableHead className="w-[120px]">Time</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => {
            const referenceLink = getReferenceLink(notification)
            const isProcessing = processingId === notification.id && isPending

            return (
              <TableRow
                key={notification.id}
                className={cn(
                  'transition-colors',
                  !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
                )}
              >
                <TableCell>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      getNotificationTypeColor(notification.type)
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'font-medium',
                          !notification.isRead && 'text-foreground',
                          notification.isRead && 'text-muted-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getNotificationTypeColor(notification.type))}
                      >
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    {referenceLink && (
                      <Link
                        href={referenceLink}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(notification.createdAt, 'en')}
                  </span>
                </TableCell>
                <TableCell>
                  {notification.isRead ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      Read
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500 hover:bg-blue-600">
                      Unread
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isProcessing}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {notification.isRead ? (
                        <DropdownMenuItem onClick={() => handleMarkAsUnread(notification.id)}>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Mark as unread
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Mark as read
                        </DropdownMenuItem>
                      )}
                      {referenceLink && (
                        <DropdownMenuItem asChild>
                          <Link href={referenceLink}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View reference
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(notification.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
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
