'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Bell, RefreshCw, CreditCard, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/formatting'
import {
  getDealerUnreadNotificationCount,
  getDealerRecentNotificationsForBell,
  markNotificationAsRead,
  type DealerNotification,
} from '@/lib/actions/dealer-notifications'

function getNotificationIcon(type: DealerNotification['type']) {
  switch (type) {
    case 'STATUS_CHANGE':
      return <RefreshCw className="h-4 w-4 text-blue-500" />
    case 'BALANCE':
      return <CreditCard className="h-4 w-4 text-green-500" />
    case 'INVOICE':
      return <FileText className="h-4 w-4 text-purple-500" />
    case 'SYSTEM':
      return <Bell className="h-4 w-4 text-gray-500" />
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

interface NotificationBellProps {
  initialUnreadCount?: number
  initialNotifications?: DealerNotification[]
}

export function NotificationBell({
  initialUnreadCount = 0,
  initialNotifications = [],
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState<DealerNotification[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [, startTransition] = useTransition()

  // Refresh data when popover opens
  useEffect(() => {
    if (isOpen) {
      startTransition(async () => {
        const [count, recent] = await Promise.all([
          getDealerUnreadNotificationCount(),
          getDealerRecentNotificationsForBell(5),
        ])
        setUnreadCount(count)
        setNotifications(recent)
      })
    }
  }, [isOpen])

  // Poll for updates every 30 seconds when not open
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isOpen) {
        const count = await getDealerUnreadNotificationCount()
        setUnreadCount(count)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isOpen])

  const handleNotificationClick = async (notification: DealerNotification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      )
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const referenceLink = getReferenceLink(notification)

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                      !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-tight',
                          !notification.isRead ? 'font-medium' : 'text-muted-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt, 'en')}
                        </span>
                        {referenceLink && (
                          <Link
                            href={referenceLink}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-center" asChild>
            <Link href="/dealer/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
