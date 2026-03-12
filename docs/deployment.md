# WokGen — Deployment Runbook

## Environments

| Environment | URL | Platform |
|---|---|---|
| Production | `https://wokgen.wokspec.org` | Vercel |
| Preview | `https://wokgen-git-<branch>-wokspec.vercel.app` | Vercel (auto per PR) |
| Local dev | `http://localhost:3000` | `npm run web:dev` |

---

## First-Time Setup

### 1. Database (Neon)
1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string (pooled for Vercel serverless)
3. Set `DATABASE_URL` in `.env.local`

```bash
cd apps/web
npx prisma migrate dev    # apply all migrations
npx prisma generate       # generate Prisma client
```

### 2. Redis (Upstash)
1. Create an Upstash Redis database
2. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 3. Auth (NextAuth v5)
```bash
openssl rand -base64 32   # → NEXTAUTH_SECRET
```

Configure GitHub and Google OAuth apps. Callback URLs:
- Local: `http://localhost:3000/api/auth/callback/github`
- Production: `https://wokgen.wokspec.org/api/auth/callback/github`

### 4. AI Providers
```bash
# Fal.ai (primary)
FAL_API_KEY=...

# Replicate (FLUX Pro, Real-ESRGAN)
REPLICATE_API_TOKEN=...
```

### 5. Payments (Stripe)
```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

---

## Full .env.local Reference

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://wokgen.wokspec.org
NEXTAUTH_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI Providers
FAL_API_KEY=...
REPLICATE_API_TOKEN=...

# Queue (Upstash Redis)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

# WokAPI (subscription sync)
WOKAPI_URL=https://api.wokspec.org
WOKAPI_SERVICE_KEY=...  # internal service-to-service key
```

---

## Vercel Deployment

### Auto-deploy
Every push to `main` deploys to production via the Vercel GitHub integration.

### Manual deploy
```bash
npm install -g vercel
cd apps/web
vercel --prod
```

### Environment Variables on Vercel
Set all env vars in the Vercel dashboard under Project Settings → Environment Variables. Use the "Production" scope for live secrets, "Preview" scope for dev credentials.

---

## Database Migrations

```bash
cd apps/web

# Create a new migration
npx prisma migrate dev --name "add_generation_tags"

# Apply migrations in production
# (Vercel runs this automatically via postinstall if configured)
npx prisma migrate deploy

# Inspect the database
npx prisma studio
```

---

## Worker Deployment

BullMQ workers run in long-lived processes. In development, they run in the same Next.js dev server process. In production:

**Option A: Vercel Functions (up to 60s timeout on Pro plan)**  
Workers are invoked as Vercel serverless functions. Use Vercel's `maxDuration = 60` for generation routes.

**Option B: Separate worker service**  
Deploy workers as a standalone Node.js process (e.g., Railway, Fly.io, or a VPS). The worker connects to Redis (Upstash) and Neon from the outside.

---

## Stripe Webhook (Vercel)

1. In Stripe Dashboard → Webhooks, add:  
   `https://wokgen.wokspec.org/api/webhooks/stripe`
2. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Rollback

Vercel keeps deployment history. To rollback:
1. Go to Vercel Dashboard → Deployments
2. Find the previous stable deployment
3. Click "Promote to Production"

Prisma migrations are one-directional. Write reversible migrations and test in the preview branch first.
