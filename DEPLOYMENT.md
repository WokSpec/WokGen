# WokGen — Deployment Checklist (`wokspec.org/wokgen`)

This document walks through every manual step needed to go from this repository
to a running production instance. Follow the steps in order.

---

## 1. Provision a host

- Install Docker ≥ 24 and Docker Compose v2 (`docker compose`)
- Create a deployment directory: `mkdir -p /srv/wokgen && cd /srv/wokgen`
- Harden the host: firewall allows only ports 22 (SSH), 80, and 443

## 2. Get the code / image onto the server

**Option A — clone repo and build on server:**
```bash
git clone https://github.com/WokSpec/WokGen.git /srv/wokgen
cd /srv/wokgen
docker compose -f docker-compose.prod.yml up -d --build
```

**Option B — pull pre-built image from registry (after CI pushes it):**
```bash
docker pull wokspec/wokgen:latest
# then use docker-compose.prod.yml with `image:` instead of `build:`
docker compose -f docker-compose.prod.yml up -d
```

## 3. Configure secrets (REQUIRED before first start)

Copy the example file and fill every placeholder:
```bash
cp apps/web/.env.production.example apps/web/.env.production
nano apps/web/.env.production   # or use your secrets manager
```

Required values:
| Variable | Example / Notes |
|---|---|
| `DATABASE_URL` | `postgresql://wokgen:STRONG_PASS@db:5432/wokgen` |
| `NEXT_PUBLIC_BASE_URL` | `https://wokspec.org/wokgen` |
| `NEXTAUTH_SECRET` | 32+ char random string: `openssl rand -base64 32` |

Optional provider keys (for centralised AI access):
| Variable | Where to get it |
|---|---|
| `TOGETHER_API_KEY` | https://api.together.xyz/settings/api-keys |
| `REPLICATE_API_TOKEN` | https://replicate.com/account/api-tokens |
| `FAL_API_KEY` | https://fal.ai/dashboard/keys |

> **Security:** Never commit `.env.production` to git. Inject via Docker secrets,
> environment variables in your orchestrator, or a secrets manager (Vault, AWS SSM, etc.).

## 4. Run database migrations

After the containers are up and `DATABASE_URL` is set, run migrations:

```bash
# From the server inside the web container:
docker compose -f docker-compose.prod.yml exec web sh -c "cd /app && npx prisma migrate deploy"

# Or use the helper script (if running outside Docker):
cd apps/web
DATABASE_URL="postgresql://..." ./prisma-deploy.sh
```

> **First deploy:** If you have no migration history, `prisma migrate deploy` may fail.
> In that case fall back to `prisma db push` (non-destructive schema sync):
> ```bash
> docker compose -f docker-compose.prod.yml exec web sh -c "npx prisma db push"
> ```

## 5. DNS setup

- Create an **A record** pointing your domain (e.g. `wokspec.org`) to the server's public IP.
- TTL: start with 300 s (5 min) for easier rollback; raise to 3600 after stable.
- If deploying on a sub-path (`/wokgen`), configure your reverse proxy accordingly (see step 6).

## 6. TLS / HTTPS with Caddy (recommended)

Create a `Caddyfile` in `/srv/wokgen/`:

```
wokspec.org {
    reverse_proxy /wokgen/* web:3000
    # Caddy auto-provisions Let's Encrypt certs
}
```

Then uncomment the `caddy` service in `docker-compose.prod.yml` and mount the Caddyfile:

```yaml
caddy:
  image: caddy:2-alpine
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - caddy_data:/data
    - caddy_config:/config
    - ./Caddyfile:/etc/caddy/Caddyfile:ro
  depends_on:
    - web
```

Also uncomment the `caddy_data` and `caddy_config` volumes at the bottom of the compose file.

## 7. GitHub Actions CI/CD (optional)

To use the workflow in `.github/workflows/deploy-prod.yml`, set these GitHub repository secrets:

| Secret | Purpose |
|---|---|
| `DOCKERHUB_USERNAME` | DockerHub account name |
| `DOCKERHUB_TOKEN` | DockerHub access token |
| `DEPLOY_SSH_HOST` | Server IP or hostname |
| `DEPLOY_SSH_USER` | SSH user on server |
| `DEPLOY_SSH_KEY` | Private SSH key (PEM) |

Push to `deploy/wokgen-prod` branch to trigger the workflow. All push/deploy steps are
skipped gracefully if the secrets are not set.

## 8. Verify deployment

```bash
# Health check (should return HTTP 200 and JSON with status: "ok")
curl -sf https://wokspec.org/wokgen/api/health | jq .

# Or from the server:
curl -sf http://localhost:3000/api/health | jq .
```

Expected response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "db": "ok",
  "checks": { "database": { "ok": true } }
}
```

If `status` is `"degraded"` and `db` is `"error"`, check `DATABASE_URL` and that migrations ran.

## 9. Post-deploy checklist

- [ ] DNS resolves to the correct IP (`dig wokspec.org`)
- [ ] HTTPS works without cert warnings (`curl -I https://wokspec.org/wokgen`)
- [ ] `/api/health` returns `status: "ok"`
- [ ] Studio UI loads at `https://wokspec.org/wokgen`
- [ ] Gallery page loads (requires at least 0 jobs — empty state is fine)
- [ ] (Optional) Test a generation with one provider key configured

## 10. Useful operational commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f web

# Restart web only
docker compose -f docker-compose.prod.yml restart web

# Pull latest image and redeploy
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d

# Access database shell
docker compose -f docker-compose.prod.yml exec db psql -U wokgen -d wokgen

# Run Prisma Studio (dev only — do NOT expose publicly)
docker compose -f docker-compose.prod.yml exec web sh -c "DATABASE_URL=... npx prisma studio"
```

---

*Generated by GitHub Copilot CLI. Last updated: 2026-02-21.*
