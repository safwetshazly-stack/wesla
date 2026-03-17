import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { cache } from '../../lib/redis'

export default async function matchingRoutes(fastify: FastifyInstance) {

  // GET /matching/recommendations — personalized helper suggestions
  fastify.get('/recommendations', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const userId = (req as any).user.id
    const cacheKey = `recommendations:${userId}`
    const cached = await cache.get(cacheKey)
    if (cached) return reply.send({ status: 'success', data: cached })

    // Get seeker's past sessions to understand preferences
    const pastSessions = await prisma.session.findMany({
      where: { seekerId: userId, status: 'COMPLETED' },
      include: { helper: { select: { skills: true, governorate: true } } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })

    // Extract preferred skills & locations
    const skillFrequency: Record<string, number> = {}
    const govFrequency: Record<string, number> = {}
    for (const s of pastSessions) {
      for (const skill of s.helper.skills) {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1
      }
      if (s.helper.governorate) {
        govFrequency[s.helper.governorate] = (govFrequency[s.helper.governorate] || 0) + 1
      }
    }

    const topSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s)

    const topGov = Object.entries(govFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)
      .map(([g]) => g)[0]

    // Build recommendation query
    const where: any = {
      userType: 'HELPER',
      verificationStatus: 'VERIFIED',
      id: { not: userId },
    }
    if (topSkills.length > 0) where.skills = { hasSome: topSkills }
    if (topGov) where.governorate = topGov

    const recommendations = await prisma.user.findMany({
      where,
      orderBy: [{ ratingAvg: 'desc' }, { totalSessions: 'desc' }],
      take: 6,
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true,
        skills: true,
        hourlyRateEgp: true,
        ratingAvg: true,
        totalSessions: true,
        governorate: true,
        lastActiveAt: true,
        verificationStatus: true,
      },
    })

    // Fallback: top-rated helpers if no history
    const result = recommendations.length >= 3
      ? recommendations
      : await prisma.user.findMany({
          where: { userType: 'HELPER', verificationStatus: 'VERIFIED' },
          orderBy: [{ ratingAvg: 'desc' }, { totalSessions: 'desc' }],
          take: 6,
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
            skills: true,
            hourlyRateEgp: true,
            ratingAvg: true,
            totalSessions: true,
            governorate: true,
            lastActiveAt: true,
            verificationStatus: true,
          },
        })

    await cache.set(cacheKey, result, 3600) // 1 hour
    reply.send({ status: 'success', data: result })
  })

  // GET /matching/trending — trending skills
  fastify.get('/trending', async (_, reply) => {
    const cacheKey = 'matching:trending:skills'
    const cached = await cache.get(cacheKey)
    if (cached) return reply.send({ status: 'success', data: cached })

    const recentSessions = await prisma.session.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: { helper: { select: { skills: true } } },
      take: 500,
    })

    const skillCount: Record<string, number> = {}
    for (const s of recentSessions) {
      for (const skill of s.helper.skills) {
        skillCount[skill] = (skillCount[skill] || 0) + 1
      }
    }

    const trending = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, sessionCount: count }))

    await cache.set(cacheKey, trending, 3600)
    reply.send({ status: 'success', data: trending })
  })
}
