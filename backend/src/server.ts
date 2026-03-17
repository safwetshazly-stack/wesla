import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import { config } from './config/env'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis'

// ─── Route modules ────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/users.routes'
import sessionRoutes from './modules/sessions/sessions.routes'
import paymentRoutes from './modules/payments/payments.routes'
import matchingRoutes from './modules/matching/matching.routes'
import notificationRoutes from './modules/notifications/notifications.routes'
import adminRoutes from './modules/admin/admin.routes'

const server = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: config.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
  trustProxy: true,
})

async function buildServer() {
  // ─── Security plugins ──────────────────────────────────
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'wss:'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })

  await server.register(cors, {
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await server.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'لقد تجاوزت الحد المسموح به من الطلبات. حاول مرة أخرى لاحقاً.',
    }),
  })

  await server.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_EXPIRES_IN },
  })

  await server.register(websocket)

  // ─── Decorators ────────────────────────────────────────
  server.decorate('prisma', prisma)
  server.decorate('redis', redis)

  // ─── Auth hook ─────────────────────────────────────────
  server.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة.',
      })
    }
  })

  server.decorate('adminOnly', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
      if (request.user.userType !== 'ADMIN') {
        reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'غير مسموح لك بالوصول إلى هذه الصفحة.',
        })
      }
    } catch {
      reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'غير مصرح.' })
    }
  })

  // ─── Routes ────────────────────────────────────────────
  await server.register(authRoutes, { prefix: '/api/v1/auth' })
  await server.register(userRoutes, { prefix: '/api/v1/users' })
  await server.register(sessionRoutes, { prefix: '/api/v1/sessions' })
  await server.register(paymentRoutes, { prefix: '/api/v1/payments' })
  await server.register(matchingRoutes, { prefix: '/api/v1/matching' })
  await server.register(notificationRoutes, { prefix: '/api/v1/notifications' })
  await server.register(adminRoutes, { prefix: '/api/v1/admin' })

  // ─── Health check ──────────────────────────────────────
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  }))

  // ─── 404 handler ───────────────────────────────────────
  server.setNotFoundHandler((_, reply) => {
    reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'المسار غير موجود.' })
  })

  // ─── Error handler ─────────────────────────────────────
  server.setErrorHandler((error, _, reply) => {
    server.log.error(error)
    const statusCode = error.statusCode || 500
    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Internal Server Error',
      message: statusCode === 500
        ? 'حدث خطأ في الخادم. نعمل على إصلاحه.'
        : error.message,
    })
  })

  return server
}

async function start() {
  try {
    const app = await buildServer()
    await app.listen({ port: config.PORT, host: '0.0.0.0' })
    console.log(`🚀 Wasla API running on port ${config.PORT}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()

export { buildServer }
