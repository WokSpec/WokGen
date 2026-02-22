# WokGen Architecture

This document describes the conceptual architecture of the WokGen platform.
It covers the system design, not implementation specifics.

## Platform Principle

WokGen is a mode-isolated generative asset factory. Each asset engine (mode)
is a sealed pipeline — it has its own prompt schema, quality constraints,
output formats, and tooling. Modes do not share implementation logic.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                                                              │
│  ModeSwitcher → /pixel/studio                               │
│              → /business/studio                             │
│              → /uiux/studio                                 │
│              → /vector/studio  (coming soon)                │
│              → /emoji/studio   (coming soon)                │
└───────────────────────────┬─────────────────────────────────┘
                            │  POST /api/generate
                            │  POST /api/uiux/generate
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js)                      │
│                                                              │
│  Auth check → Rate limit → Body parse                       │
│  Mode router → Prompt validator → Variant builder           │
│  Negative bank assembly → Provider quality matrix           │
│  Provider dispatch → Fallback chain → Job persistence       │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
       Together.ai     fal.ai        Pollinations
       (standard)      (HD)          (no-key fallback)
       Hugging Face    Replicate     ComfyUI (local)
```

## Mode Isolation Model

Each mode declares a contract:

```typescript
interface ModeContract {
  id: ModeId;
  name: string;
  description: string;
  targetAudience: string;
  outputTypes: OutputType[];
  exportFormats: ExportFormat[];
  status: ModeStatus;
  studioPath: string;
}
```

A mode switch changes:
- The gallery
- The template presets
- The prompt schema and scaffolding
- The negative bank selection
- The provider quality routing
- The output format options
- The export tooling

No two modes share these. Gallery assets from Pixel do not appear in Business galleries.

## Generation Pipeline

Every generation request flows through this sequence:

```
1. Auth + rate limit check
2. Body parse + mode resolution
3. Variant mutation (for batch slots > 0)
4. Prompt validation + sanitization
5. Negative bank assembly (global + tool + preset)
6. Negative encoding (for providers without native support)
7. Provider quality matrix (resolve optimal provider)
8. Quality profile resolution (steps/guidance per preset)
9. Provider dispatch
10. Fallback chain execution (on provider failure)
11. Job record update (success/failure)
12. HD credit deduction (if applicable)
13. Response serialization
```

## Batch Generation (Variant System)

When batchCount > 1, each slot receives a semantically distinct prompt mutation:

- Slot 0: canonical (no mutation)
- Slot 1: perspective/pose shift
- Slot 2: lighting/mood shift
- Slot 3: detail density/color variant

Each slot also receives a different seed (seed + i × 137). The combination of
distinct seed and distinct prompt mutation produces genuine style variants rather
than near-identical copies.

## Workspace / Project System

Users can create workspaces within each mode:

```
User
 └─ Workspace (typed to one mode)
     └─ Jobs (generation history for that workspace)
```

Rules:
- A workspace belongs to exactly one mode
- Mode switching inside a workspace is not permitted
- Cross-mode asset reuse requires explicit export/import

Plan limits control maximum workspace count per user.

## Prompt Engine Interface

The prompt engine is behind an adapter:

```
PROMPT_ENGINE=wokspec  → proprietary quality layer (hosted platform)
PROMPT_ENGINE=oss      → OSS stub builders (packages/prompts/)
```

Both sides expose the same interface. The difference is output quality,
not functionality. Self-hosted OSS deployments get functional results.

## Provider Abstraction

The provider layer is tool-aware and quality-aware:

```typescript
resolveOptimalProvider(mode, tool, useHD) → ProviderName
```

The quality matrix considers:
- Which tools a provider supports natively
- Whether the provider supports native negative prompts
- Whether the provider requires an API key
- The quality tier (standard vs. HD)

Fallback chains ensure generation never silently fails — if the optimal provider
is unavailable, the system cascades to the next capable provider.

## Database Schema

The database tracks:
- `User` — auth, plan, HD credit balances
- `Job` — every generation request (status, prompt, provider, result URL)
- `GalleryAsset` — public gallery entries
- `Project` — workspaces (typed to mode, scoped to user)
- `Subscription` / `Plan` — billing tier

Schema source: `apps/web/prisma/schema.prisma`

## Auth Model

Authentication uses NextAuth with GitHub and Google OAuth providers, plus
credential-based email/password. Session tokens are stored server-side.

Guest users can generate (standard quality only) with IP-based rate limiting.
Authenticated users get higher rate limits and access to HD generation.

## Billing Architecture (Conceptual)

```
Plan tier (Free / Pro / Studio)
  → Monthly HD credit allocation
  → Rate limit multiplier
  → Max workspace count

Top-up packs
  → One-time credit purchase
  → Added to topUpCredits balance
```

HD credits deduct from monthly allocation first, then top-up balance.
Standard generation is always free and unlimited (within rate limits).

## WokSpec Integration

WokGen is the generation layer. WokSpec is the services layer:

| WokGen Output | WokSpec Service |
|---------------|-----------------|
| Pixel sprites | Game art pipeline, engine integration |
| Business assets | Brand system finalization |
| UI/UX code | Production frontend scaffolding |
| Vector icons | Design system build-out |

In-product upsells surface in the studio UI when users generate assets
that would benefit from professional refinement.

## Extension Points

The platform is designed for extension at these boundaries:

1. **New mode** — implement `ModeContract`, create studio page, add API route
2. **New provider** — implement the provider interface in `apps/web/src/lib/providers/`
3. **New exporter** — implement `AssetExporter` from `packages/core/`
4. **New preset** — add to the preset type union and configure token/quality/negative banks
5. **Custom prompt engine** — set `PROMPT_ENGINE=oss` and implement the stub interface

---

For implementation details, see the source code in `apps/web/src/lib/`.
For contributor setup, see [CONTRIBUTING.md](../CONTRIBUTING.md).
