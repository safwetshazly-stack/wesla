# Wasla Backend — وصلة

API server built with **Fastify + TypeScript + Prisma + PostgreSQL + Redis**

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start PostgreSQL & Redis (via Docker)
docker run -d --name wasla_pg -e POSTGRES_USER=wasla -e POSTGRES_PASSWORD=wasla_secret_2024 -e POSTGRES_DB=wasla_db -p 5432:5432 postgres:16-alpine
docker run -d --name wasla_redis -p 6379:6379 redis:7-alpine redis-server --requirepass wasla_redis_2024

# 4. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed demo data
npm run db:seed

# 6. Start dev server
npm run dev
# → http://localhost:3001
```

---

## Project Structure

```
src/
├── server.ts              ← Fastify app entry point
├── config/
│   └── env.ts             ← Zod-validated environment variables
├── lib/
│   ├── prisma.ts          ← Prisma client singleton
│   ├── redis.ts           ← Redis client + cache helpers
│   ├── errors.ts          ← AppError class
│   ├── sms.ts             ← OTP sending (dev: logs to console)
│   ├── email.ts           ← Email sending (dev: logs to console)
│   └── seed.ts            ← Demo data seeder
├── types/
│   └── fastify.d.ts       ← TypeScript augmentations
└── modules/
    ├── auth/              ← Register, Login, OTP, JWT, Refresh
    ├── users/             ← Profiles, Search, Save helpers
    ├── sessions/          ← Full session lifecycle
    ├── payments/          ← Escrow, Paymob webhook, Wallet
    ├── matching/          ← Recommendations, Trending skills
    ├── notifications/     ← In-app notifications
    └── admin/             ← Admin dashboard API
```

---

## API Base URL

```
http://localhost:3001/api/v1
```

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/verify-otp` | Verify phone OTP |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/users/helpers` | Search helpers |
| POST | `/sessions` | Request a session |
| PATCH | `/sessions/:id/accept` | Helper accepts |
| POST | `/payments/initiate` | Start payment |
| POST | `/payments/webhook` | Paymob webhook |
| GET  | `/matching/recommendations` | Personalized helpers |
| GET  | `/admin/stats` | Admin dashboard stats |

---

## Scripts

```bash
npm run dev          # Development with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled output
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio GUI
npm run db:reset     # Reset database (WARNING: deletes all data)
```

---

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@wasla.eg | Test1234 |
| Helper | ahmed@wasla.eg | Test1234 |
| Helper | sara@wasla.eg | Test1234 |
| Seeker | user@wasla.eg | Test1234 |

> **OTP in dev mode** → appears in terminal: `[SMS DEV] To: 010xxx | Code: 123456`

---

## Security

- JWT access tokens (15min) + refresh token rotation (7d)
- bcrypt password hashing (cost=12)
- Redis-based rate limiting (100 req/min global, 5 login attempts)
- Paymob webhook HMAC-SHA512 verification
- Helmet security headers
- Zod input validation on every route
- Row-level ownership checks on every protected resource
