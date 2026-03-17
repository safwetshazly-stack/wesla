import { prisma } from '../../lib/prisma'

interface SendNotifDto {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, any>
}

export class NotificationService {
  async send(dto: SendNotifDto) {
    try {
      await prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type as any,
          channel: 'IN_APP',
          title: dto.title,
          body: dto.body,
          data: dto.data || {},
        },
      })
    } catch (err) {
      console.error('[Notification] Failed to save:', err)
    }
  }

  async getUnread(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  }

  async markRead(notifId: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id: notifId, userId },
      data: { isRead: true, readAt: new Date() },
    })
  }
}
