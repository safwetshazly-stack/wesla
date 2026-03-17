import type { FastifyRequest, FastifyReply } from 'fastify'

export interface JwtPayload {
  id: string
  userType: 'HELPER' | 'SEEKER' | 'ADMIN'
  iat: number
  exp: number
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    adminOnly: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: JwtPayload
  }
}
