import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { NotificationService } from '../notifications/notifications.service'
import crypto from 'crypto'
import { config } from '../../config/env'

const notifSvc = new NotificationService()

const initiateSchema = z.object({
  sessionId: z.string().uuid(),
  method: z.enum(['VODAFONE_CASH', 'ORANGE_CASH', 'ETISALAT_CASH', 'CREDIT_CARD', 'MEEZA', 'WALLET_BALANCE']),
  walletPhone: z.string().optional(),
})

const walletTopupSchema = z.object({
  amountEgp: z.number().min(50).max(5000),
  method: z.enum(['VODAFONE_CASH', 'ORANGE_CASH', 'ETISALAT_CASH', 'CREDIT_CARD', 'MEEZA']),
})

const withdrawSchema = z.object({
  amountEgp: z.number().min(100),
  method: z.string(),
  walletPhone: z.string(),
})

export default async function paymentRoutes(fastify: FastifyInstance) {

  // POST /payments/initiate
  fastify.post('/initiate', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const body = initiateSchema.parse(req.body)
    const userId = (req as any).user.id

    const session = await prisma.session.findUnique({ where: { id: body.sessionId } })
    if (!session) throw new AppError('الجلسة غير موجودة.', 404)
    if (session.seekerId !== userId) throw new AppError('غير مصرح.', 403)
    if (session.status !== 'CONFIRMED') throw new AppError('يجب قبول الطلب من المساعد أولاً.', 400)

    // Check no existing successful payment
    const existingPayment = await prisma.payment.findUnique({ where: { sessionId: body.sessionId } })
    if (existingPayment && ['ESCROWED', 'RELEASED'].includes(existingPayment.status)) {
      throw new AppError('تم الدفع مسبقاً.', 409)
    }

    const idempotencyKey = `${body.sessionId}:${userId}`

    // Handle wallet balance payment
    if (body.method === 'WALLET_BALANCE') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user || Number(user.walletBalanceEgp) < Number(session.priceEgp)) {
        throw new AppError('رصيد المحفظة غير كافٍ.', 400)
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalanceEgp: { decrement: session.priceEgp } },
        })
        await tx.payment.upsert({
          where: { idempotencyKey },
          create: {
            sessionId: body.sessionId,
            userId,
            amountEgp: session.priceEgp,
            feeEgp: session.platformFeeEgp,
            method: 'WALLET_BALANCE',
            status: 'ESCROWED',
            idempotencyKey,
          },
          update: { status: 'ESCROWED' },
        })
      })

      return reply.send({
        status: 'success',
        data: { paymentStatus: 'ESCROWED', message: 'تم خصم المبلغ من محفظتك.' },
      })
    }

    // External gateway (Paymob)
    const payment = await prisma.payment.upsert({
      where: { idempotencyKey },
      create: {
        sessionId: body.sessionId,
        userId,
        amountEgp: session.priceEgp,
        feeEgp: session.platformFeeEgp,
        method: body.method as any,
        status: 'PENDING',
        idempotencyKey,
      },
      update: { status: 'PENDING' },
    })

    // In production, call Paymob API here to get payment URL
    // Simplified for dev:
    const paymentUrl = `${config.FRONTEND_URL}/payment/complete?paymentId=${payment.id}`

    reply.send({
      status: 'success',
      data: {
        paymentId: payment.id,
        amountEgp: session.priceEgp,
        paymentUrl,
        validUntil: new Date(Date.now() + 30 * 60 * 1000),
      },
    })
  })

  // POST /payments/webhook — Paymob webhook (no auth, HMAC verified)
  fastify.post('/webhook', async (req, reply) => {
    const hmacSecret = config.PAYMOB_HMAC_SECRET
    if (hmacSecret) {
      const receivedHmac = (req.query as any).hmac
      const body = req.body as any

      // Paymob HMAC concatenation (sorted keys)
      const hmacString = [
        body.obj?.amount_cents,
        body.obj?.created_at,
        body.obj?.currency,
        body.obj?.error_occured,
        body.obj?.has_parent_transaction,
        body.obj?.id,
        body.obj?.integration_id,
        body.obj?.is_3d_secure,
        body.obj?.is_auth,
        body.obj?.is_capture,
        body.obj?.is_refunded,
        body.obj?.is_standalone_payment,
        body.obj?.is_voided,
        body.obj?.order?.id,
        body.obj?.owner,
        body.obj?.pending,
        body.obj?.source_data?.pan,
        body.obj?.source_data?.sub_type,
        body.obj?.source_data?.type,
        body.obj?.success,
      ].join('')

      const expectedHmac = crypto
        .createHmac('sha512', hmacSecret)
        .update(hmacString)
        .digest('hex')

      if (receivedHmac !== expectedHmac) {
        return reply.status(401).send({ error: 'Invalid HMAC' })
      }
    }

    const webhookBody = req.body as any
    if (webhookBody?.obj?.success === true) {
      const orderId = webhookBody?.obj?.order?.id
      if (orderId) {
        await prisma.payment.updateMany({
          where: { gatewayOrderId: String(orderId), status: 'PENDING' },
          data: {
            status: 'ESCROWED',
            gatewayRef: String(webhookBody.obj.id),
          },
        })
      }
    }

    reply.send({ received: true })
  })

  // GET /payments/history
  fastify.get('/history', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const page = z.coerce.number().default(1).parse((req.query as any).page)
    const limit = 20
    const skip = (page - 1) * limit
    const userId = (req as any).user.id

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          session: {
            select: {
              scheduledStart: true,
              durationMinutes: true,
              sessionType: true,
              helper: { select: { id: true, fullName: true } },
              seeker: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ])

    reply.send({ status: 'success', data: { payments, pagination: { total, page, limit } } })
  })

  // POST /payments/topup — add wallet funds
  fastify.post('/topup', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const body = walletTopupSchema.parse(req.body)
    const userId = (req as any).user.id

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('المستخدم غير موجود.', 404)

    const currentBalance = Number(user.walletBalanceEgp)
    if (currentBalance + body.amountEgp > 5000) {
      throw new AppError('لا يمكن أن يتجاوز رصيد المحفظة 5000 جنيه.', 400)
    }

    // In production: initiate gateway payment then credit on webhook
    // Dev mode: credit directly
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalanceEgp: { increment: body.amountEgp } },
    })

    await notifSvc.send({
      userId,
      type: 'PAYMENT_RECEIVED',
      title: 'تم شحن المحفظة',
      body: `تم إضافة ${body.amountEgp} جنيه لمحفظتك.`,
      data: {},
    })

    reply.send({ status: 'success', message: `تم إضافة ${body.amountEgp} جنيه بنجاح.` })
  })

  // POST /payments/withdraw — helper payout request
  fastify.post('/withdraw', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const body = withdrawSchema.parse(req.body)
    const userId = (req as any).user.id

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.userType !== 'HELPER') throw new AppError('فقط المساعدون يمكنهم سحب الأموال.', 403)
    if (Number(user.walletBalanceEgp) < body.amountEgp) throw new AppError('رصيد غير كافٍ.', 400)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalanceEgp: { decrement: body.amountEgp } },
      })
      await tx.payout.create({
        data: {
          helperId: userId,
          amountEgp: body.amountEgp,
          method: body.method,
          walletNumber: body.walletPhone,
          status: 'pending',
        },
      })
    })

    await notifSvc.send({
      userId,
      type: 'PAYOUT_INITIATED',
      title: 'تم طلب السحب',
      body: `سيتم تحويل ${body.amountEgp} جنيه خلال 24-48 ساعة.`,
      data: {},
    })

    reply.send({ status: 'success', message: 'تم إرسال طلب السحب.' })
  })
}
