import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../lib/prisma'
import { cache } from '../../lib/redis'
import { AppError } from '../../lib/errors'
import { NotificationService } from '../notifications/notifications.service'

const notifSvc = new NotificationService()

const PLATFORM_FEE_PERCENT = 10
const FIXED_FEE_EGP = 5
const FIXED_FEE_THRESHOLD = 50

interface CreateRequestDto {
  helperId: string
  sessionType: 'VOICE' | 'VIDEO' | 'CHAT'
  durationMinutes: number
  scheduledStart: string
  description?: string
}

export class SessionsService {
  // ─── Create session request ───────────────────────────
  async createRequest(seekerId: string, dto: CreateRequestDto) {
    // Must be a seeker
    const seeker = await prisma.user.findUnique({ where: { id: seekerId } })
    if (!seeker || seeker.userType !== 'SEEKER') {
      throw new AppError('يجب أن تكون طالب مساعدة لإنشاء طلب.', 403)
    }
    if (seeker.verificationStatus !== 'VERIFIED') {
      throw new AppError('يجب التحقق من رقم هاتفك أولاً.', 403)
    }

    // Get helper
    const helper = await prisma.user.findFirst({
      where: { id: dto.helperId, userType: 'HELPER', verificationStatus: 'VERIFIED' },
    })
    if (!helper || !helper.hourlyRateEgp) {
      throw new AppError('المساعد غير متاح حالياً.', 404)
    }

    // Rate limit: max 3 requests per seeker-helper pair per day
    const todayRequests = await prisma.session.count({
      where: {
        seekerId,
        helperId: dto.helperId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (todayRequests >= 3) {
      throw new AppError('لا يمكنك إرسال أكثر من 3 طلبات لنفس المساعد في اليوم الواحد.', 429)
    }

    // Prevent double-booking on helper side
    const scheduledStart = new Date(dto.scheduledStart)
    const scheduledEnd = new Date(scheduledStart.getTime() + dto.durationMinutes * 60 * 1000)

    const conflict = await prisma.session.findFirst({
      where: {
        helperId: dto.helperId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        AND: [
          { scheduledStart: { lt: scheduledEnd } },
          {
            scheduledStart: {
              gte: new Date(scheduledStart.getTime() - dto.durationMinutes * 60 * 1000),
            },
          },
        ],
      },
    })
    if (conflict) {
      throw new AppError('المساعد مشغول في هذا الوقت. اختر وقتاً آخر.', 409)
    }

    // Calculate pricing
    const hourlyRate = Number(helper.hourlyRateEgp)
    const rawPrice = (hourlyRate / 60) * dto.durationMinutes
    const roundedPrice = Math.round(rawPrice)

    let platformFee: number
    if (roundedPrice < FIXED_FEE_THRESHOLD) {
      platformFee = FIXED_FEE_EGP
    } else {
      platformFee = Math.round((roundedPrice * PLATFORM_FEE_PERCENT) / 100)
    }
    const helperEarnings = roundedPrice - platformFee

    const session = await prisma.session.create({
      data: {
        helperId: dto.helperId,
        seekerId,
        sessionType: dto.sessionType,
        scheduledStart,
        durationMinutes: dto.durationMinutes,
        priceEgp: roundedPrice,
        platformFeeEgp: platformFee,
        helperEarningsEgp: helperEarnings,
        status: 'REQUESTED',
        description: dto.description,
        roomId: uuidv4(),
      },
    })

    // Notify helper
    await notifSvc.send({
      userId: dto.helperId,
      type: 'SESSION_REQUEST',
      title: 'طلب جلسة جديد',
      body: `${seeker.fullName} يريد جلسة معك بتاريخ ${scheduledStart.toLocaleDateString('ar-EG')}`,
      data: { sessionId: session.id },
    })

    return {
      sessionId: session.id,
      status: session.status,
      priceEgp: session.priceEgp,
      platformFeeEgp: session.platformFeeEgp,
      helperEarningsEgp: session.helperEarningsEgp,
      scheduledStart: session.scheduledStart,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    }
  }

  // ─── List sessions ────────────────────────────────────
  async listSessions(userId: string, userType: string, query: { status?: string; page: number }) {
    const limit = 20
    const skip = (query.page - 1) * limit
    const where: any = userType === 'HELPER'
      ? { helperId: userId }
      : { seekerId: userId }

    if (query.status) where.status = query.status

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy: { scheduledStart: 'desc' },
        skip,
        take: limit,
        include: {
          helper: { select: { id: true, fullName: true, profileImageUrl: true } },
          seeker: { select: { id: true, fullName: true, profileImageUrl: true } },
          payment: { select: { status: true, method: true } },
        },
      }),
      prisma.session.count({ where }),
    ])

    return { sessions, pagination: { total, page: query.page, limit, totalPages: Math.ceil(total / limit) } }
  }

  // ─── Get single session (ownership enforced) ──────────
  async getSession(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        helper: { select: { id: true, fullName: true, profileImageUrl: true, skills: true } },
        seeker: { select: { id: true, fullName: true, profileImageUrl: true } },
        payment: true,
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
        reviews: { where: { isPublished: true } },
        dispute: true,
      },
    })

    if (!session) throw new AppError('الجلسة غير موجودة.', 404)
    if (session.helperId !== userId && session.seekerId !== userId) {
      throw new AppError('ليس لديك صلاحية لعرض هذه الجلسة.', 403)
    }

    return session
  }

  // ─── Accept session ───────────────────────────────────
  async acceptSession(sessionId: string, helperId: string) {
    const session = await this.getSessionOrThrow(sessionId, helperId, 'HELPER')
    if (session.status !== 'REQUESTED') {
      throw new AppError('لا يمكن قبول هذا الطلب في حالته الحالية.', 400)
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CONFIRMED' },
    })

    await notifSvc.send({
      userId: session.seekerId,
      type: 'SESSION_ACCEPTED',
      title: 'تم قبول طلبك!',
      body: 'قبل المساعد طلبك. أكمل الدفع لتأكيد الجلسة.',
      data: { sessionId },
    })

    return updated
  }

  // ─── Decline session ──────────────────────────────────
  async declineSession(sessionId: string, helperId: string, reason: string) {
    const session = await this.getSessionOrThrow(sessionId, helperId, 'HELPER')
    if (session.status !== 'REQUESTED') {
      throw new AppError('لا يمكن رفض هذا الطلب.', 400)
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED', cancellationReason: reason, cancellationBy: 'HELPER' },
    })

    await notifSvc.send({
      userId: session.seekerId,
      type: 'SESSION_DECLINED',
      title: 'تم رفض طلبك',
      body: 'عذراً، المساعد غير متاح. جرّب حجز مساعد آخر.',
      data: { sessionId },
    })
  }

  // ─── Cancel session ───────────────────────────────────
  async cancelSession(sessionId: string, userId: string, reason: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session) throw new AppError('الجلسة غير موجودة.', 404)
    if (session.helperId !== userId && session.seekerId !== userId) {
      throw new AppError('ليس لديك صلاحية لإلغاء هذه الجلسة.', 403)
    }
    if (!['REQUESTED', 'CONFIRMED'].includes(session.status)) {
      throw new AppError('لا يمكن إلغاء جلسة في هذه الحالة.', 400)
    }

    const cancelledBy = session.helperId === userId ? 'HELPER' : 'SEEKER'
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED', cancellationReason: reason, cancellationBy: cancelledBy },
    })

    const notifyId = cancelledBy === 'HELPER' ? session.seekerId : session.helperId
    await notifSvc.send({
      userId: notifyId,
      type: 'SESSION_CANCELLED',
      title: 'تم إلغاء الجلسة',
      body: `تم إلغاء الجلسة. السبب: ${reason}`,
      data: { sessionId },
    })
  }

  // ─── Start session ────────────────────────────────────
  async startSession(sessionId: string, userId: string) {
    const session = await this.getSessionOrThrow(sessionId, userId, 'HELPER')

    if (session.status !== 'CONFIRMED') {
      throw new AppError('لا يمكن بدء الجلسة — يجب تأكيد الدفع أولاً.', 400)
    }

    // Verify payment exists and is escrowed
    const payment = await prisma.payment.findUnique({ where: { sessionId } })
    if (!payment || payment.status !== 'ESCROWED') {
      throw new AppError('لم يتم تأكيد الدفع بعد.', 402)
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'IN_PROGRESS', actualStart: new Date() },
    })

    await notifSvc.send({
      userId: session.seekerId,
      type: 'SESSION_STARTED',
      title: 'الجلسة بدأت!',
      body: 'انضم الآن إلى الجلسة.',
      data: { sessionId, roomId: session.roomId },
    })

    return updated
  }

  // ─── Complete session ─────────────────────────────────
  async completeSession(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session) throw new AppError('الجلسة غير موجودة.', 404)
    if (session.helperId !== userId && session.seekerId !== userId) {
      throw new AppError('غير مصرح.', 403)
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new AppError('الجلسة ليست جارية حالياً.', 400)
    }

    await prisma.$transaction(async (tx) => {
      // Update session
      await tx.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', actualEnd: new Date() },
      })

      // Schedule escrow release (after 24h grace period if no dispute)
      // In production this would be a Bull job; here we mark for release
      await tx.payment.updateMany({
        where: { sessionId, status: 'ESCROWED' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      })

      // Credit helper wallet
      await tx.user.update({
        where: { id: session.helperId },
        data: {
          walletBalanceEgp: { increment: session.helperEarningsEgp },
          totalSessions: { increment: 1 },
          totalEarningsEgp: { increment: session.helperEarningsEgp },
        },
      })

      // Increment seeker's session count
      await tx.user.update({
        where: { id: session.seekerId },
        data: { totalSessions: { increment: 1 } },
      })
    })

    // Send review reminders (both parties)
    await Promise.all([
      notifSvc.send({
        userId: session.seekerId,
        type: 'NEW_REVIEW',
        title: 'كيف كانت جلستك؟',
        body: 'شاركنا تجربتك وقيّم المساعد.',
        data: { sessionId },
      }),
      notifSvc.send({
        userId: session.helperId,
        type: 'NEW_REVIEW',
        title: 'انتهت الجلسة بنجاح',
        body: 'تم إضافة الأرباح لمحفظتك. قيّم الطالب.',
        data: { sessionId },
      }),
    ])

    // Invalidate caches
    await cache.del(`helper:${session.helperId}:public`)
  }

  // ─── Submit review ────────────────────────────────────
  async submitReview(sessionId: string, reviewerId: string, data: any) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session) throw new AppError('الجلسة غير موجودة.', 404)
    if (session.status !== 'COMPLETED') {
      throw new AppError('يمكن التقييم بعد اكتمال الجلسة فقط.', 400)
    }
    if (session.helperId !== reviewerId && session.seekerId !== reviewerId) {
      throw new AppError('غير مصرح.', 403)
    }

    const revieweeId = reviewerId === session.helperId ? session.seekerId : session.helperId

    // Check if already reviewed
    const existing = await prisma.review.findUnique({
      where: { sessionId_reviewerId: { sessionId, reviewerId } },
    })
    if (existing) throw new AppError('لقد قيّمت هذه الجلسة مسبقاً.', 409)

    // Create review — published after 24h delay
    const publishedAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.review.create({
      data: {
        sessionId,
        reviewerId,
        revieweeId,
        ...data,
        publishedAt,
        isPublished: false,
      },
    })

    // Update helper average rating (only when published — simplified here)
    const allReviews = await prisma.review.aggregate({
      where: { revieweeId, isPublished: true },
      _avg: { ratingOverall: true },
    })
    if (allReviews._avg.ratingOverall) {
      await prisma.user.update({
        where: { id: revieweeId },
        data: { ratingAvg: allReviews._avg.ratingOverall },
      })
    }
  }

  // ─── Get room token ───────────────────────────────────
  async getRoomToken(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session) throw new AppError('الجلسة غير موجودة.', 404)
    if (session.helperId !== userId && session.seekerId !== userId) {
      throw new AppError('غير مصرح.', 403)
    }
    if (!['CONFIRMED', 'IN_PROGRESS'].includes(session.status)) {
      throw new AppError('الجلسة غير نشطة.', 400)
    }

    return {
      roomId: session.roomId,
      sessionType: session.sessionType,
      scheduledStart: session.scheduledStart,
      durationMinutes: session.durationMinutes,
    }
  }

  // ─── Private helpers ──────────────────────────────────
  private async getSessionOrThrow(sessionId: string, userId: string, expectedRole: 'HELPER' | 'SEEKER') {
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session) throw new AppError('الجلسة غير موجودة.', 404)

    const isAuthorized = expectedRole === 'HELPER'
      ? session.helperId === userId
      : session.seekerId === userId

    if (!isAuthorized) throw new AppError('غير مصرح.', 403)
    return session
  }
}
