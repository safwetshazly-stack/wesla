import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from './auth.service'

// ─── Validation schemas ──────────────────────────────────

const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^(\+20|0)?1[0125][0-9]{8}$/, 'رقم هاتف مصري غير صحيح'),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'كلمة المرور يجب أن تحتوي على حرف صغير وكبير ورقم على الأقل'
  ),
  userType: z.enum(['HELPER', 'SEEKER']),
})

const loginSchema = z.object({
  identifier: z.string(), // email or phone
  password: z.string(),
})

const otpVerifySchema = z.object({
  phone: z.string(),
  code: z.string().length(6),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

const forgotPasswordSchema = z.object({
  phoneNumber: z.string(),
})

const resetPasswordSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
})

// ─── Routes ──────────────────────────────────────────────

export default async function authRoutes(fastify: FastifyInstance) {
  const svc = new AuthService(fastify)

  // POST /auth/register
  fastify.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
  }, async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const result = await svc.register(body)
    reply.status(201).send({ status: 'success', data: result })
  })

  // POST /auth/login
  fastify.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
  }, async (req, reply) => {
    const body = loginSchema.parse(req.body)
    const result = await svc.login(body)
    reply.send({ status: 'success', data: result })
  })

  // POST /auth/verify-otp
  fastify.post('/verify-otp', async (req, reply) => {
    const body = otpVerifySchema.parse(req.body)
    const result = await svc.verifyOtp(body)
    reply.send({ status: 'success', data: result })
  })

  // POST /auth/refresh
  fastify.post('/refresh', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body)
    const result = await svc.refreshToken(refreshToken)
    reply.send({ status: 'success', data: result })
  })

  // POST /auth/logout
  fastify.post('/logout', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body)
    await svc.logout((req as any).user.id, refreshToken)
    reply.send({ status: 'success', message: 'تم تسجيل الخروج بنجاح.' })
  })

  // POST /auth/forgot-password
  fastify.post('/forgot-password', {
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
  }, async (req, reply) => {
    const { phoneNumber } = forgotPasswordSchema.parse(req.body)
    await svc.forgotPassword(phoneNumber)
    // Always return success to prevent user enumeration
    reply.send({ status: 'success', message: 'إذا كان الرقم مسجلاً، ستتلقى رمز التحقق.' })
  })

  // POST /auth/reset-password
  fastify.post('/reset-password', async (req, reply) => {
    const body = resetPasswordSchema.parse(req.body)
    await svc.resetPassword(body)
    reply.send({ status: 'success', message: 'تم تغيير كلمة المرور بنجاح.' })
  })

  // GET /auth/me
  fastify.get('/me', {
    onRequest: [(fastify as any).authenticate],
  }, async (req, reply) => {
    const user = await svc.getMe((req as any).user.id)
    reply.send({ status: 'success', data: user })
  })
}
