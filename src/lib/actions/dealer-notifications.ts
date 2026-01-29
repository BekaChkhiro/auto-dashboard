'use server'

import { db } from '@/lib/db'
import { requireDealer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { NotificationType } from '@/generated/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface DealerNotification {
  id: string
  title: string
  titleKa: string
  message: string
  messageKa: string
  type: NotificationType
  isRead: boolean
  referenceType: string | null
  referenceId: string | null
  createdAt: Date
}

export interface DealerNotificationListParams {
  type?: NotificationType | 'all'
  status?: 'all' | 'read' | 'unread'
  page?: number
  pageSize?: number
}

export interface DealerNotificationsResult {
  notifications: DealerNotification[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export interface DealerNotificationStats {
  totalCount: number
  unreadCount: number
  readCount: number
  byType: {
    STATUS_CHANGE: number
    BALANCE: number
    INVOICE: number
    SYSTEM: number
  }
}

// ============================================================================
// GET NOTIFICATIONS LIST
// ============================================================================

export async function getDealerNotifications(
  params: DealerNotificationListParams = {}
): Promise<DealerNotificationsResult> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const {
    type = 'all',
    status = 'all',
    page = 1,
    pageSize = 10,
  } = params

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId: dealerId,
  }

  // Type filter
  if (type !== 'all') {
    where.type = type
  }

  // Read status filter
  if (status === 'read') {
    where.isRead = true
  } else if (status === 'unread') {
    where.isRead = false
  }

  // Get total count
  const totalCount = await db.notification.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const skip = (page - 1) * pageSize

  // Fetch notifications
  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
    select: {
      id: true,
      titleEn: true,
      titleKa: true,
      messageEn: true,
      messageKa: true,
      type: true,
      isRead: true,
      referenceType: true,
      referenceId: true,
      createdAt: true,
    },
  })

  return {
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.titleEn,
      titleKa: notification.titleKa,
      message: notification.messageEn,
      messageKa: notification.messageKa,
      type: notification.type,
      isRead: notification.isRead,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
      createdAt: notification.createdAt,
    })),
    totalCount,
    totalPages,
    currentPage: page,
  }
}

// ============================================================================
// GET NOTIFICATION STATS
// ============================================================================

export async function getDealerNotificationStats(): Promise<DealerNotificationStats> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const [totalCount, unreadCount, typeCounts] = await Promise.all([
    db.notification.count({ where: { userId: dealerId } }),
    db.notification.count({ where: { userId: dealerId, isRead: false } }),
    db.notification.groupBy({
      by: ['type'],
      where: { userId: dealerId },
      _count: true,
    }),
  ])

  const byType = {
    STATUS_CHANGE: 0,
    BALANCE: 0,
    INVOICE: 0,
    SYSTEM: 0,
  }

  typeCounts.forEach((item) => {
    byType[item.type] = item._count
  })

  return {
    totalCount,
    unreadCount,
    readCount: totalCount - unreadCount,
    byType,
  }
}

// ============================================================================
// GET UNREAD COUNT (for header bell)
// ============================================================================

export async function getDealerUnreadNotificationCount(): Promise<number> {
  const session = await requireDealer()
  const dealerId = session.user.id

  return db.notification.count({
    where: { userId: dealerId, isRead: false },
  })
}

// ============================================================================
// GET RECENT NOTIFICATIONS (for header dropdown)
// ============================================================================

export async function getDealerRecentNotificationsForBell(
  limit: number = 5
): Promise<DealerNotification[]> {
  const session = await requireDealer()
  const dealerId = session.user.id

  const notifications = await db.notification.findMany({
    where: { userId: dealerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      titleEn: true,
      titleKa: true,
      messageEn: true,
      messageKa: true,
      type: true,
      isRead: true,
      referenceType: true,
      referenceId: true,
      createdAt: true,
    },
  })

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.titleEn,
    titleKa: notification.titleKa,
    message: notification.messageEn,
    messageKa: notification.messageKa,
    type: notification.type,
    isRead: notification.isRead,
    referenceType: notification.referenceType,
    referenceId: notification.referenceId,
    createdAt: notification.createdAt,
  }))
}

// ============================================================================
// MARK AS READ
// ============================================================================

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireDealer()
    const dealerId = session.user.id

    // Verify ownership
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification || notification.userId !== dealerId) {
      return { success: false, error: 'Notification not found' }
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    revalidatePath('/dealer/notifications')
    revalidatePath('/dealer')

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

// ============================================================================
// MARK AS UNREAD
// ============================================================================

export async function markNotificationAsUnread(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireDealer()
    const dealerId = session.user.id

    // Verify ownership
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification || notification.userId !== dealerId) {
      return { success: false, error: 'Notification not found' }
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: false },
    })

    revalidatePath('/dealer/notifications')
    revalidatePath('/dealer')

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to mark notification as unread' }
  }
}

// ============================================================================
// MARK ALL AS READ
// ============================================================================

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const session = await requireDealer()
    const dealerId = session.user.id

    const result = await db.notification.updateMany({
      where: { userId: dealerId, isRead: false },
      data: { isRead: true },
    })

    revalidatePath('/dealer/notifications')
    revalidatePath('/dealer')

    return { success: true, count: result.count }
  } catch {
    return { success: false, error: 'Failed to mark all notifications as read' }
  }
}

// ============================================================================
// DELETE NOTIFICATION
// ============================================================================

export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireDealer()
    const dealerId = session.user.id

    // Verify ownership
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification || notification.userId !== dealerId) {
      return { success: false, error: 'Notification not found' }
    }

    await db.notification.delete({
      where: { id: notificationId },
    })

    revalidatePath('/dealer/notifications')
    revalidatePath('/dealer')

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete notification' }
  }
}

// ============================================================================
// DELETE ALL READ NOTIFICATIONS
// ============================================================================

export async function deleteAllReadNotifications(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const session = await requireDealer()
    const dealerId = session.user.id

    const result = await db.notification.deleteMany({
      where: { userId: dealerId, isRead: true },
    })

    revalidatePath('/dealer/notifications')
    revalidatePath('/dealer')

    return { success: true, count: result.count }
  } catch {
    return { success: false, error: 'Failed to delete read notifications' }
  }
}
