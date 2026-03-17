import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { UsersService } from './users.service'

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']).optional(),
  hourlyRateEgp: z.number().min(20).max(300).optional(),
  availability: z.record(z.array(z.string())).optional(),
})

const searchSchema = z.object({
  skill: z.string().optional(),
  governorate: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  availableNow: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']).optional(),
  language: z.string().optional(),
  sortBy: z.enum(['rating', 'price_asc', 'price_desc', 'response_time', 'sessions']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export default async function userRoutes(fastify: FastifyInstance) {
  const svc = new UsersService()

  // GET /users/helpers — search helpers
  fastify.get('/helpers', async (req, reply) => {
    const query = searchSchema.parse(req.query)
    const result = await svc.searchHelpers(query)
    reply.send({ status: 'success', data: result })
  })

  // GET /users/helpers/:id — helper public profile
  fastify.get('/helpers/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const helper = await svc.getHelperProfile(id)
    reply.send({ status: 'success', data: helper })
  })

  // GET /users/profile — own profile
  fastify.get('/profile', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const user = await svc.getProfile((req as any).user.id)
    reply.send({ status: 'success', data: user })
  })

  // PATCH /users/profile — update own profile
  fastify.patch('/profile', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const body = updateProfileSchema.parse(req.body)
    const user = await svc.updateProfile((req as any).user.id, body)
    reply.send({ status: 'success', data: user })
  })

  // GET /users/:id/reviews — public reviews for a user
  fastify.get('/:id/reviews', async (req, reply) => {
    const { id } = req.params as { id: string }
    const page = z.coerce.number().default(1).parse((req.query as any).page)
    const reviews = await svc.getUserReviews(id, page)
    reply.send({ status: 'success', data: reviews })
  })

  // POST /users/saved/:helperId — save a helper
  fastify.post('/saved/:helperId', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { helperId } = req.params as { helperId: string }
    await svc.saveHelper((req as any).user.id, helperId)
    reply.send({ status: 'success', message: 'تم حفظ المساعد.' })
  })

  // DELETE /users/saved/:helperId
  fastify.delete('/saved/:helperId', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { helperId } = req.params as { helperId: string }
    await svc.unsaveHelper((req as any).user.id, helperId)
    reply.send({ status: 'success', message: 'تم إلغاء الحفظ.' })
  })

  // GET /users/saved — list saved helpers
  fastify.get('/saved', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const saved = await svc.getSavedHelpers((req as any).user.id)
    reply.send({ status: 'success', data: saved })
  })
}
