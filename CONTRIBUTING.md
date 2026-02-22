# Contributing to WokGen

Thank you for your interest in contributing. This document explains how to get started,
what kinds of contributions are accepted, and how to submit work.

## Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (or a free [Neon](https://neon.tech) instance)
- Git

## Local Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/WokSpec/WokGen
cd WokGen

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local — see Environment Setup in README.md

# 4. Initialize database
cd apps/web && pnpm prisma db push

# 5. Start development server
cd ../.. && pnpm dev
```

The app runs at http://localhost:3000. API routes are at `/api/*`.

## How to Add a New Asset Engine Mode

A new mode requires:

1. **Mode schema** — create `modes/{modename}/schema.ts` with TypeScript interfaces
2. **Mode config** — add to `apps/web/src/lib/modes/index.ts`
3. **Studio page** — create `apps/web/src/app/{modename}/studio/page.tsx`
4. **API route** — if the mode has a different generation pipeline, add `apps/web/src/app/api/{modename}/generate/route.ts`
5. **Mode README** — create `modes/{modename}/README.md` defining what the mode is/isn't for
6. **Prompts OSS stub** — add prompt building logic to `packages/prompts/src/stub.ts`

Mode naming convention: lowercase, no hyphens (e.g. `pixel`, `business`, `uiux`).

## How to Add a New Provider Adapter

1. Create `apps/web/src/lib/providers/{providername}.ts`
2. Implement the `generate()` function matching the shape in `apps/web/src/lib/providers/index.ts`
3. Add the provider name to `ProviderName` in `packages/core/src/index.ts`
4. Add provider capabilities to `PROVIDER_CAPABILITIES` in `apps/web/src/lib/providers/types.ts`
5. Add provider metadata to `PROVIDER_META` in the same file
6. Export from `apps/web/src/lib/providers/index.ts`
7. Add the provider to `resolveOptimalProvider()` in `apps/web/src/lib/provider-router.ts`

## PR Rules

All pull requests must:

- Pass `pnpm tsc --noEmit` with zero errors
- Pass `pnpm eslint` with no new warnings
- Not introduce any secrets, API keys, or credentials
- Not modify files in `apps/web/src/lib/` that are marked `@private` (prompt token chains, quality profiles)
- Include a description of what changed and why
- Reference an issue if one exists

## What Will NOT Be Accepted

- Changes to `STYLE_PRESET_TOKENS` or `ASSET_CATEGORY_TOKENS` (these are proprietary)
- Changes to `QUALITY_PROFILES` step/CFG values (these are tuned for production)
- Changes to billing or rate-limiting logic
- Adding new dependencies without discussion in an issue first
- Style changes (formatting) without a corresponding logic change

## Commit Message Format

```
type: short description

Optional longer explanation.

Co-authored-by: Your Name <email>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Code Style

- TypeScript strict mode — all new code must be fully typed
- No `any` without a comment explaining why
- No TODO comments in merged code — open an issue instead
- Components: functional React, no class components
- CSS: use existing CSS variables and classes before adding new ones

## Review Process

Maintainers review PRs within 7 days. We may:
- Request changes before merging
- Merge with minor edits
- Close with explanation if out of scope

For large changes or new modes, open an issue first to discuss approach.

## Questions

Open a GitHub Discussion or issue. For security concerns, see [SECURITY.md](./SECURITY.md).
