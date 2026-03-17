import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { SessionsService } from './sessions.service'

const createSessionSchema = z.object({
  helperId: z.string().uuid(),
  sessionType: z.enum(['VOICE', 'VIDEO', 'CHAT']),
  durationMinutes: z.enum(['30', '60', '90', '120']).transform(Number),
  scheduledStart: z.string().datetime(),
  description: z.string().max(200).optional(),
})

const cancelSchema = z.object({
  reason: z.string().min(5).max(300),
})

const reviewSchema = z.object({
  ratingOverall: z.number().int().min(1).max(5),
  ratingExpertise: z.number().int().min(1).max(5).optional(),
  ratingComm: z.number().int().min(1).max(5).optional(),
  ratingValue: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
})

export default async function sessionRoutes(fastify: FastifyInstance) {
  const svc = new SessionsService()

  // POST /sessions — create session request
  fastify.post('/', {
    onRequest: [(fastify as any).authenticate],
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (req, reply) => {
    const body = createSessionSchema.parse(req.body)
    const session = await svc.createRequest((req as any).user.id, body)
    reply.status(201).send({ status: 'success', data: session })
  })

  // GET /sessions — list own sessions
  fastify.get('/', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const query = z.object({
      status: z.string().optional(),
      page: z.coerce.number().default(1),
    }).parse(req.query)
    const sessions = await svc.listSessions((req as any).user.id, (req as any).user.userType, query)
    reply.send({ status: 'success', data: sessions })
  })

  // GET /sessions/:id
  fastify.get('/:id', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const session = await svc.getSession(id, (req as any).user.id)
    reply.send({ status: 'success', data: session })
  })

  // PATCH /sessions/:id/accept — helper accepts
  fastify.patch('/:id/accept', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const session = await svc.acceptSession(id, (req as any).user.id)
    reply.send({ status: 'success', data: session })
  })

  // PATCH /sessions/:id/decline — helper declines
  fastify.patch('/:id/decline', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { reason } = cancelSchema.parse(req.body)
    await svc.declineSession(id, (req as any).user.id, reason)
    reply.send({ status: 'success', message: 'تم رفض الطلب.' })
  })

  // PATCH /sessions/:id/cancel
  fastify.patch('/:id/cancel', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { reason } = cancelSchema.parse(req.body)
    await svc.cancelSession(id, (req as any).user.id, reason)
    reply.send({ status: 'success', message: 'تم إلغاء الجلسة.' })
  })

  // PATCH /sessions/:id/start — mark session started
  fastify.patch('/:id/start', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const session = await svc.startSession(id, (req as any).user.id)
    reply.send({ status: 'success', data: session })
  })

  // PATCH /sessions/:id/complete
  fastify.patch('/:id/complete', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.completeSession(id, (req as any).user.id)
    reply.send({ status: 'success', message: 'تم إنهاء الجلسة بنجاح.' })
  })

  // POST /sessions/:id/review
  fastify.post('/:id/review', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = reviewSchema.parse(req.body)
    await svc.submitReview(id, (req as any).user.id, body)
    reply.status(201).send({ status: 'success', message: 'تم إرسال تقييمك. سيتم نشره بعد 24 ساعة.' })
  })

  // GET /sessions/:id/room — get WebRTC room token
  fastify.get('/:id/room', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const roomData = await svc.getRoomToken(id, (req as any).user.id)
    reply.send({ status: 'success', data: roomData })
  })
}
