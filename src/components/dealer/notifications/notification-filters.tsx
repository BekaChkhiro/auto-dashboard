'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CheckCheck, Trash2 } from 'lucide-react'
import {
  markAllNotificationsAsRead,
  deleteAllReadNotifications,
} from '@/lib/actions/dealer-notifications'
import { useToast } from '@/hooks/use-toast'
import type { NotificationType } from '@/generated/prisma'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface NotificationFiltersProps {
  currentType: NotificationType | 'all'
  currentStatus: 'all' | 'read' | 'unread'
  unreadCount: number
}

export function NotificationFilters({
  currentType,
  currentStatus,
  unreadCount,
}: NotificationFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // Reset to first page on filter change
    router.push(`/dealer/notifications?${params.toString()}`)
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        toast({
          title: 'All notifications marked as read',
          description: `${result.count} notification${result.count !== 1 ? 's' : ''} marked as read`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  const handleDeleteAllRead = () => {
    startTransition(async () => {
      const result = await deleteAllReadNotifications()
      if (result.success) {
        toast({
          title: 'Read notifications deleted',
          description: `${result.count} notification${result.count !== 1 ? 's' : ''} deleted`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Select
          value={currentType}
          onValueChange={(value) => updateFilter('type', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="STATUS_CHANGE">Status</SelectItem>
            <SelectItem value="BALANCE">Balance</SelectItem>
            <SelectItem value="INVOICE">Invoice</SelectItem>
            <SelectItem value="SYSTEM">System</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentStatus}
          onValueChange={(value) => updateFilter('status', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={isPending || unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark all read
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear read
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete read notifications?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all read notifications. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAllRead}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
