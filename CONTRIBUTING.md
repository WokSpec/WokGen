# Contributing to WokGen

Internal contribution guide for the WokSpec engineering team. All internal systems — quality profiles, negative banks, provider router, prompt chains, billing, rate limiting — are fully visible and editable in this repo.

See [docs/INTERNALS.md](./docs/INTERNALS.md) for a deep-dive on each system and [docs/PIPELINES.md](./docs/PIPELINES.md) for pipeline-specific contribution guides.

## Prerequisites

- Node.js 20+
- npm (the repo uses npm workspaces — **not** pnpm or yarn)
- PostgreSQL 14+ (or a free [Neon](https://neon.tech) instance)
- Git

## Local Development Setup

```bash
# 1. Clone the repo
git clone git@github.com:WokSpec/WokGen-private.git
cd WokGen-private

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local — see docs/ENV.md for all variables

# 4. Initialize database
cd apps/web && npx prisma db push && cd ../..

# 5. Start development server
npm run web:dev
```

The app runs at http://localhost:3000. API routes are at `/api/*`.

## Internal Systems You Can Edit

All of the following were previously marked `@private` in the OSS release. In this repo they are fully open for team contribution:

| System | File(s) | What you can change |
|--------|---------|---------------------|
| Quality Profiles | `apps/web/src/lib/quality-profiles.ts` | steps, guidance, width, height per preset/mode |
| Provider Router | `apps/web/src/lib/provider-router.ts` | Standard and HD routing matrices, add/reorder providers |
| Negative Banks | `apps/web/src/lib/negative-banks.ts` | Token lists, per-tool and per-preset negatives |
| Prompt Builders | `apps/web/src/lib/prompt-builder-*.ts` | Per-mode prompt scaffolding, token chains |
| Prompt Engine | `apps/web/src/lib/prompt-engine.ts` | Engine adapter (`PROMPT_ENGINE=wokspec\|oss`) |
| Plan Limits | `apps/web/src/lib/plan-limits.ts` | Workspace counts per plan tier |
| Rate Limits | `apps/web/src/lib/rate-limit.ts` | Sliding window limits, Redis/Postgres/fallback logic |
| Billing | `apps/web/src/lib/stripe.ts` | Stripe integration, credit deduction logic |
| Feature Flags | `apps/web/src/lib/feature-flags.ts` | `MAINTENANCE_MODE`, `DISABLE_SIGNUPS`, etc. |

See [docs/INTERNALS.md](./docs/INTERNALS.md) for how each system works and how to tune it.



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

- Pass `cd apps/web && npx tsc --noEmit` with zero errors
- Pass `cd apps/web && npx eslint` with no new warnings
- Not introduce any secrets, API keys, or credentials
- Include a description of what changed and why
- Reference an issue if one exists

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
