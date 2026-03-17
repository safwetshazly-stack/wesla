# Wasla Infrastructure — وصلة

Docker Compose setup for the full Wasla platform stack.

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | React PWA |
| backend | 3001 | Fastify API |
| postgres | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 |

---

## Quick Start (Full Stack)

```bash
# 1. Make sure backend .env exists
cp backend/.env.example backend/.env

# 2. Start everything
docker-compose up --build

# 3. Run DB migration (first time only)
docker exec wasla_backend npx prisma migrate dev --name init

# 4. Seed demo data (optional)
docker exec wasla_backend npm run db:seed
```

Open → **http://localhost:3000**

---

## Useful Commands

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down

# Stop + delete all data (volumes)
docker-compose down -v

# Rebuild a single service
docker-compose up --build backend

# Open Prisma Studio (DB GUI)
docker exec wasla_backend npx prisma studio
# → http://localhost:5555

# Connect to PostgreSQL directly
docker exec -it wasla_postgres psql -U wasla -d wasla_db

# Connect to Redis directly
docker exec -it wasla_redis redis-cli -a wasla_redis_2024
```

---

## Production Deployment

### 1. Change secrets in `backend/.env`

```bash
JWT_SECRET=<openssl rand -hex 64>
JWT_REFRESH_SECRET=<openssl rand -hex 64>
DATABASE_URL=postgresql://user:pass@your-db-host/wasla_db
REDIS_URL=redis://:password@your-redis-host:6379
NODE_ENV=production
```

### 2. Run production build

```bash
NODE_ENV=production docker-compose up -d --build
```

### 3. Recommended hosting (Egypt-region)

| Service | Provider |
|---------|---------|
| Compute | AWS Bahrain (`me-south-1`) or DigitalOcean |
| Database | AWS RDS PostgreSQL or Supabase |
| Redis | AWS ElastiCache or Upstash |
| CDN | Cloudflare |
| Storage | AWS S3 or DigitalOcean Spaces |

---

## Architecture

```
                    ┌──────────────┐
                    │  Cloudflare  │  CDN + DDoS protection
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │    React PWA (Vite)     │  :3000
              │  Arabic RTL · PWA       │
              └────────────┬────────────┘
                           │ HTTPS / WSS
              ┌────────────▼────────────┐
              │   Fastify API Server    │  :3001
              │  JWT · Rate limit · CORS│
              └──┬──────┬──────┬────────┘
                 │      │      │
        ┌────────▼─┐ ┌──▼───┐ ┌▼──────────────┐
        │PostgreSQL│ │Redis │ │External APIs  │
        │  :5432   │ │:6379 │ │Paymob · SMS   │
        └──────────┘ └──────┘ └───────────────┘
```
