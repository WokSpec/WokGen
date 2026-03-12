# WokGen — Architecture

## Overview

WokGen is a Next.js 15 App Router application deployed on Vercel. It handles long-running AI generation tasks by immediately returning a job ID and letting the client poll for results — serverless functions can't stay alive for the 10–120s generation times required.

---

## System Components

```
Browser
  │  Next.js App Router (Vercel)
  │  ├── /pixel           Generation UI + polling
  │  ├── /editor          Offline canvas editor
  │  ├── /gallery         Community gallery
  │  └── /eral            Eral companion panel
  │
  └── API Routes
       ├── POST /api/generate  → enqueue job (BullMQ)
       ├── GET  /api/jobs/:id  → poll job status
       ├── GET  /api/gallery   → paginated gallery (Prisma)
       └── POST /api/eral/*    → proxy to Eral API

BullMQ (Redis via Upstash)
  └── Workers (long-running Vercel functions or separate worker process)
       ├── FalWorker         → Fal.ai / FLUX
       ├── ReplicateWorker   → FLUX Pro, ControlNet
       ├── UpscaleWorker     → Real-ESRGAN
       └── AnimateWorker     → multi-frame composite

PostgreSQL (Neon, via Prisma)
  └── Schema: users, generations, gallery_items, usage_logs
```

---

## Generation Flow

```
1. User submits prompt + style
   POST /api/generate → validate → enqueue BullMQ job → return { jobId }

2. Client polls
   GET /api/jobs/:jobId → { status: "pending" | "processing" | "done" | "failed" }

3. Worker picks up job
   FalWorker → calls Fal.ai REST API with pixelArtPrompt(prompt, style, aspectRatio)
   → polls Fal result URL until done
   → writes output URL + metadata to Prisma (generations table)
   → marks job "done"

4. Client receives done + result URL
   → renders generated image
   → optionally saves to gallery (POST /api/gallery)
```

---

## Offline Pixel Editor

The `/editor` route is a pure client-side application. It uses the HTML5 Canvas API directly — no server calls, no API keys. It is built as a Next.js page but functions entirely via browser APIs.

State is managed in React, persisted to `localStorage` on each stroke. Export is `canvas.toDataURL('image/png')` triggered client-side.

This makes the editor the lowest-friction entry point — useful even without auth or API keys.

---

## Database Schema (Key Tables)

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (CUID) | |
| `email` | TEXT | NextAuth-managed |
| `plan` | TEXT | free \| pro (synced from WokAPI) |
| `credits_remaining` | INTEGER | Monthly generation credits |

### `generations`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (CUID) | |
| `user_id` | TEXT | FK → users |
| `prompt` | TEXT | Original prompt |
| `style_preset` | TEXT | One of 18 style IDs |
| `output_url` | TEXT | Fal/Replicate result URL |
| `provider` | TEXT | fal \| replicate |
| `created_at` | DATETIME | |
| `is_public` | BOOLEAN | Gallery visibility |

### `gallery_items`
| Column | Type | Notes |
|---|---|---|
| `generation_id` | TEXT | FK → generations |
| `likes` | INTEGER | |
| `tags` | TEXT[] | |

---

## AI Provider Abstraction

Providers are wrapped in a common interface:

```typescript
interface GenerationProvider {
  generate(params: GenerationParams): Promise<GenerationResult>
}
```

The job worker instantiates the correct provider based on the job's `provider` field. Adding a new provider means implementing `GenerationProvider` and registering it in the worker factory — no changes to the API layer.

---

## Key Design Decisions

**Why BullMQ + Redis instead of Vercel's AI SDK streaming?**  
Generation takes 10–120 seconds depending on the provider and quality tier. Vercel serverless functions time out at 10s (hobby) or 60s (pro). BullMQ decouples request acceptance from execution, allowing the API to return immediately and the browser to poll independently.

**Why Neon (serverless PostgreSQL) instead of Cloudflare D1?**  
WokGen runs on Vercel, not Cloudflare Workers. Neon is the canonical serverless Postgres for Vercel deployments. It has Prisma support, branching for dev environments, and a free tier.

**Why 18 fixed style presets instead of freeform style prompts?**  
Style presets encode validated prompt engineering that produces consistently good pixel art. Freeform style inputs produce inconsistent results and require prompt injection protection. Presets are a UX and quality decision, not a technical limitation.
