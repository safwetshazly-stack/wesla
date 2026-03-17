import type { FastifyInstance } from 'fastify'
import { NotificationService } from './notifications.service'

export default async function notificationRoutes(fastify: FastifyInstance) {
  const svc = new NotificationService()

  fastify.get('/', { onRequest: [(fastify as any).authenticate] }, async (req, reply) => {
    const notifs = await svc.getUnread((req as any).user.id)
    reply.send({ status: 'success', data: notifs })
  })

  fastify.patch('/read-all', { onRequest: [(fastify as any).authenticate] }, async (req, reply) => {
    await svc.markAllRead((req as any).user.id)
    reply.send({ status: 'success' })
  })

  fastify.patch('/:id/read', { onRequest: [(fastify as any).authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.markRead(id, (req as any).user.id)
    reply.send({ status: 'success' })
  })
}
