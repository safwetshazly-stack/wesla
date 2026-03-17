# وصلة — Wasla Platform

منصة المساعدة الفورية المصرية | Egypt's Instant Assistance Platform

---

## 🗂️ هيكل المشروع

```
wasla/
├── docker-compose.yml          ← تشغيل كل شيء بأمر واحد
├── backend/                    ← Fastify + TypeScript + Prisma
│   ├── src/
│   │   ├── server.ts           ← Entry point
│   │   ├── config/env.ts       ← Environment validation
│   │   ├── lib/                ← prisma, redis, errors, sms
│   │   └── modules/
│   │       ├── auth/           ← Register, Login, OTP, JWT
│   │       ├── users/          ← Profiles, Search helpers
│   │       ├── sessions/       ← Full session lifecycle
│   │       ├── payments/       ← Escrow, Paymob webhook
│   │       ├── matching/       ← Recommendations, trending
│   │       ├── notifications/  ← In-app notifications
│   │       └── admin/          ← Admin dashboard API
│   └── prisma/
│       └── schema.prisma       ← Full database schema
└── frontend/                   ← React 18 + TypeScript + Tailwind
    └── src/
        ├── pages/              ← All page components
        ├── components/         ← Layout + UI components
        ├── hooks/useApi.ts     ← All React Query hooks
        ├── stores/auth.store.ts← Zustand auth state
        └── lib/api.ts          ← Axios + auto refresh
```

---

## 🚀 تشغيل المشروع (3 خطوات فقط)

### المتطلبات المسبقة

تثبيت واحد فقط: **Docker Desktop**

- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt install docker.io docker-compose`

### الخطوة 1 — نسخ ملف البيئة

```bash
cp backend/.env.example backend/.env
```

> ✅ ملف `.env.example` يحتوي على كل القيم الافتراضية للتطوير — لا تحتاج لتغيير أي شيء للبدء

### الخطوة 2 — تشغيل المشروع

```bash
docker-compose up --build
```

انتظر دقيقتين في أول مرة (يحمّل الـ images). بعدها:

| الخدمة | الرابط |
|--------|--------|
| 🌐 Frontend | http://localhost:3000 |
| 🔌 Backend API | http://localhost:3001 |
| 💚 Health check | http://localhost:3001/health |
| 🗄️ PostgreSQL | localhost:5432 |
| ⚡ Redis | localhost:6379 |

### الخطوة 3 — تهيئة قاعدة البيانات

في terminal جديد:

```bash
docker exec wasla_backend npx prisma migrate dev --name init
docker exec wasla_backend npx prisma db seed
```

---

## 🛠️ تشغيل بدون Docker (للتطوير المحلي)

### Backend

```bash
# تأكد من تنصيب Node.js 20+ و PostgreSQL 16 و Redis 7
cd backend
cp .env.example .env
# عدّل DATABASE_URL و REDIS_URL في .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
# يعمل على http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# يعمل على http://localhost:3000
```

---

## 🔑 بيانات الدخول للتطوير

### إنشاء مستخدم Admin

```bash
docker exec -it wasla_postgres psql -U wasla -d wasla_db -c "
UPDATE users SET \"userType\" = 'ADMIN', \"verificationStatus\" = 'VERIFIED'
WHERE email = 'your-email@example.com';
"
```

### في Dev Mode — رمز OTP

عند التسجيل، الـ OTP يُطبع في logs الـ backend:
```
[SMS DEV] To: 01012345678 | Code: 123456
```

شاهد الـ logs:
```bash
docker logs wasla_backend -f
```

---

## 📡 API Endpoints

### Auth
```
POST /api/v1/auth/register      ← تسجيل مستخدم جديد
POST /api/v1/auth/login         ← تسجيل دخول
POST /api/v1/auth/verify-otp    ← التحقق من رمز OTP
POST /api/v1/auth/refresh       ← تجديد الـ access token
POST /api/v1/auth/logout        ← تسجيل خروج
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me            ← بيانات المستخدم الحالي
```

### Users
```
GET  /api/v1/users/helpers             ← بحث المساعدين
GET  /api/v1/users/helpers/:id         ← ملف مساعد
GET  /api/v1/users/profile             ← ملفي الشخصي
PATCH /api/v1/users/profile            ← تعديل الملف
GET  /api/v1/users/:id/reviews         ← تقييمات مستخدم
POST /api/v1/users/saved/:helperId     ← حفظ مساعد
```

### Sessions
```
POST   /api/v1/sessions              ← طلب جلسة جديدة
GET    /api/v1/sessions              ← جلساتي
GET    /api/v1/sessions/:id          ← تفاصيل جلسة
PATCH  /api/v1/sessions/:id/accept   ← قبول طلب
PATCH  /api/v1/sessions/:id/decline  ← رفض طلب
PATCH  /api/v1/sessions/:id/cancel   ← إلغاء
PATCH  /api/v1/sessions/:id/start    ← بدء الجلسة
PATCH  /api/v1/sessions/:id/complete ← إنهاء الجلسة
POST   /api/v1/sessions/:id/review   ← إضافة تقييم
GET    /api/v1/sessions/:id/room     ← رمز غرفة الجلسة
```

### Payments
```
POST /api/v1/payments/initiate  ← بدء عملية دفع
POST /api/v1/payments/webhook   ← Paymob webhook
GET  /api/v1/payments/history   ← سجل المعاملات
POST /api/v1/payments/topup     ← شحن المحفظة
POST /api/v1/payments/withdraw  ← سحب الأموال (مساعدون)
```

### Matching
```
GET /api/v1/matching/recommendations ← مساعدون مقترحون
GET /api/v1/matching/trending        ← المهارات الشائعة
```

### Admin (requires ADMIN role)
```
GET   /api/v1/admin/stats
GET   /api/v1/admin/users
PATCH /api/v1/admin/users/:id/status
GET   /api/v1/admin/verifications
GET   /api/v1/admin/sessions
PATCH /api/v1/admin/sessions/:id/cancel
GET   /api/v1/admin/disputes
PATCH /api/v1/admin/disputes/:id/resolve
GET   /api/v1/admin/finance
```

---

## 🏗️ Architecture

```
Frontend (React PWA)        → CDN (Cloudflare)
          ↓ HTTPS/WSS
API Gateway (Fastify)       → Auth, Rate limiting, CORS
          ↓
Services (Modules)          → Auth, Users, Sessions, Payments, Matching
          ↓
Event Bus (Redis Pub/Sub)   → Notifications, Async jobs
          ↓
Data Stores:
  PostgreSQL                → Primary data (encrypted)
  Redis                     → Cache, sessions, queues
  S3/Spaces                 → File storage (ID docs, avatars)

External:
  Paymob/Fawry              → Egyptian payment gateways
  SMS Gateway               → OTP, notifications
  WebRTC (STUN/TURN)        → Voice/Video sessions
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt cost=12 |
| JWT auth | 15min access + 7d refresh rotation |
| Rate limiting | Redis token bucket, per-user |
| SQL injection | Prisma ORM (parameterized queries) |
| XSS protection | Helmet CSP headers |
| CSRF | SameSite cookies |
| Payment security | HMAC-SHA512 webhook verification |
| Account lockout | 5 failed attempts → 30min block |
| Data encryption | AES-256 at rest (ID documents) |
| OWASP compliance | Full Top 10 coverage |

---

## 🌍 Deployment (Production)

### Environment Variables to Change

```bash
# !! مهم جداً — غيّر هذه في الـ production !!
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
DATABASE_URL=postgresql://user:pass@your-db-host:5432/wasla
REDIS_URL=redis://:password@your-redis-host:6379

# Payment
PAYMOB_API_KEY=<from paymob dashboard>
PAYMOB_HMAC_SECRET=<from paymob dashboard>

# SMS
SMS_API_KEY=<from smsmisr.com>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

### Generate secure secrets

```bash
# Linux/Mac
openssl rand -hex 64

# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(64, 10)
```

### Deploy with Docker

```bash
# Production
NODE_ENV=production docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down
```

---

## 🗓️ Development Roadmap

### Phase 1 (MVP — Current)
- [x] User registration + OTP verification
- [x] Helper KYC (national ID)
- [x] Session lifecycle (request → accept → pay → join → complete)
- [x] Egyptian payment methods (Vodafone Cash, Paymob)
- [x] Wallet + escrow system
- [x] Rating & review system (24h delay)
- [x] Admin dashboard
- [x] Real-time notifications
- [x] WebRTC voice/video/chat rooms
- [x] Arabic RTL interface

### Phase 2
- [ ] Native mobile apps (React Native)
- [ ] File sharing in sessions
- [ ] Screen sharing
- [ ] AI-powered matching improvements
- [ ] SMS notifications
- [ ] Push notifications (FCM)
- [ ] Dispute resolution workflow

### Phase 3
- [ ] University partnerships
- [ ] Subscription packages
- [ ] Analytics dashboard
- [ ] Multi-city expansion

---

## 📞 Support

للأسئلة التقنية: افتح issue على GitHub
للمشاكل الأمنية: أرسل تقريراً مباشراً (لا تفتح issue عام)

---

**وصلة — نربط المعرفة بمن يحتاجها** 🇪🇬
