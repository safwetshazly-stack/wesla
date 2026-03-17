import { prisma } from '../../lib/prisma'
import { cache } from '../../lib/redis'
import { AppError } from '../../lib/errors'

interface SearchQuery {
  skill?: string
  governorate?: string
  minPrice?: number
  maxPrice?: number
  availableNow?: boolean
  minRating?: number
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'
  language?: string
  sortBy?: string
  page: number
  limit: number
}

export class UsersService {
  // ─── Search helpers ──────────────────────────────────
  async searchHelpers(query: SearchQuery) {
    const cacheKey = `helpers:search:${JSON.stringify(query)}`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    const where: any = {
      userType: 'HELPER',
      verificationStatus: 'VERIFIED',
    }

    if (query.skill) {
      where.skills = { has: query.skill }
    }
    if (query.governorate) {
      where.governorate = query.governorate
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.hourlyRateEgp = {}
      if (query.minPrice !== undefined) where.hourlyRateEgp.gte = query.minPrice
      if (query.maxPrice !== undefined) where.hourlyRateEgp.lte = query.maxPrice
    }
    if (query.minRating !== undefined) {
      where.ratingAvg = { gte: query.minRating }
    }
    if (query.experienceLevel) {
      where.experienceLevel = query.experienceLevel
    }
    if (query.language) {
      where.languages = { has: query.language }
    }

    // Sort logic
    let orderBy: any = { ratingAvg: 'desc' }
    switch (query.sortBy) {
      case 'price_asc': orderBy = { hourlyRateEgp: 'asc' }; break
      case 'price_desc': orderBy = { hourlyRateEgp: 'desc' }; break
      case 'response_time': orderBy = { responseTimeMinutes: 'asc' }; break
      case 'sessions': orderBy = { totalSessions: 'desc' }; break
    }

    const skip = (query.page - 1) * query.limit

    const [helpers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: {
          id: true,
          fullName: true,
          profileImageUrl: true,
          bio: true,
          governorate: true,
          city: true,
          skills: true,
          experienceLevel: true,
          hourlyRateEgp: true,
          ratingAvg: true,
          totalSessions: true,
          responseTimeMinutes: true,
          languages: true,
          verificationStatus: true,
          lastActiveAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    const result = {
      helpers,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    }

    await cache.set(cacheKey, result, 60)
    return result
  }

  // ─── Get helper public profile ────────────────────────
  async getHelperProfile(helperId: string) {
    const cacheKey = `helper:${helperId}:public`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    const helper = await prisma.user.findFirst({
      where: { id: helperId, userType: 'HELPER' },
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true,
        bio: true,
        governorate: true,
        city: true,
        skills: true,
        experienceLevel: true,
        hourlyRateEgp: true,
        ratingAvg: true,
        totalSessions: true,
        responseTimeMinutes: true,
        languages: true,
        verificationStatus: true,
        availability: true,
        lastActiveAt: true,
        createdAt: true,
        reviewsReceived: {
          where: { isPublished: true },
          orderBy: { publishedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            ratingOverall: true,
            comment: true,
            publishedAt: true,
            reviewer: {
              select: { id: true, fullName: true, profileImageUrl: true },
            },
          },
        },
      },
    })

    if (!helper) throw new AppError('المساعد غير موجود.', 404)
    await cache.set(cacheKey, helper, 300)
    return helper
  }

  // ─── Get own profile ──────────────────────────────────
  async getProfile(userId: string) {
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
        lastActiveAt: true,
        createdAt: true,
      },
    })
    if (!user) throw new AppError('المستخدم غير موجود.', 404)
    return user
  }

  // ─── Update profile ───────────────────────────────────
  async updateProfile(userId: string, data: any) {
    // Validate rate range for helpers
    if (data.hourlyRateEgp !== undefined) {
      if (data.hourlyRateEgp < 20 || data.hourlyRateEgp > 300) {
        throw new AppError('يجب أن يكون السعر بين 20 و 300 جنيه.', 400)
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        fullName: true,
        bio: true,
        governorate: true,
        city: true,
        languages: true,
        skills: true,
        experienceLevel: true,
        hourlyRateEgp: true,
        availability: true,
      },
    })

    // Invalidate cache
    await cache.del(`user:${userId}:profile`)
    await cache.del(`helper:${userId}:public`)

    return updated
  }

  // ─── Reviews ──────────────────────────────────────────
  async getUserReviews(userId: string, page = 1) {
    const limit = 10
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId, isPublished: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          ratingOverall: true,
          ratingExpertise: true,
          ratingComm: true,
          ratingValue: true,
          comment: true,
          publishedAt: true,
          helpfulCount: true,
          reviewer: {
            select: { id: true, fullName: true, profileImageUrl: true },
          },
        },
      }),
      prisma.review.count({ where: { revieweeId: userId, isPublished: true } }),
    ])

    return { reviews, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  // ─── Save / unsave helper ─────────────────────────────
  async saveHelper(seekerId: string, helperId: string) {
    const helper = await prisma.user.findFirst({
      where: { id: helperId, userType: 'HELPER' },
    })
    if (!helper) throw new AppError('المساعد غير موجود.', 404)

    await prisma.savedHelper.upsert({
      where: { seekerId_helperId: { seekerId, helperId } },
      create: { seekerId, helperId },
      update: {},
    })
  }

  async unsaveHelper(seekerId: string, helperId: string) {
    await prisma.savedHelper.deleteMany({ where: { seekerId, helperId } })
  }

  async getSavedHelpers(seekerId: string) {
    const saved = await prisma.savedHelper.findMany({
      where: { seekerId },
      include: {
        helper: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
            skills: true,
            hourlyRateEgp: true,
            ratingAvg: true,
            verificationStatus: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return saved.map((s) => s.helper)
  }
}
