# Stage 0 — builder
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build deps
RUN apk add --no-cache python3 make g++ bash curl openssl

# Copy package manifests first for better layer caching
COPY package*.json ./

# No package-lock.json at the apps/web level (monorepo root-level lockfile).
# Use npm install instead of npm ci.
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Generate Prisma client if schema present
RUN if [ -d prisma ]; then npx prisma generate || true; fi

# Ensure Next.js standalone output is enabled (next.config.js must have output: 'standalone')
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Placeholder DATABASE_URL for build-time schema validation only
ENV DATABASE_URL=file:/tmp/build-placeholder.db

RUN npm run build

# Stage 1 — runtime
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl wget

WORKDIR /app

# Copy standalone output (Next.js standalone)
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
# public/ may be empty; copy only if it exists
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/prisma ./prisma

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
