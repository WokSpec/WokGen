# WokGen — Deployment Guide

Live URL: **https://wokgen.wokspec.org**
Stack: **Vercel** (Next.js hosting) + **Neon** (serverless Postgres)

---

## Quick deploy checklist

### 1 — Neon database

1. Create a free account at https://neon.tech
2. Create a new project (any region)
3. Copy the **connection string** from the dashboard — it looks like:
   ```
   postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep it handy for step 3.

### 2 — Vercel project

1. Create a free account at https://vercel.com
2. Click **Add New → Project** and import the `WokSpec/WokGen` GitHub repo
3. **Important — set root directory:** in the project settings set **Root Directory** to `apps/web`
4. Vercel will auto-detect Next.js — leave framework preset as-is

### 3 — Environment variables (Vercel dashboard)

In **Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `NEXT_PUBLIC_BASE_URL` | `https://wokgen.wokspec.org` |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `AUTH_SECRET` | Run `openssl rand -base64 32` and paste output |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |
| `RESEND_API_KEY` | Resend API key (domain must be verified in Resend dashboard) |
| `ADMIN_EMAIL` | Email of the GitHub account with admin panel access |
| `TOGETHER_API_KEY` | *(optional)* your Together key |
| `REPLICATE_API_TOKEN` | *(optional)* your Replicate token |
| `FAL_API_KEY` | *(optional)* your fal.ai key |

**GitHub OAuth App setup:**
1. Go to https://github.com/settings/developers → OAuth Apps → New OAuth App
2. Homepage URL: `https://wokgen.wokspec.org`
3. Authorization callback URL: `https://wokgen.wokspec.org/api/auth/callback/github`
4. Copy the Client ID and generate a Client Secret

**Resend email setup (for wokspec.org on Cloudflare):**
1. Create account at https://resend.com
2. Domains → Add Domain → enter `wokspec.org`
3. Add the TXT (SPF) and CNAME (DKIM) records Resend provides into Cloudflare DNS
4. Click Verify in Resend dashboard → emails will send as `noreply@wokspec.org`

### 4 — First database migration

Run this **once** from your local machine after setting up Neon:

```bash
cd apps/web
# If you have a migrations folder:
DATABASE_URL="<your-neon-url>" npx prisma migrate deploy
# If not (first time, no migrations yet):
DATABASE_URL="<your-neon-url>" npx prisma db push
```

Or use Vercel's CLI to pull env vars first:
```bash
npm i -g vercel
vercel link          # link to your project
vercel env pull      # writes .env.local with production vars
cd apps/web && npx prisma db push
```

### 5 — Custom domain

1. In Vercel: **Project → Settings → Domains** → add `wokgen.wokspec.org`
2. Vercel will show you a CNAME target (e.g. `cname.vercel-dns.com`)
3. At your DNS provider, add:
   ```
   Type:  CNAME
   Name:  wokgen
   Value: cname.vercel-dns.com
   TTL:   auto / 3600
   ```
4. TLS is provisioned automatically by Vercel — no action needed

### 6 — Verify

- Visit https://wokgen.wokspec.org/api/health — should return `{"status":"ok","db":"ok"}`
- Visit https://wokgen.wokspec.org — Studio UI should load

---

## Auto-deploys

Vercel automatically deploys on every push to `main`. No CI configuration needed.
Preview deployments are created for every pull request.

---

## GitHub Actions (optional)

`.github/workflows/deploy-prod.yml` is included for optional CI-driven deploys.
Primary deploy is Vercel's native GitHub integration.

To use Vercel CLI deploys from CI, set these GitHub Actions secrets:
- `VERCEL_TOKEN` — from https://vercel.com/account/tokens
- `VERCEL_ORG_ID` — from `.vercel/project.json` after `vercel link`
- `VERCEL_PROJECT_ID` — from `.vercel/project.json`

---

## Docker / self-hosting (alternative)

`Dockerfile` and `docker-compose.prod.yml` at the repo root are kept for self-hosting.
To use them, re-enable `output: 'standalone'` in `apps/web/next.config.js` (see comment).

---

## Provider keys

WokGen supports BYOK (Bring Your Own Key) — users paste their key in the Studio UI.
Server-side keys (`TOGETHER_API_KEY`, etc.) are optional fallbacks set in Vercel dashboard.
