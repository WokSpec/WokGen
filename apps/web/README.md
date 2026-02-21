# WokGen Web — `apps/web`

The Next.js 14 front-end and API for WokGen — a self-hosted AI pixel-art generation studio.

---

## Table of Contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Development workflow](#development-workflow)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Providers](#providers)
- [Database](#database)
- [Docker](#docker)
- [Troubleshooting](#troubleshooting)

---

## Overview

`apps/web` is the full-stack web application layer for WokGen. It provides:

- **Studio** (`/studio`) — interactive pixel-art generation UI with all five tools: Generate, Animate, Rotate, Inpaint, and Scene
- **Gallery** (`/gallery`) — browsable, filterable public gallery of generated assets
- **Docs** (`/docs`) — in-app documentation for setup, providers, and API
- **REST API** (`/api/*`) — provider-agnostic generation endpoint + job tracking + gallery management
- **Provider modules** (`src/lib/providers/`) — unified dispatch layer over Replicate, fal.ai, Together.ai, and local ComfyUI

The app is designed for **self-hosted deployments** — all data lives in a local SQLite database (swappable to PostgreSQL), and you bring your own API keys.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router, TypeScript) |
| Database ORM | [Prisma](https://prisma.io) 5 — SQLite by default |
| Styling | [Tailwind CSS](https://tailwindcss.com) 3 + inline CSS variables |
| AI Providers | Replicate, fal.ai, Together.ai, ComfyUI |
| Runtime | Node.js ≥ 20 |

---

## Quick start

### 1. Install dependencies

From the **repository root** (workspace-aware):

```sh
npm install
```

### 2. Configure environment

Copy the example env file and fill in at least one provider key:

```sh
cp apps/web/.env.example apps/web/.env.local
```

Minimum required for local testing (Together.ai is free, no billing required):

```env
DATABASE_URL=file:./dev.db
TOGETHER_API_KEY=your_together_api_key_here
```

### 3. Initialise the database

```sh
cd apps/web
npx prisma db push
```

This creates the SQLite database at the path specified in `DATABASE_URL` and applies the schema.

### 4. Start the dev server

From the repository root:

```sh
npm run dev
```

Or directly inside `apps/web`:

```sh
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

All variables are read at runtime by the Next.js server. BYOK (bring-your-own-key) values entered in the Studio Settings panel are passed per-request and are never persisted server-side.

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | Prisma database URL. SQLite: `file:./dev.db`. PostgreSQL: `postgresql://user:pass@host/db` |

### Provider keys (at least one recommended)

| Variable | Provider | Cost |
|---|---|---|
| `TOGETHER_API_KEY` | Together.ai — FLUX.1-schnell-Free | **Free**, no billing required |
| `REPLICATE_API_TOKEN` | Replicate — SDXL, FLUX-schnell, FLUX-dev | Free credits for new accounts |
| `FAL_KEY` | fal.ai — FLUX-schnell, FLUX-dev, FLUX-pro | Free trial credits |
| `COMFYUI_HOST` | Local ComfyUI instance URL | **Free** (self-hosted) |

If no cloud provider key is set, the app falls back to **ComfyUI** (`http://127.0.0.1:8188` by default). Users can also supply BYOK keys in the Studio Settings panel without touching server config.

### Optional

| Variable | Default | Description |
|---|---|---|
| `COMFYUI_HOST` | `http://127.0.0.1:8188` | URL of your local ComfyUI instance |
| `COMFYUI_CHECKPOINT` | `v1-5-pruned-emaonly.safetensors` | Default checkpoint name loaded in ComfyUI |
| `GENERATION_TIMEOUT_MS` | `300000` | Max time (ms) to wait for a provider to return a result |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Canonical public URL — used in `sitemap.xml` and `robots.txt` |

---

## Development workflow

### Scripts

Run these from inside `apps/web` or prefix with `--workspace=apps/web` from the root.

```sh
# Start development server with hot reload
npm run dev

# Production build (runs prisma generate then next build)
npm run build

# Start production server (requires npm run build first)
npm run start

# ESLint
npm run lint

# Push schema changes to the database (no migration file — good for dev)
npm run db:push

# Open Prisma Studio (GUI database browser)
npm run db:studio

# Create a named migration (for production deployments)
npm run db:migrate
```

### Type-checking

TypeScript type-checks run as part of `next build`. For an explicit check without building:

```sh
npx tsc --noEmit
```

### Prisma workflow

```sh
# After editing prisma/schema.prisma:
npx prisma generate    # regenerate the client
npx prisma db push     # apply schema to SQLite (dev)

# For production PostgreSQL:
npx prisma migrate dev --name <migration_name>
npx prisma migrate deploy
```

### Adding a new provider

1. Create `src/lib/providers/<name>.ts` — export an async `<name>Generate(params, apiKey)` function returning `GenerateResult`.
2. Add the provider name to `ProviderName` in `src/lib/providers/types.ts`.
3. Register in `src/lib/providers/index.ts` — add to `generate()` switch, `listProviderStatus()`, and `PROVIDER_META`.
4. Update `PROVIDER_CAPABILITIES` in `types.ts`.
5. Add the env var to this README and to `apps/web/.env.example`.

---

## API reference

All routes are under `/api`. The app runs on Node.js runtime (not Edge) to support Prisma and long-running generations.

### `POST /api/generate`

Start a generation job. Runs synchronously and returns the completed result.

**Request body**

```json
{
  "tool":          "generate",
  "provider":      "together",
  "prompt":        "a golden sword, RPG item",
  "negPrompt":     "blurry, noisy",
  "width":         512,
  "height":        512,
  "seed":          42,
  "steps":         4,
  "guidance":      3.5,
  "stylePreset":   "rpg_icon",
  "isPublic":      false,
  "apiKey":        "byok_key_optional",
  "comfyuiHost":   "http://127.0.0.1:8188",
  "modelOverride": "black-forest-labs/FLUX.1-schnell-Free"
}
```

**Response**

```json
{
  "ok":           true,
  "job":          { "id": "...", "status": "succeeded", ... },
  "resultUrl":    "https://...",
  "durationMs":   3200,
  "resolvedSeed": 42
}
```

### `GET /api/generate`

List recent jobs with optional filters.

Query params: `limit`, `cursor`, `tool`, `status`

### `GET /api/jobs/[id]`

Fetch a single job by ID.

### `PATCH /api/jobs/[id]`

Update mutable job fields: `title`, `isPublic`, `tags`.

### `DELETE /api/jobs/[id]`

Hard-delete a job and its associated gallery asset.

### `GET /api/gallery`

List public gallery assets. Query params: `limit`, `cursor`, `tool`, `rarity`, `search`, `sort`.

### `POST /api/gallery`

Promote a succeeded job to the public gallery.

```json
{ "jobId": "...", "title": "Golden Sword", "rarity": "rare", "tags": ["weapon", "rpg"] }
```

### `DELETE /api/gallery?id=<assetId>`

Remove an asset from the gallery (does not delete the source job).

### `GET /api/providers`

Returns all configured providers, their capabilities, and whether keys are set.

### `GET /api/health`

Health check endpoint. Returns `200 OK` with DB ping latency, or `503` if degraded. Suitable for Docker `HEALTHCHECK`, uptime monitors, and load balancer probes.

```json
{
  "status":   "ok",
  "version":  "0.1.0",
  "uptime":   3600,
  "db":       "ok",
  "checks":   { "database": { "ok": true, "latencyMs": 2 } },
  "ts":       "2025-01-01T00:00:00.000Z",
  "totalMs":  4
}
```

---

## Project structure

```
apps/web/
├── prisma/
│   └── schema.prisma           # Job + GalleryAsset models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/       # POST + GET jobs list
│   │   │   ├── jobs/[id]/      # GET, PATCH, DELETE a job
│   │   │   ├── gallery/        # GET, POST, DELETE gallery assets
│   │   │   ├── providers/      # GET provider status
│   │   │   └── health/         # GET health check
│   │   ├── studio/             # Studio page (/studio)
│   │   ├── gallery/            # Gallery page (/gallery)
│   │   ├── docs/               # Docs page (/docs)
│   │   ├── layout.tsx          # Root layout + nav bar
│   │   ├── page.tsx            # Landing page (/)
│   │   ├── not-found.tsx       # Custom 404 page
│   │   ├── error.tsx           # Error boundary
│   │   ├── robots.ts           # /robots.txt generation
│   │   ├── sitemap.ts          # /sitemap.xml generation
│   │   └── globals.css         # WokGen design tokens + global styles
│   ├── components/
│   │   ├── ui/                 # Shared UI primitives
│   │   │   ├── Badge.tsx       # Badge, RarityBadge, ProviderBadge, StatusBadge
│   │   │   ├── Button.tsx      # Button, ButtonGroup, IconButton
│   │   │   ├── Spinner.tsx     # Spinner, SpinnerOverlay
│   │   │   └── index.ts        # Barrel export
│   │   ├── studio/             # Studio-specific components (future extraction)
│   │   └── gallery/            # Gallery-specific components (future extraction)
│   └── lib/
│       ├── db.ts               # Prisma client singleton
│       ├── utils.ts            # Shared utilities: cn, timeAgo, formatDuration, etc.
│       └── providers/
│           ├── types.ts        # Shared types + provider capabilities
│           ├── index.ts        # generate() dispatch + provider utilities
│           ├── replicate.ts    # Replicate API integration
│           ├── fal.ts          # fal.ai queue-based integration
│           ├── together.ts     # Together.ai image generation
│           └── comfyui.ts      # Local ComfyUI REST integration
├── .env.example                # Env var documentation (safe to commit)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Providers

### Together.ai (recommended for first run)

The easiest way to get started. `FLUX.1-schnell-Free` is completely free with no billing required.

1. Sign up at [together.xyz](https://api.together.xyz)
2. Copy your API key from Settings → API Keys
3. Set `TOGETHER_API_KEY=your_key` in `.env.local`

### Replicate

Offers SDXL, FLUX-schnell, and FLUX-dev. Free credits for new accounts.

1. Sign up at [replicate.com](https://replicate.com)
2. Get your token from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
3. Set `REPLICATE_API_TOKEN=r8_...` in `.env.local`

### fal.ai

Fast FLUX inference via a queue-based API. Free trial credits on signup.

1. Sign up at [fal.ai](https://fal.ai)
2. Get your key from [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
3. Set `FAL_KEY=...` in `.env.local`

### ComfyUI (local, fully free)

Run generation locally on your own GPU. No API key required.

1. Install ComfyUI: [github.com/comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI)
2. Download a checkpoint (e.g. `v1-5-pruned-emaonly.safetensors`) into ComfyUI's `models/checkpoints/`
3. Start ComfyUI: `python main.py --listen 0.0.0.0`
4. Set `COMFYUI_HOST=http://127.0.0.1:8188` (or your custom host) in `.env.local`
5. Optionally set `COMFYUI_CHECKPOINT=your_checkpoint_name.safetensors`

---

## Database

### SQLite (default — zero dependency)

The default `DATABASE_URL=file:./dev.db` creates a SQLite file in `apps/web/`. This is ideal for local development and self-hosted single-user deployments.

### PostgreSQL (production)

For multi-user or production deployments, switch to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL=postgresql://user:pass@host:5432/wokgen`
3. Run `npx prisma migrate deploy`

### Schema overview

| Model | Description |
|---|---|
| `Job` | Tracks a single generation request through `pending → running → succeeded/failed`. Stores all inputs, outputs, and provider metadata. |
| `GalleryAsset` | A promoted, curated asset linked to a succeeded `Job`. Powers the public gallery. |

---

## Docker

A multi-stage `Dockerfile` is provided at the repository root (`WokGen/Dockerfile`).

```sh
# Build
docker build -t wokgen-web .

# Run (with SQLite persisted to a local volume)
docker run -d \
  -p 3000:3000 \
  -v wokgen-data:/data \
  -e DATABASE_URL="file:/data/wokgen.db" \
  -e TOGETHER_API_KEY="your_key" \
  --name wokgen \
  wokgen-web
```

The `/data` volume persists the SQLite database across container restarts.

Add a `HEALTHCHECK` in your compose file pointing to `GET /api/health`.

---

## Troubleshooting

### `Error: No API key configured for provider "together"`

Set `TOGETHER_API_KEY` in `.env.local`, or enter your key in the Studio → Settings panel (gear icon, top-right). Keys entered in Settings are stored in your browser's `localStorage` and sent only for the duration of each request — they are never persisted server-side.

### `PrismaClientInitializationError` / database not found

Run `npx prisma db push` from inside `apps/web/`. This creates the SQLite file and applies the schema.

### `ComfyUI is not reachable at http://127.0.0.1:8188`

Make sure ComfyUI is running (`python main.py --listen 0.0.0.0 --port 8188`). If running in Docker, set `COMFYUI_HOST` to the Docker service name or host IP (e.g. `http://host.docker.internal:8188` on Mac/Windows Docker Desktop).

### `Module not found: Can't resolve '@prisma/client'`

The Prisma client is generated from the schema at build time. Run:

```sh
npx prisma generate
```

### Next.js build fails with type errors

Run `npx tsc --noEmit` for a full diagnostic report. Common causes:

- Missing `@types/*` packages — run `npm install` from the repo root
- Stale `.next` directory — delete it and rebuild: `rm -rf .next && npm run build`
- Prisma client out of date — run `npx prisma generate` after any schema change

### Port 3000 already in use

```sh
npm run dev -- -p 3001
```

Or kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`
