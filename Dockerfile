# ─────────────────────────────────────────────────────────────────────────────
# WokGen — Multi-stage Dockerfile
# Builds the Next.js web app with Prisma and serves it from a minimal runtime.
#
# Build:
#   docker build -t wokgen .
#
# Run:
#   docker run -p 3000:3000 --env-file .env.local wokgen
#
# Required env vars (at minimum one AI provider):
#   DATABASE_URL            = file:/data/wokgen.db
#   REPLICATE_API_TOKEN     = r8_...
#   FAL_KEY                 = ...
#   TOGETHER_API_KEY        = ...
#   COMFYUI_HOST            = http://host.docker.internal:8188
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Build dependencies for native addons (prisma, canvas, etc.)
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json ./

# Copy web app manifests
COPY apps/web/package.json ./apps/web/

# Copy Prisma schema before install so postinstall can run prisma generate
COPY apps/web/prisma ./apps/web/prisma/

# Install all workspace dependencies
RUN npm ci --workspace=apps/web --include-workspace-root


# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Bring in installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy full source
COPY . .

# Generate Prisma client (uses schema already present in source)
RUN cd apps/web && npx prisma generate

# Set Next.js telemetry off during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
# DATABASE_URL is required by Prisma at build-time only for schema generation;
# the actual DB is mounted at runtime via the volume.
ENV DATABASE_URL=file:/tmp/build-placeholder.db
ENV NODE_ENV=production

RUN npm run build --workspace=apps/web


# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Persistent data directory — mount as a volume to retain the SQLite DB
RUN mkdir -p /data && chown nextjs:nodejs /data
VOLUME ["/data"]

# ── Copy built artifacts ──────────────────────────────────────────────────────

# Next.js standalone output (set output: 'standalone' in next.config.js for
# minimal image; if not set, we copy .next + public + node_modules instead)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next          ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public         ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json   ./apps/web/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma         ./apps/web/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules   ./apps/web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules            ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json            ./package.json

# ── Entrypoint script ─────────────────────────────────────────────────────────

# The entrypoint runs prisma db push (idempotent migration) then starts Next.
COPY --chown=nextjs:nodejs <<'ENTRYPOINT_EOF' /app/docker-entrypoint.sh
#!/bin/sh
set -e

# Default the database path to the persistent volume if not set
export DATABASE_URL="${DATABASE_URL:-file:/data/wokgen.db}"

echo "[wokgen] Applying database migrations..."
cd /app/apps/web
npx prisma db push --skip-generate --accept-data-loss 2>&1 || true

echo "[wokgen] Starting Next.js on port ${PORT:-3000}..."
exec npm run start --workspace=apps/web -- --port "${PORT:-3000}" --hostname "0.0.0.0"
ENTRYPOINT_EOF

RUN chmod +x /app/docker-entrypoint.sh

# ── Switch to non-root ─────────────────────────────────────────────────────────
USER nextjs

# ── Expose & health-check ──────────────────────────────────────────────────────
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/providers || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
