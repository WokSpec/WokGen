# WokGen

> Multi-mode generative asset platform. Full production codebase — quality layer, pipeline tooling, and all generation systems are open for contribution.
>
> Live platform: **[wokgen.wokspec.org](https://wokgen.wokspec.org)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

---

## Internal Documentation

| Doc | What it covers |
|-----|----------------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Dev setup, adding modes/providers, PR rules |
| [docs/PIPELINES.md](./docs/PIPELINES.md) | Every pipeline — CI/CD, generation, data/asset, deployment, web app — with contribution guides |
| [docs/INTERNALS.md](./docs/INTERNALS.md) | All internal systems: prompt engine, quality profiles, provider router, negative banks, billing, rate limiting |
| [docs/ENV.md](./docs/ENV.md) | Complete env var reference organized by system |
| [docs/architecture.md](./docs/architecture.md) | System architecture and data flow |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel, Render, Docker, Prisma migration flow |
| [COMMANDS.md](./COMMANDS.md) | All `npm run` commands with flags |

---

## What WokGen is

WokGen is a multi-mode generative asset platform. Each mode is a sealed pipeline with its own prompt schema, model routing, quality constraints, output formats, and tooling.

It is **not** a generic image generator. It is a purpose-built factory.

## Asset Engines

| Engine | Purpose | Status |
|--------|---------|--------|
| **Pixel** | Game sprites, tilesets, animations, HUD elements | ✅ Live |
| **Business** | Logos, brand kits, slide visuals, banners | ✅ Live |
| **UI/UX** | React/HTML components, landing pages, dashboards | ✅ Live |
| **Vector** | SVG icons, illustration sets, design systems | ✅ Live |
| **Emoji** | Emoji packs, sticker sets, platform reactions | ✅ Live |
| **Voice** | AI voice generation (ElevenLabs, OpenAI TTS, HF Kokoro) | ✅ Live |
| **Text** | LLM-powered text generation (Groq, Cerebras, Together) | ✅ Live |

## Standalone Tools (no auth required)

| Tool | Description |
|------|-------------|
| **Ideogram** | Text-to-image via Ideogram API |
| **Recraft** | Icon & vector generation via Recraft API |
| **Skybox** | 360° panorama / skybox generation (Blockade Labs) |
| **Text-to-3D** | 3D model generation via Meshy |
| **Transcribe** | Audio transcription via AssemblyAI |
| **Vectorize** | Raster → SVG via Vectorizer.AI |
| **BG Remove** | Background removal |
| **Link Scraper** | Extract metadata / content from URLs (Firecrawl) |
| **Media Downloader** | Download media from URLs |
| **Favicon Extractor** | Extract favicons from any domain |
| **OG Analyzer** | Preview Open Graph tags |
| **Website Palette** | Extract color palettes from websites |
| **Exa Search** | Semantic web search via Exa AI |

## Repository Layout

```
apps/
  web/               Next.js 14 app (frontend + API routes)
    src/lib/         Server-side engine — all internal systems live here
    src/app/         Pages and API routes
    prisma/          Database schema and seed

packages/
  core/              Domain interfaces and TypeScript contracts
  prompts/           OSS-compatible stub prompt builders
  schemas/           API request/response schemas

modes/
  pixel/             Pixel mode schema, exporters, prompts
  business/          Business mode schema, exporters, prompts
  vector/            Vector mode schema
  emoji/             Emoji mode schema
  uiux/              UI/UX mode schema

scripts/             All generation, data, and asset pipeline scripts
comfyui/             ComfyUI workflow JSON files
dataset/             Dataset intake workspace
docs/                Architecture, internals, env, pipeline docs
examples/            Workflow examples per engine
.github/workflows/   CI/CD pipelines
```

## Local Dev Setup

**Prerequisites:** Node.js 20+, PostgreSQL (or [Neon](https://neon.tech) free tier)

```bash
# 1. Clone
git clone git@github.com:WokSpec/WokGen.git
cd WokGen

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local — see docs/ENV.md for all variables

# 4. Initialize database
cd apps/web && npx prisma db push && cd ../..

# 5. Start dev server
npm run web:dev
```

App runs at http://localhost:3000. See [docs/ENV.md](./docs/ENV.md) for full variable reference.

## Generation Pipeline (Quick Reference)

```bash
npm run cycle              # Full 5-item quality cycle (default)
npm run cycle:fresh        # Clean then cycle
npm run cycle -- --category world/food   # Cycle a specific category
npm run gen                # Cloud generation only
npm run gen:hq             # High-quality one-shot
npm run gen:cpu            # CPU/procedural fallback
```

See [COMMANDS.md](./COMMANDS.md) for all flags and [docs/PIPELINES.md](./docs/PIPELINES.md) for how each pipeline works internally.

## Generation Flow

```
Request → Auth/Rate limit → Mode router → Prompt validation
       → Negative bank assembly → Provider quality matrix
       → Provider dispatch → Fallback chain → Job persistence → Response
```

Full details: [docs/INTERNALS.md](./docs/INTERNALS.md)

## WokSpec Relationship

WokGen is the generation engine. WokSpec is the services layer above it.

| WokGen Output | WokSpec Service |
|---------------|-----------------|
| Pixel sprites | Game art pipelines, engine integration, atlas packing |
| Business assets | Brand system finalization, multi-channel rollout |
| UI/UX mockups | Production frontend scaffolding, design systems |
| Vector icons | Design system build-out |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Internal team members have full access to all systems — quality profiles, negative banks, provider router, billing logic, and prompt chains are all editable.

## License

Apache-2.0. See [docs/licensing.md](./docs/licensing.md) for the full boundary definition.

---

Built by [WokSpec](https://wokspec.org)

