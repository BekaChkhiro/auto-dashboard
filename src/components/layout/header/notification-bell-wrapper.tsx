import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NotificationBell } from './notification-bell'

export async function NotificationBellWrapper() {
  const session = await auth()

  // Only show for dealers
  if (!session?.user || session.user.role !== 'DEALER') {
    return null
  }

  const dealerId = session.user.id

  // Fetch initial data on server
  const [unreadCount, recentNotifications] = await Promise.all([
    db.notification.count({
      where: { userId: dealerId, isRead: false },
    }),
    db.notification.findMany({
      where: { userId: dealerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
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
    }),
  ])

  const notifications = recentNotifications.map((notification) => ({
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

  return (
    <NotificationBell
      initialUnreadCount={unreadCount}
      initialNotifications={notifications}
    />
  )
}
