# WokGen

**A multi-engine AI asset factory.** Specialized pipelines for every kind of digital asset — pixel sprites, brand systems, UI components, vectors, and more.

Live platform: **[wokgen.wokspec.org](https://wokgen.wokspec.org)** — part of the [WokSpec](https://wokspec.org) platform.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

---

## What WokGen is

WokGen is a multi-mode generative asset platform. Each mode is a specialized pipeline with its own prompt schema, model routing, quality constraints, output formats, and tooling.

It is **not** a generic image generator. It is a purpose-built factory.

## Asset Engines

| Engine | Purpose | Status |
|--------|---------|--------|
| **Pixel** | Game sprites, tilesets, animations, HUD elements | ✅ Live |
| **Business** | Logos, brand kits, slide visuals, banners | ✅ Live |
| **UI/UX** | React/HTML components, landing pages, dashboards | ✅ Live |
| **Vector** | SVG icons, illustration sets, design systems | 🔜 Soon |
| **Emoji** | Emoji packs, sticker sets, platform reactions | 🔜 Soon |

More engines are in development. Each engine is isolated — no cross-mode bleed.

## Architecture Overview

```
apps/
  web/               Next.js 14 app (frontend + API routes)
    src/lib/         Server-side engine (providers, prompt builders, routing)
    src/app/         Pages and API routes

packages/
  core/              Domain interfaces (public TypeScript contracts)
  prompts/           OSS stub prompt builders
  schemas/           API request/response schemas

modes/
  pixel/             Pixel mode plugin interface
  business/          Business mode plugin interface
  vector/            Vector mode plugin interface
  emoji/             Emoji mode plugin interface
  uiux/              UI/UX mode plugin interface

docs/               Architecture and contributor documentation
examples/           Workflow examples per engine
```

## Quickstart (Self-Hosted)

**Prerequisites:** Node.js 18+, pnpm, PostgreSQL (or Neon)

```bash
git clone https://github.com/WokSpec/WokGen
cd WokGen
pnpm install

# Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local — see Environment Setup below

# Initialize database
cd apps/web && pnpm prisma db push

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Setup

Minimum required for self-hosted operation:

```env
# Database (Postgres or Neon)
DATABASE_URL=postgresql://...

# At least one image generation API (all free tiers available)
TOGETHER_API_KEY=      # together.ai — FLUX.1-schnell-Free (recommended)
HF_TOKEN=             # huggingface.co — free inference
# Pollinations works without any key

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Self-hosted mode (disables billing and auth requirements)
SELF_HOSTED=true
```

Optional (for HD generation):
```env
FAL_KEY=              # fal.ai
REPLICATE_API_TOKEN=  # replicate.com
```

See [docs/development.md](./docs/development.md) for the full environment reference.

## Provider Support

WokGen supports multiple inference providers with automatic fallback routing:

| Provider | Models | Free? |
|----------|--------|-------|
| Together.ai | FLUX.1-schnell-Free | ✅ Yes |
| Hugging Face | FLUX.1-schnell | ✅ Yes (free token) |
| Pollinations | FLUX | ✅ Yes (no key) |
| fal.ai | FLUX.1-dev | Credits |
| Replicate | SDXL, FLUX | Credits |
| ComfyUI | Any local model | ✅ Local |

## Mode Isolation Model

Each mode is a sealed pipeline:

```
User Request
    ↓
Mode Router (mode field in request body)
    ↓
Mode-specific prompt schema validation
    ↓
Variant builder (batch slot mutation)
    ↓
Prompt validator (sanitize, length, conflict resolution)
    ↓
Negative bank assembly (global + tool + preset)
    ↓
Provider quality matrix (optimal provider for mode+tool+tier)
    ↓
Provider dispatch → fallback chain
    ↓
Job persistence (Postgres)
    ↓
Response
```

No mode shares prompt logic, gallery, templates, or output format with another mode.

## WokSpec Relationship

WokGen is the generation engine. [WokSpec](https://wokspec.org) is the services layer above it.

WokSpec provides professional implementation, production polish, and scale on top of WokGen outputs:

- Pixel → game art pipelines, engine integration, atlas packing
- Business → brand system finalization, multi-channel rollout
- UI/UX → production-ready frontend scaffolding, design systems

The SaaS generates. WokSpec delivers.

## What's Open vs. Closed

This repository is Apache-2.0 licensed. The following are open:

- Frontend application code
- API route structure and scaffolding
- Mode schema type definitions
- OSS stub prompt builders (functional, generic quality)
- Provider capability types
- Export pipeline interfaces
- UI components

The following are **not** included in this repository:

- Production prompt token chains (WokSpec proprietary quality layer)
- Model fine-tuning parameters
- Billing and rate-limit implementation
- Abuse detection heuristics
- Provider-specific model IDs and inference credentials

Self-hosted deployments use the OSS stub prompt builders and produce good results.
The hosted platform at wokgen.wokspec.org uses a private quality layer on top.

See [docs/licensing.md](./docs/licensing.md) for the full boundary definition.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to:

- Set up your local environment
- Add a new asset engine mode
- Add a new provider adapter
- Submit a pull request

Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md). Do not open public issues for security reports.

## Roadmap

- [ ] Vector engine (SVG generation pipeline)
- [ ] Emoji engine (platform-aware export)
- [ ] Batch export and ZIP packing UI
- [ ] API key management dashboard
- [ ] Public gallery curation tools
- [ ] Mode plugin registry

## License

Apache-2.0. See [LICENSE](./LICENSE) for details.

Assets generated by the platform are subject to the terms of the underlying model providers.
See [docs/licensing.md](./docs/licensing.md) for asset usage rights.

---

Built by [WokSpec](https://wokspec.org)

