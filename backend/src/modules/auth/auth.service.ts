import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { redis, rateLimiter, otpStore, tokenBlacklist, cache } from '../../lib/redis'
import { config } from '../../config/env'
import { AppError } from '../../lib/errors'
import { generateOtp, sendSmsOtp } from '../../lib/sms'

interface RegisterDto {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  userType: 'HELPER' | 'SEEKER'
}

interface LoginDto {
  identifier: string
  password: string
}

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  // ─── Register ──────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Check duplicates
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { phoneNumber: dto.phoneNumber },
        ],
      },
    })
    if (existing) {
      if (existing.email === dto.email.toLowerCase()) {
        throw new AppError('البريد الإلكتروني مستخدم بالفعل.', 409)
      }
      throw new AppError('رقم الهاتف مستخدم بالفعل.', 409)
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        phoneNumber: dto.phoneNumber,
        passwordHash,
        userType: dto.userType,
        verificationStatus: 'PENDING',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userType: true,
        verificationStatus: true,
        createdAt: true,
      },
    })

    // Send OTP for phone verification
    const otp = generateOtp()
    await otpStore.save(dto.phoneNumber, otp)
    await sendSmsOtp(dto.phoneNumber, otp)

    return {
      user,
      message: 'تم إنشاء الحساب بنجاح. أدخل رمز التحقق المرسل لهاتفك.',
      otpRequired: true,
    }
  }

  // ─── Login ─────────────────────────────────────────────
  async login(dto: LoginDto) {
    const identifier = dto.identifier.toLowerCase().trim()

    // Check if blocked (5 failed attempts)
    if (await rateLimiter.isBlocked(identifier)) {
      throw new AppError('تم تجاوز الحد المسموح به. حاول بعد 30 دقيقة.', 429)
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phoneNumber: dto.identifier },
        ],
      },
    })

    // Always hash-compare to prevent timing attacks
    const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.padding'
    const passwordValid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, dummyHash)

    if (!user || !passwordValid) {
      await rateLimiter.checkLoginAttempts(identifier)
      throw new AppError('بيانات الدخول غير صحيحة.', 401)
    }

    if (user.verificationStatus === 'SUSPENDED') {
      throw new AppError('تم تعليق حسابك. تواصل مع الدعم الفني.', 403)
    }

    if (user.verificationStatus === 'REVOKED') {
      throw new AppError('تم إلغاء حسابك نهائياً.', 403)
    }

    // Reset attempts on success
    await rateLimiter.resetLoginAttempts(identifier)

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.userType)

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        profileImageUrl: user.profileImageUrl,
        walletBalanceEgp: user.walletBalanceEgp,
      },
    }
  }

  // ─── Verify OTP ────────────────────────────────────────
  async verifyOtp(dto: { phone: string; code: string }) {
    const valid = await otpStore.verify(dto.phone, dto.code)
    if (!valid) {
      throw new AppError('رمز التحقق غير صحيح أو منتهي الصلاحية.', 400)
    }

    const user = await prisma.user.findUnique({
      where: { phoneNumber: dto.phone },
    })
    if (!user) throw new AppError('المستخدم غير موجود.', 404)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationStatus: user.userType === 'SEEKER' ? 'VERIFIED' : 'PENDING',
      },
    })

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.userType)

    return {
      accessToken,
      refreshToken,
      message: user.userType === 'SEEKER'
        ? 'تم التحقق بنجاح! مرحباً بك في وصلة.'
        : 'تم التحقق من رقم هاتفك. سيتم مراجعة ملفك الشخصي.',
    }
  }

  // ─── Refresh token ─────────────────────────────────────
  async refreshToken(token: string) {
    // Check blacklist
    if (await tokenBlacklist.isBlacklisted(token)) {
      throw new AppError('رمز التحديث غير صالح.', 401)
    }

    let payload: any
    try {
      payload = this.fastify.jwt.verify(token, { secret: config.JWT_REFRESH_SECRET } as any)
    } catch {
      throw new AppError('رمز التحديث منتهي الصلاحية. سجّل دخولك مجدداً.', 401)
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, userType: true, verificationStatus: true } } },
    })

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('رمز التحديث غير صالح أو منتهي.', 401)
    }

    if (stored.user.verificationStatus === 'SUSPENDED' || stored.user.verificationStatus === 'REVOKED') {
      throw new AppError('حسابك غير نشط.', 403)
    }

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { token } })
    await tokenBlacklist.add(token, 7 * 24 * 60 * 60)

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      stored.user.id,
      stored.user.userType
    )

    return { accessToken, refreshToken: newRefreshToken }
  }

  // ─── Logout ────────────────────────────────────────────
  async logout(userId: string, refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId, token: refreshToken },
    })
    await tokenBlacklist.add(refreshToken, 7 * 24 * 60 * 60)
  }

  // ─── Forgot password ───────────────────────────────────
  async forgotPassword(phoneNumber: string) {
    const user = await prisma.user.findUnique({ where: { phoneNumber } })
    if (!user) return // Silent — no enumeration

    const otp = generateOtp()
    await otpStore.save(phoneNumber, otp)
    await sendSmsOtp(phoneNumber, otp, 'reset')
  }

  // ─── Reset password ────────────────────────────────────
  async resetPassword(dto: { phone: string; otp: string; newPassword: string }) {
    const valid = await otpStore.verify(dto.phone, dto.otp)
    if (!valid) throw new AppError('رمز التحقق غير صحيح أو منتهي.', 400)

    const user = await prisma.user.findUnique({ where: { phoneNumber: dto.phone } })
    if (!user) throw new AppError('المستخدم غير موجود.', 404)

    const passwordHash = await bcrypt.hash(dto.newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
    await cache.invalidatePattern(`user:${user.id}:*`)
  }

  // ─── Get me ────────────────────────────────────────────
  async getMe(userId: string) {
    const cacheKey = `user:${userId}:profile`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userType: true,
        verificationStatus: true,
        profileImageUrl: true,
        bio: true,
        governorate: true,
        city: true,
        languages: true,
        skills: true,
        experienceLevel: true,
        hourlyRateEgp: true,
        availability: true,
        ratingAvg: true,
        totalSessions: true,
        walletBalanceEgp: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    })

    if (!user) throw new AppError('المستخدم غير موجود.', 404)
    await cache.set(cacheKey, user, 300)
    return user
  }

  // ─── Private helpers ───────────────────────────────────
  private async generateTokens(userId: string, userType: string) {
    const accessToken = this.fastify.jwt.sign(
      { id: userId, userType },
      { expiresIn: config.JWT_EXPIRES_IN } as any
    )

    const refreshToken = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    })

    return { accessToken, refreshToken }
  }
}
