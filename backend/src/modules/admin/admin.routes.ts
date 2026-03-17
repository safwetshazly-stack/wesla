import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { cache } from '../../lib/redis'

export default async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require admin role
  const adminAuth = [(fastify as any).adminOnly]

  // ─── Dashboard stats ────────────────────────────────
  fastify.get('/stats', { onRequest: adminAuth }, async (_, reply) => {
    const cacheKey = 'admin:dashboard:stats'
    const cached = await cache.get(cacheKey)
    if (cached) return reply.send({ status: 'success', data: cached })

    const [
      totalUsers, totalHelpers, totalSeekers,
      totalSessions, completedSessions, totalRevenue,
      pendingVerifications, openDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: 'HELPER' } }),
      prisma.user.count({ where: { userType: 'SEEKER' } }),
      prisma.session.count(),
      prisma.session.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { status: 'RELEASED' },
        _sum: { feeEgp: true },
      }),
      prisma.user.count({ where: { userType: 'HELPER', verificationStatus: 'PENDING' } }),
      prisma.dispute.count({ where: { status: { in: ['OPEN', 'IN_MEDIATION'] } } }),
    ])

    const stats = {
      users: { total: totalUsers, helpers: totalHelpers, seekers: totalSeekers },
      sessions: { total: totalSessions, completed: completedSessions },
      revenue: { totalEgp: Number(totalRevenue._sum.feeEgp || 0) },
      pending: { verifications: pendingVerifications, disputes: openDisputes },
    }

    await cache.set(cacheKey, stats, 300)
    reply.send({ status: 'success', data: stats })
  })

  // ─── Users management ───────────────────────────────
  fastify.get('/users', { onRequest: adminAuth }, async (req, reply) => {
    const query = z.object({
      userType: z.enum(['HELPER', 'SEEKER', 'ADMIN']).optional(),
      verificationStatus: z.string().optional(),
      search: z.string().optional(),
      page: z.coerce.number().default(1),
    }).parse(req.query)

    const where: any = {}
    if (query.userType) where.userType = query.userType
    if (query.verificationStatus) where.verificationStatus = query.verificationStatus
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search } },
      ]
    }

    const limit = 25
    const skip = (query.page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, fullName: true, email: true, phoneNumber: true,
          userType: true, verificationStatus: true, ratingAvg: true,
          totalSessions: true, walletBalanceEgp: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    reply.send({ status: 'success', data: { users, pagination: { total, page: query.page, limit } } })
  })

  // PATCH /admin/users/:id/status — suspend/activate
  fastify.patch('/users/:id/status', { onRequest: adminAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status, reason } = z.object({
      status: z.enum(['VERIFIED', 'SUSPENDED', 'REVOKED']),
      reason: z.string().optional(),
    }).parse(req.body)

    await prisma.user.update({
      where: { id },
      data: { verificationStatus: status },
    })

    // Invalidate user cache
    await cache.del(`user:${id}:profile`)
    await cache.del(`helper:${id}:public`)

    reply.send({ status: 'success', message: `تم تحديث حالة المستخدم إلى ${status}.` })
  })

  // ─── Verification queue ─────────────────────────────
  fastify.get('/verifications', { onRequest: adminAuth }, async (req, reply) => {
    const page = z.coerce.number().default(1).parse((req.query as any).page)
    const limit = 20

    const [pending, total] = await Promise.all([
      prisma.user.findMany({
        where: { userType: 'HELPER', verificationStatus: 'PENDING' },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, fullName: true, email: true, phoneNumber: true,
          skills: true, experienceLevel: true, createdAt: true,
          verificationDocs: true,
        },
      }),
      prisma.user.count({ where: { userType: 'HELPER', verificationStatus: 'PENDING' } }),
    ])

    reply.send({ status: 'success', data: { pending, pagination: { total, page, limit } } })
  })

  // ─── Sessions management ────────────────────────────
  fastify.get('/sessions', { onRequest: adminAuth }, async (req, reply) => {
    const query = z.object({
      status: z.string().optional(),
      page: z.coerce.number().default(1),
    }).parse(req.query)

    const where: any = {}
    if (query.status) where.status = query.status
    const limit = 25

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip: (query.page - 1) * limit,
        take: limit,
        orderBy: { scheduledStart: 'desc' },
        include: {
          helper: { select: { id: true, fullName: true } },
          seeker: { select: { id: true, fullName: true } },
          payment: { select: { status: true, amountEgp: true } },
        },
      }),
      prisma.session.count({ where }),
    ])

    reply.send({ status: 'success', data: { sessions, pagination: { total, page: query.page, limit } } })
  })

  // PATCH /admin/sessions/:id/cancel — force cancel
  fastify.patch('/sessions/:id/cancel', { onRequest: adminAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { reason } = z.object({ reason: z.string() }).parse(req.body)

    await prisma.session.update({
      where: { id },
      data: { status: 'CANCELLED', cancellationReason: reason, cancellationBy: 'ADMIN' },
    })

    reply.send({ status: 'success' })
  })

  // ─── Disputes ───────────────────────────────────────
  fastify.get('/disputes', { onRequest: adminAuth }, async (req, reply) => {
    const page = z.coerce.number().default(1).parse((req.query as any).page)
    const limit = 20

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          session: {
            include: {
              helper: { select: { fullName: true } },
              seeker: { select: { fullName: true } },
              payment: { select: { amountEgp: true } },
            },
          },
          initiator: { select: { fullName: true } },
        },
      }),
      prisma.dispute.count(),
    ])

    reply.send({ status: 'success', data: { disputes, pagination: { total, page, limit } } })
  })

  // PATCH /admin/disputes/:id/resolve
  fastify.patch('/disputes/:id/resolve', { onRequest: adminAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      resolution: z.string().min(10),
      action: z.enum(['REFUND_FULL', 'REFUND_PARTIAL', 'RELEASE_TO_HELPER', 'NO_ACTION']),
      refundAmount: z.number().optional(),
    }).parse(req.body)

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { session: { include: { payment: true } } },
    })
    if (!dispute) throw new AppError('النزاع غير موجود.', 404)

    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolution: body.resolution,
          resolvedAt: new Date(),
        },
      })

      if (body.action === 'REFUND_FULL' && dispute.session.payment) {
        await tx.payment.update({
          where: { id: dispute.session.payment.id },
          data: { status: 'REFUNDED', refundedAt: new Date(), refundReason: body.resolution },
        })
        await tx.user.update({
          where: { id: dispute.session.seekerId },
          data: { walletBalanceEgp: { increment: dispute.session.payment.amountEgp } },
        })
      }
    })

    reply.send({ status: 'success', message: 'تم حل النزاع.' })
  })

  // ─── Financial overview ─────────────────────────────
  fastify.get('/finance', { onRequest: adminAuth }, async (_, reply) => {
    const [platformRevenue, pendingPayouts, escrowedTotal] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'RELEASED' },
        _sum: { feeEgp: true },
      }),
      prisma.payout.aggregate({
        where: { status: 'pending' },
        _sum: { amountEgp: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'ESCROWED' },
        _sum: { amountEgp: true },
      }),
    ])

    reply.send({
      status: 'success',
      data: {
        platformRevenueEgp: Number(platformRevenue._sum.feeEgp || 0),
        pendingPayoutsEgp: Number(pendingPayouts._sum.amountEgp || 0),
        escrowedEgp: Number(escrowedTotal._sum.amountEgp || 0),
      },
    })
  })
}
