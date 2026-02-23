# WokGen — Environment Variable Reference

Complete reference for all environment variables. Set these in `apps/web/.env.local` for local development, and in the Vercel/Render dashboard for production.

Legend: **Required** = app won't start without it · **Optional** = degrades gracefully

---

## Quick Reference by System

- [Core](#core)
- [Auth Providers](#auth-providers)
- [AI / Inference Providers](#ai--inference-providers)
- [Email](#email)
- [Caching & Rate Limiting](#caching--rate-limiting)
- [Billing (Stripe)](#billing-stripe)
- [Monitoring & Observability](#monitoring--observability)
- [Feature Flags & Tuning Knobs](#feature-flags--tuning-knobs)
- [Admin](#admin)
- [Local Dev vs Production Differences](#local-dev-vs-production-differences)

---

## Core

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Required | PostgreSQL connection string. Use the **pooled** (PgBouncer) URL from Neon for production. Format: `postgresql://user:pass@host:6432/db?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | ✅ Required (prod) | **Direct** PostgreSQL connection (non-pooled, port 5432). Used by Prisma migrate only. Same credentials as `DATABASE_URL` but port 5432, no `pgbouncer=true`. |
| `NEXT_PUBLIC_BASE_URL` | ✅ Required | Public URL of the app. E.g. `https://wokgen.wokspec.org`. Used in OAuth callbacks and email links. |
| `NEXT_TELEMETRY_DISABLED` | Optional | Set to `1` to disable Next.js telemetry. |
| `HOSTNAME` | Optional (Docker) | Set to `0.0.0.0` for Docker/Render to listen on all interfaces. |
| `NODE_ENV` | Set by platform | `production` or `development`. Do not set manually. |

**Local dev minimum:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wokgen
NEXT_PUBLIC_BASE_URL=http://localhost:3000
AUTH_SECRET=any-random-string-for-local-dev
```

---

## Auth Providers

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | ✅ Required | NextAuth v5 signing secret. Generate with `openssl rand -base64 32`. Must be consistent across all instances. |
| `AUTH_GITHUB_ID` | Required for GitHub login | GitHub OAuth App Client ID. [Create at github.com/settings/developers](https://github.com/settings/developers). |
| `AUTH_GITHUB_SECRET` | Required for GitHub login | GitHub OAuth App Client Secret. |
| `AUTH_GOOGLE_ID` | Required for Google login | Google OAuth Client ID. [Create at console.cloud.google.com](https://console.cloud.google.com). |
| `AUTH_GOOGLE_SECRET` | Required for Google login | Google OAuth Client Secret. |

**GitHub OAuth App setup:**
1. github.com/settings/developers → OAuth Apps → New OAuth App
2. Homepage URL: `https://wokgen.wokspec.org`
3. Authorization callback: `https://wokgen.wokspec.org/api/auth/callback/github`

**Local dev:**
- Use `http://localhost:3000` as homepage URL and `http://localhost:3000/api/auth/callback/github` as callback
- Create a separate OAuth App for local dev; do not share the production app's credentials

---

## AI / Inference Providers

All provider keys are optional — the app falls back to Pollinations (no key) if nothing else is configured. See `apps/web/src/lib/provider-router.ts` for the full fallback chain.

| Variable | Provider | Tier | Description |
|----------|----------|------|-------------|
| `TOGETHER_API_KEY` | Together.ai | Standard | Free tier available. Powers FLUX.1-schnell-Free. Highest-priority standard provider for most modes. Get at [api.together.ai](https://api.together.ai). |
| `HF_TOKEN` | Hugging Face | Standard | Free inference API token. Powers FLUX.1-schnell on HuggingFace. Get at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens). |
| `FAL_KEY` | fal.ai | HD | Credits-based. Powers HD generation (FLUX.1-dev, LoRA). Get at [fal.ai](https://fal.ai). |
| `REPLICATE_API_TOKEN` | Replicate | HD | Credits-based. Powers HD generation, animation, and Vector (Recraft V3 SVG). Get at [replicate.com](https://replicate.com). |
| `GROQ_API_KEY` | Groq | Standard | Free tier generous. Powers Eral AI (llama-3.3-70b-versatile) and prompt enhance. Get at [console.groq.com](https://console.groq.com). |
| `GOOGLE_AI_API_KEY` | Google AI | Standard | Free tier available. Powers Eral Gemini variant. Get at [aistudio.google.com](https://aistudio.google.com). |
| `MISTRAL_API_KEY` | Mistral | Standard | Free tier available. Powers Eral Fast variant. Get at [console.mistral.ai](https://console.mistral.ai). |
| `HF_TOKEN` | Hugging Face | Standard | Also used for TTS (Voice mode: Kokoro-82M). Same token as inference above. |

**Priority order (standard generation — pixel mode):**
```
together → huggingface → pollinations (no key)
```

**Priority order (HD generation — pixel mode):**
```
fal → replicate → together → pollinations (no key)
```

Full matrix: see `apps/web/src/lib/provider-router.ts`.

---

## Email

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Required for email | Resend API key. Powers transactional email (magic link auth, notifications). Get at [resend.com](https://resend.com). |

**Resend setup for wokspec.org on Cloudflare:**
1. resend.com → Domains → Add Domain → `wokspec.org`
2. Add TXT (SPF) and CNAME (DKIM) records to Cloudflare DNS
3. Verify in Resend dashboard
4. Emails send as `noreply@wokspec.org`

---

## Caching & Rate Limiting

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis REST URL. **Strongly recommended for production** — enables distributed rate limiting (correct across all Vercel instances) and gallery cache. Get at [upstash.com](https://upstash.com). |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST token. Required if `UPSTASH_REDIS_REST_URL` is set. |

**Without Redis:** Falls back to Postgres-backed rate limiting (~10ms per check). In-memory is the last resort and is NOT safe across multiple serverless instances.

**With Redis:** Rate limiting is instant (<1ms), shared across all instances. Also enables gallery cache (TTL: 60s) and generation deduplication.

**Scaling:** Free tier handles ~10k commands/day. For 200k DAU, use Upstash Pro (~$0.20/100k commands).

---

## Billing (Stripe)

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Required for billing | Stripe secret key (`sk_live_...` for prod, `sk_test_...` for staging). |
| `STRIPE_WEBHOOK_SECRET` | Required for billing | Stripe webhook signing secret (`whsec_...`). Set after creating the webhook endpoint in Stripe dashboard. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required for billing UI | Stripe publishable key (`pk_live_...` for prod). |
| `STRIPE_PLUS_PRICE_ID` | Required for Plus plan | Stripe Price ID for the Plus subscription. |
| `STRIPE_PRO_PRICE_ID` | Required for Pro plan | Stripe Price ID for the Pro subscription. |
| `STRIPE_MAX_PRICE_ID` | Required for Max plan | Stripe Price ID for the Max subscription. |
| `STRIPE_CREDIT_PACK_SMALL_PRICE_ID` | Required for credit packs | Stripe Price ID for small credit pack (one-time). |
| `STRIPE_CREDIT_PACK_LARGE_PRICE_ID` | Required for credit packs | Stripe Price ID for large credit pack (one-time). |

**Webhook setup:**
1. Stripe dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://wokgen.wokspec.org/api/billing/webhook`
3. Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

**Local testing with Stripe CLI:**
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
# Copy the webhook signing secret it outputs → STRIPE_WEBHOOK_SECRET
```

---

## Monitoring & Observability

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for error tracking. Both client and server errors are captured. Free tier: 5k errors/month. Get at [sentry.io](https://sentry.io). |
| `METRICS_SECRET` | Optional | Secret for the `/api/metrics` Prometheus endpoint. If set, requests must include `Authorization: Bearer <METRICS_SECRET>`. |

**Sentry config files:**
- `apps/web/sentry.client.config.ts` — client-side init
- `apps/web/sentry.server.config.ts` — server-side init

**Metrics endpoint:**
```
GET /api/metrics
Authorization: Bearer <METRICS_SECRET>
```
Returns Prometheus-format metrics (generation counts, error rates, latency).

---

## Feature Flags & Tuning Knobs

These can be changed at runtime by updating the env var in the Vercel dashboard (no redeploy needed for server-side vars; redeploy needed for `NEXT_PUBLIC_*`).

| Variable | Default | Description |
|----------|---------|-------------|
| `MAINTENANCE_MODE` | `false` | Set to `true` to return 503 on all routes except `/api/health`. Use during deployments or incidents. |
| `DISABLE_SIGNUPS` | `false` | Set to `true` to prevent new account creation. Existing users can still log in. |
| `DISABLE_GUEST_GENERATION` | `false` | Set to `true` to require authentication for all generation requests. |
| `ENABLE_QUALITY_GATE` | `true` | Set to `false` to disable the entropy-based image quality check. Useful if the quality gate is over-rejecting outputs during model experiments. |
| `GENERATION_CONCURRENCY` | `10` | Maximum simultaneous AI provider calls per serverless function instance. Reduce if hitting provider rate limits. |
| `MAX_BATCH_SIZE` | `8` | Maximum number of images per batch generation request. |
| `PROMPT_ENGINE` | `wokspec` | Set to `oss` to use the OSS stub prompt builders (`packages/prompts/`) instead of the internal quality builders. |

---

## Admin

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_EMAIL` | Optional | Email address of the GitHub account that has access to the admin panel (`/admin`). Must match the email on the user's GitHub account. |

The admin panel is at `/admin` and is gated by session auth + email check against `ADMIN_EMAIL`.

---

## Local Dev vs Production Differences

| Setting | Local Dev | Production |
|---------|-----------|------------|
| `DATABASE_URL` | `postgresql://localhost:5432/wokgen` (direct) | Neon pooled URL (port 6432) |
| `DIRECT_URL` | Not needed (direct URL is `DATABASE_URL`) | Neon direct URL (port 5432) |
| `AUTH_SECRET` | Any random string | `openssl rand -base64 32` |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | `https://wokgen.wokspec.org` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` CLI | From Stripe dashboard webhook |
| Redis | Not needed (Postgres fallback) | Strongly recommended |
| Sentry | Not needed | Recommended |

**Minimum `.env.local` for local dev (generation works without provider keys via Pollinations):**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wokgen
NEXT_PUBLIC_BASE_URL=http://localhost:3000
AUTH_SECRET=localsecret
AUTH_GITHUB_ID=<your-local-oauth-app-client-id>
AUTH_GITHUB_SECRET=<your-local-oauth-app-client-secret>
```

**Add these for a richer local dev experience:**
```env
TOGETHER_API_KEY=        # Enables Together as standard provider
HF_TOKEN=               # Enables HuggingFace fallback
GROQ_API_KEY=           # Enables Eral AI assistant
FAL_KEY=                # Enables HD generation
REPLICATE_API_TOKEN=    # Enables HD + Vector mode
```
