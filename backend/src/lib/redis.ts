import Redis from 'ioredis'
import { config } from '../config/env'

export const redis = new Redis(config.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error', (err) => console.error('❌ Redis error:', err.message))

// ─── Cache helpers ────────────────────────────────────────

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  },

  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  },
}

// ─── Rate limiting helpers ────────────────────────────────

export const rateLimiter = {
  async checkLoginAttempts(identifier: string): Promise<number> {
    const key = `login:attempts:${identifier}`
    const attempts = await redis.incr(key)
    if (attempts === 1) await redis.expire(key, 1800) // 30 min window
    return attempts
  },

  async resetLoginAttempts(identifier: string): Promise<void> {
    await redis.del(`login:attempts:${identifier}`)
  },

  async isBlocked(identifier: string): Promise<boolean> {
    const attempts = await redis.get(`login:attempts:${identifier}`)
    return parseInt(attempts || '0') >= 5
  },
}

// ─── OTP helpers ─────────────────────────────────────────

export const otpStore = {
  async save(phone: string, code: string): Promise<void> {
    await redis.setex(`otp:${phone}`, 300, code) // 5 min TTL
  },

  async verify(phone: string, code: string): Promise<boolean> {
    const stored = await redis.get(`otp:${phone}`)
    if (!stored || stored !== code) return false
    await redis.del(`otp:${phone}`)
    return true
  },
}

// ─── Refresh token blacklist ──────────────────────────────

export const tokenBlacklist = {
  async add(token: string, ttlSeconds: number): Promise<void> {
    await redis.setex(`blacklist:${token}`, ttlSeconds, '1')
  },

  async isBlacklisted(token: string): Promise<boolean> {
    return (await redis.exists(`blacklist:${token}`)) === 1
  },
}
