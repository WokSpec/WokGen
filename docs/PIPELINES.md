# WokGen — Pipeline Catalog

Complete reference for every pipeline in the WokGen codebase, organized by category. Each section explains what the pipeline does, where the code lives, and how to develop on or contribute to it.

---

## Categories

- [A — CI/CD Pipelines](#a--cicd-pipelines)
- [B — Generation Pipelines](#b--generation-pipelines)
- [C — Data & Asset Pipeline](#c--data--asset-pipeline)
- [D — Deployment Pipelines](#d--deployment-pipelines)
- [E — Web App Dev Pipeline](#e--web-app-dev-pipeline)

---

## A — CI/CD Pipelines

All workflows live in `.github/workflows/`. They run on GitHub Actions.

### A1 — `ci.yml` — Quality Gate (PRs and main)

**Triggers:** push to `main`, any pull request targeting `main`

**Jobs:**

| Job | What it checks |
|-----|---------------|
| `type-check` | `cd apps/web && npx tsc --noEmit` — zero TypeScript errors |
| `lint` | `cd apps/web && npx eslint src/**/*.{ts,tsx}` — zero new warnings |
| `secret-scan` | Gitleaks — blocks commits containing API keys or credentials |

**Key details:**
- Lint job uses `continue-on-error: false` but allows `|| true` as a grace period during active development — remove the `|| true` once lint debt is cleared
- `GITLEAKS_LICENSE` secret must be set in repo settings for the secret-scan job; it runs in `continue-on-error: true` mode if the license is absent
- Node version: **18** (intentional — matches Vercel's default runtime for Next.js 14)

**How to contribute:**
- Add a new lint rule: edit `apps/web/.eslintrc.json`
- Add a new job (e.g. unit tests): add a `jobs:` entry in `ci.yml` mirroring the existing structure
- To test locally: `npm install -g act && act pull_request`

---

### A2 — `deploy-prod.yml` — Production Deploy

**Triggers:** push to `main`, manual `workflow_dispatch`

**What it does:**
1. Installs dependencies and runs `npx prisma generate`
2. Runs a full Next.js build with production env vars to catch build-time errors
3. Deploys to Vercel via the Vercel CLI

**Required GitHub Actions secrets:**
| Secret | Where to get it |
|--------|----------------|
| `DATABASE_URL` | Neon dashboard → Connection Details |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

> **Note:** The primary deploy is Vercel's native GitHub integration (automatic on every push to `main`). This workflow is an optional CI-driven override — useful for gated deploys or pre-deploy checks before Vercel fires.

**How to contribute:**
- To add a pre-deploy step (e.g. run migrations): add a step before the deploy step
- To change the deploy environment: modify the `--environment` flag in the Vercel CLI commands
- To disable: delete or rename the file (Vercel native integration still deploys independently)

---

### A3 — `type-check.yml` — TSC on Every Push

**Triggers:** every push to any branch

**What it does:** Runs `cd apps/web && npx tsc --noEmit` — fail-fast TypeScript check.

This is intentionally separate from `ci.yml` so TypeScript errors are surfaced on feature branches before a PR is opened.

**How to contribute:**
- To add more packages to the type check: add steps for `packages/core`, `packages/schemas`, etc.
- Node version: **18** — match this when adding new steps

---

### A — How to Add a New Workflow

```bash
# Create the file
touch .github/workflows/my-new-pipeline.yml
```

Minimum template:
```yaml
name: My Pipeline

on:
  push:
    branches: [main]

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: # your command
```

Conventions:
- Always pin action versions (`@v4` not `@latest`)
- Use `npm ci --legacy-peer-deps` (not `npm install`) in CI
- Scope secrets to the minimum required

---

## B — Generation Pipelines

Generation pipelines produce pixel art assets. All scripts live in `scripts/` and are invoked via `npm run` targets from the repo root.

### B1 — Full Quality Cycle (`run-cycle.mjs`)

The primary pipeline. Runs a complete end-to-end cycle: prompts → generate → normalize → package → validate → registry.

```bash
npm run cycle                           # Default: 5 items, default categories
npm run cycle:fresh                     # Clean output then run cycle
npm run cycle -- --category world/food  # Single category
npm run cycle -- --categories world/furniture,world/utensils
npm run cycle -- --checkpoint Realistic_Vision_V6.0_NV_B1_fp16.safetensors
npm run cycle -- --ports 8188,8190
npm run cycle -- --resetRotation
npm run cycle -- --engine cpu           # Use CPU/procedural instead of ComfyUI
npm run cycle:cpu                       # Alias: --engine cpu with detailed profile
npm run all                             # Alias for cycle
npm run all:detailed                    # Cycle with detailed profile
npm run all:cpu                         # CPU engine with detailed profile
```

**Internal flow (`scripts/run-cycle.mjs`):**
```
1. Parse CLI flags (--category, --categories, --engine, --ports, --checkpoint, --resetRotation, --profile)
2. Clean generated outputs (scripts/clean-generated.mjs)
3. Generate prompts for 5 items (scripts/generate-prompts.mjs)
4. Dispatch generation:
   - default: scripts/cloud-generate.mjs (ComfyUI via cloud)
   - --engine cpu: scripts/generate-procedural.mjs
5. Normalize outputs (scripts/normalize.mjs)
6. Package into sprite sheets (scripts/package.mjs)
7. Validate outputs (scripts/validate.mjs)
8. Build registry (scripts/build-registry.mjs)
```

**How to contribute:**
- Add a new flag: parse it in `run-cycle.mjs` and thread it through to the relevant step script
- Change the item count per cycle: modify the batch size constant in `generate-prompts.mjs`
- Add a new step to the cycle: add a call between existing steps in `run-cycle.mjs`

---

### B2 — Cloud Generation (`cloud-generate.mjs`, `cloud-generate-oneshot.mjs`)

Dispatches generation requests to a remote ComfyUI instance (or Replicate/other cloud API).

```bash
npm run gen                    # Standard cloud generation
npm run gen:hq                 # High-quality one-shot (HQ workflow JSON)
npm run gen:lowmem             # Low-memory model variant via local port 8190
```

**Key details:**
- `cloud-generate.mjs` — batch mode, spawns multiple concurrent requests
- `cloud-generate-oneshot.mjs` — single high-quality request, used for `gen:hq`
- Uses ComfyUI workflow JSON files from `comfyui/workflows/`
- Port fallback: tries ports in the order given by `--ports` flag

**How to contribute:**
- Change the target workflow: edit the `--workflow` flag or modify the default in the script
- Add a new ComfyUI workflow: create a JSON file in `comfyui/workflows/` and wire it to a new `npm run` script in `package.json`
- Change the cloud endpoint: modify the `--host` argument or the default URL in the script

---

### B3 — Local ComfyUI Generation (`comfy-generate.mjs`, `comfy-generate-oneshot.mjs`)

Same as cloud generation but targets a locally running ComfyUI instance.

```
ComfyUI instance at http://127.0.0.1:8188 (default port)
```

**ComfyUI workflow files:**

| File | Use case |
|------|----------|
| `comfyui/workflows/pixel_icon_workflow.json` | Standard quality, balanced speed/quality |
| `comfyui/workflows/pixel_icon_hq_workflow.json` | High quality — more steps, higher resolution |
| `comfyui/workflows/pixel_icon_lowmem_workflow.json` | Low VRAM — fewer steps, smaller resolution |

**How to contribute:**
- Add a new workflow: export from ComfyUI as API-format JSON, save in `comfyui/workflows/`, add an `npm run` script
- Modify checkpoint: edit the `ckpt_name` field in the workflow JSON or pass via `--checkpoint` flag

---

### B4 — CPU/Procedural Generation (`generate-procedural.mjs`)

Fallback engine when no GPU is available. Generates assets procedurally without an inference model.

```bash
npm run gen:cpu                                              # Default quality
npm run gen:cpu:fast                                         # Fast mode (96px master)
npm run cycle:cpu                                            # Full cycle using CPU engine
# Flags:
node scripts/generate-procedural.mjs --quality hq --masterSize 256
node scripts/generate-procedural.mjs --quality fast --masterSize 96
```

**How to contribute:**
- Add a new procedural pattern: extend the generation logic in `generate-procedural.mjs`
- Adjust output sizes: modify `--masterSize` defaults

---

### B5 — Prompt Generation (`generate-prompts.mjs`)

Generates the textual prompts that are fed to the generation scripts.

```bash
npm run prompts    # Generate prompts for current category rotation
```

**How it works:**
- Reads category rotation state
- Samples items from `catalog.json`
- Uses prompt builders from `packages/prompts/` (OSS stub) or `apps/web/src/lib/prompt-builder-*.ts` (internal quality layer)
- Writes prompt files consumed by the generation scripts

**How to contribute:**
- Change the prompt strategy: edit `generate-prompts.mjs` or the relevant prompt builder
- Add a new category: add entries to `catalog.json`
- Change sample count per category: modify the batch size constant

---

### B6 — Port Management (`ports.mjs`)

Utility to check and kill processes on ComfyUI ports before a generation run.

```bash
npm run ports -- --action status --ports 8188,8190,9015,9016,9017,9020
npm run ports -- --action kill --ports 8188,8190,9015,9016,9017,9020
```

---

### B7 — Interactive TUI (`tui.mjs`)

Terminal UI that wraps all generation commands in a menu-driven interface.

```bash
npm start    # Launch TUI
```

**How to contribute:**
- Add a new menu option: extend the inquirer menu in `scripts/tui.mjs`

---

## C — Data & Asset Pipeline

The data pipeline transforms raw assets from external sources into structured training data and registry entries.

### C1 — Full Orchestration (`dataset-orchestrate.mjs`)

Runs the entire data pipeline in sequence: reset → intake → normalize → package → validate → registry.

```bash
npm run data:orchestrate           # Full pipeline (preserves existing data)
npm run data:orchestrate:fresh     # Reset everything, then run full pipeline
```

---

### C2 — Dataset Intake (`dataset-intake.mjs`)

Processes raw assets from `dataset/inbox/` through accept/reject filtering into `dataset/accepted/` and `dataset/rejected/`.

```bash
npm run data:intake           # Process inbox → accepted/rejected
npm run data:report           # Dry-run: show what would happen, no file moves
```

**Directory layout:**
```
dataset/
  inbox/              ← Drop source assets here (gitignored, not committed)
    _licenses.csv     ← Optional: attribution metadata for sourced assets
  accepted/           ← Passed quality/license filter (gitignored)
  rejected/           ← Failed filter (gitignored)
  train/
    images/           ← Final training-ready images (gitignored)
  manifests/
    dataset-report.json   ← Intake summary
    ATTRIBUTION.md        ← Generated attribution file
```

**How to contribute:**
- Change acceptance criteria: edit the filter logic in `dataset-intake.mjs`
- Add new metadata fields: extend `_licenses.csv` parsing

---

### C3 — Dataset Reset (`dataset-reset.mjs`)

Wipes all dataset pipeline outputs and resets to a clean state.

```bash
npm run data:reset
```

---

### C4 — Normalize (`normalize.mjs`)

Standardizes generated/accepted assets to canonical sizes and formats.

```bash
npm run normalize
```

**How to contribute:**
- Add a new output size: extend the resize targets in `normalize.mjs`
- Change output format: modify the Sharp pipeline options

---

### C5 — Package (`package.mjs`)

Assembles individual frames into sprite sheets and ZIP packages.

```bash
npm run package
```

---

### C6 — Validate (`validate.mjs`)

Runs quality checks on outputs and writes `registry/validation-report.json`.

```bash
npm run validate
```

**How to contribute:**
- Add a new validation rule: extend the check functions in `validate.mjs`
- Change pass/fail thresholds: modify the threshold constants

---

### C7 — Build Registry (`build-registry.mjs`)

Compiles all validated assets into the asset registry (`registry/assets.json`).

```bash
npm run registry
```

**How to contribute:**
- Add new registry fields: extend the record schema in `build-registry.mjs`

---

### C8 — Clean Generated Outputs (`clean-generated.mjs`)

Removes all generated outputs to start fresh.

```bash
npm run clean
```

---

### C — Testing the Data Pipeline End-to-End

```bash
npm run data:reset
# Drop test assets into dataset/inbox/
npm run data:orchestrate
# Inspect results:
cat dataset/manifests/dataset-report.json
cat dataset/manifests/ATTRIBUTION.md
ls dataset/train/images | head -20
```

---

## D — Deployment Pipelines

### D1 — Vercel (Primary Production Deploy)

**How it works:** Vercel's native GitHub integration deploys automatically on every push to `main`. No manual action needed.

**Key files:**
- `apps/web/vercel.json` — per-project Vercel config (rewrites, headers, function duration)
- `.github/workflows/deploy-prod.yml` — optional CI-driven deploy (see A2)
- `apps/web/next.config.js` — Next.js config (output mode, image domains)

**Deploying manually:**
```bash
npm install -g vercel
vercel link        # Link local repo to Vercel project
vercel env pull    # Pull production env vars into .env.local
vercel --prod      # Deploy to production
```

**Adding a new environment variable:**
1. Add it to Vercel dashboard: Project → Settings → Environment Variables
2. Add it to `render.yaml` `envVars` section if Render is also used
3. Document it in `docs/ENV.md`
4. If used at build time, also add to the `env:` block in `deploy-prod.yml`

**Prisma on Vercel:**
- Vercel runs serverless functions — use the **pooled** Neon connection string as `DATABASE_URL` and the **direct** URL as `DIRECT_URL`
- `npx prisma generate` must run at build time (already in `deploy-prod.yml` and `render.yaml`)

---

### D2 — Render (Alternative Deploy)

`render.yaml` is a Render Blueprint file for one-click deploys on [render.com](https://render.com).

```yaml
# Defined services:
wokgen-web     # Node web service (Next.js standalone)
wokgen-db      # Free PostgreSQL (⚠️ expires after 90 days on free tier)
```

**Deploy:**
1. render.com → New → Blueprint → connect `WokSpec/WokGen` → Apply
2. Set `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` in the Render dashboard (marked `sync: false`)

**How to contribute:**
- Add a new service: add a `services:` entry in `render.yaml`
- Add a new env var: add to the `envVars:` block under the relevant service
- Change the start command (e.g. to run migrations differently): edit `startCommand` in `render.yaml`

---

### D3 — Docker / Self-Hosted

`Dockerfile` and `docker-compose.*.yml` files at the repo root provide self-hosted deployment.

**Files:**

| File | Use case |
|------|----------|
| `Dockerfile` | Production-optimized Next.js container |
| `docker-compose.prod.yml` | Full production stack (app + Postgres) |
| `docker-compose.self-hosted.yml` | Self-hosted with external DB |
| `docker-compose.self-hosted-comfyui.yml` | Self-hosted with ComfyUI sidecar |

**Running locally with Docker:**
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local

docker-compose -f docker-compose.self-hosted.yml up --build
```

**Important:** `output: 'standalone'` must be uncommented in `apps/web/next.config.js` for Docker builds to work. It's commented out in development to avoid interfering with Vercel's native build.

**How to contribute:**
- Add a new sidecar service: add to the relevant `docker-compose.*.yml`
- Optimize the Dockerfile: follow Next.js standalone output best practices

---

### D4 — Database Migrations (Prisma)

**Schema file:** `apps/web/prisma/schema.prisma`

**Development workflow (schema change):**
```bash
cd apps/web

# 1. Edit prisma/schema.prisma
# 2. Push change to local dev DB (no migration file generated)
npx prisma db push

# 3. Regenerate Prisma client
npx prisma generate

# 4. When ready for a tracked migration (production):
DIRECT_URL="<neon-direct>" DATABASE_URL="<neon-pooled>" npx prisma migrate dev --name describe-your-change
```

**Deploy migrations to production:**
```bash
DIRECT_URL="<neon-direct>" DATABASE_URL="<neon-pooled>" npx prisma migrate deploy
```

**Two-URL strategy (required for Neon + serverless):**
- `DATABASE_URL` → pooled connection (PgBouncer, port 6432) — used at runtime
- `DIRECT_URL` → direct connection (port 5432) — used by Prisma migrate only

**Seed data:**
```bash
cd apps/web && npx prisma db seed
```

Seed file: `apps/web/prisma/seed.ts` (if present) or `prisma/seed.js`.

---

## E — Web App Dev Pipeline

### E1 — Local Dev Server

```bash
npm run web:dev     # Start Next.js dev server at http://localhost:3000
npm run web:build   # Production build (run before pushing to catch build errors)
npm run web:lint    # ESLint
```

**Hot reload:** All `apps/web/src/` changes hot-reload automatically. Changes to `packages/` require a dev server restart.

---

### E2 — Adding an API Route

1. Create `apps/web/src/app/api/{route}/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` as named async functions
3. Use `auth()` from `apps/web/src/lib/auth.ts` for authenticated routes
4. Apply rate limiting via `rateLimit()` from `apps/web/src/lib/rate-limit.ts`

Pattern for a generation route:
```typescript
export async function POST(req: Request) {
  const session = await auth();
  const rl = await rateLimit(session?.user?.id ?? getClientIp(req), 10, 60_000);
  if (!rl.allowed) return new Response('Too many requests', { status: 429 });

  const body = await req.json();
  // validate body with schemas/...
  // resolve provider with resolveOptimalProvider(mode, tool, useHD)
  // dispatch and return result
}
```

---

### E3 — Adding a New Page / Mode

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full checklist. Short version:

1. **Mode schema** — `modes/{mode}/schema.ts`
2. **Mode config** — add to `apps/web/src/lib/modes/index.ts`
3. **Mode prompt builder** — `apps/web/src/lib/prompt-builder-{mode}.ts`
4. **Quality profiles** — add entries to `QUALITY_PROFILES` and `QUALITY_PROFILES_BY_MODE` in `apps/web/src/lib/quality-profiles.ts`
5. **Negative banks** — add entries to `apps/web/src/lib/negative-banks.ts`
6. **Provider routing** — add mode entry to `STANDARD_MATRIX` and `HD_MATRIX` in `apps/web/src/lib/provider-router.ts`
7. **Studio page** — `apps/web/src/app/{mode}/studio/page.tsx`
8. **API route** — `apps/web/src/app/api/{mode}/generate/route.ts`
9. **Mode README** — `modes/{mode}/README.md`

---

### E4 — Prisma Client Usage

```typescript
import { prisma } from '@/lib/db';

// Always use prisma from the shared lib instance (connection pooling)
const user = await prisma.user.findUnique({ where: { id: userId } });
```

Never instantiate a new `PrismaClient` directly in route handlers — it causes connection exhaustion on serverless.

---

### E5 — Testing

```bash
# Load test against staging
k6 run scripts/load-test.js --env BASE_URL=https://staging.wokgen.wokspec.org

# Smoke test
./scripts/smoke-test.sh https://wokgen.wokspec.org

# Chaos test (failure injection)
./scripts/chaos-test.sh https://wokgen.wokspec.org

# Security probe
./scripts/security-probe.sh https://wokgen.wokspec.org
```

---

### E6 — Monitoring

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `/api/health` | Health check (DB connectivity) | None |
| `/api/metrics` | Prometheus-format metrics | `METRICS_SECRET` header |

Sentry error tracking: set `NEXT_PUBLIC_SENTRY_DSN`. Config files: `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`.
