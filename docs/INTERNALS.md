# WokGen — Systems Reference

Documents all systems in WokGen. Every system described here is fully editable and open for contribution. This is the reference guide for contributing to the quality layer, routing, or generation logic.

---

## Table of Contents

- [1. Prompt Engine](#1-prompt-engine)
- [2. Quality Profiles](#2-quality-profiles)
- [3. Provider Router](#3-provider-router)
- [4. Negative Banks](#4-negative-banks)
- [5. Mode System](#5-mode-system)
- [6. Billing & Quota](#6-billing--quota)
- [7. Rate Limiting](#7-rate-limiting)
- [8. Feature Flags](#8-feature-flags)

---

## 1. Prompt Engine

**Files:**
- `apps/web/src/lib/prompt-engine.ts` — adapter that switches between engines
- `apps/web/src/lib/prompt-builder-pixel.ts` — Pixel mode prompt scaffolding
- `apps/web/src/lib/prompt-builder-business.ts` — Business mode prompt scaffolding
- `apps/web/src/lib/prompt-builder-vector.ts` — Vector mode prompt scaffolding
- `apps/web/src/lib/prompt-validator.ts` — sanitization and conflict resolution
- `packages/prompts/src/stub.ts` — OSS-compatible stub builders

### Engine Modes

The prompt engine is toggled via the `PROMPT_ENGINE` environment variable:

| Value | What runs | Where |
|-------|-----------|-------|
| `wokspec` (default) | Internal quality builders | `apps/web/src/lib/prompt-builder-*.ts` |
| `oss` | OSS stub builders | `packages/prompts/src/stub.ts` |

Both expose the same function signature:
```typescript
buildPrompt(mode: ModeId, params: PromptParams): { positive: string; negative: string }
```

The difference is output quality — the internal builders use WokSpec's curated token chains, style scaffolding, and quality directives. The OSS stubs produce functional but generic outputs.

### Prompt Builder Structure

Each mode has its own builder. The pixel builder (`prompt-builder-pixel.ts`) is the most developed reference:

```typescript
// Simplified structure
export function buildPixelPrompt(params: PixelPromptParams): BuiltPrompt {
  const tokens: string[] = [];

  // 1. Quality preamble (always first — affects CLIP attention)
  tokens.push(...QUALITY_PREAMBLE);

  // 2. Style preset tokens (from STYLE_PRESET_TOKENS[preset])
  tokens.push(...resolvePresetTokens(params.preset));

  // 3. Subject description (user input, validated and sanitized)
  tokens.push(validateSubject(params.subject));

  // 4. Asset category tokens (from ASSET_CATEGORY_TOKENS[category])
  if (params.category) tokens.push(...resolveCategoryTokens(params.category));

  // 5. Tool-specific directives (animate, rotate, scene, inpaint)
  if (params.tool !== 'generate') tokens.push(...TOOL_DIRECTIVES[params.tool]);

  // 6. Color palette (if specified)
  if (params.palette) tokens.push(...encodePalette(params.palette));

  return {
    positive: tokens.join(', '),
    negative: assembleNegatives(params),
  };
}
```

### How to Tune Prompt Scaffolding

- **Change quality preamble:** Edit `QUALITY_PREAMBLE` in the relevant builder. These are the tokens that prime the model for the target style. Order matters — higher-weighted tokens should come first.
- **Add a style preset:** Add an entry to `STYLE_PRESET_TOKENS` in the mode's builder file. The key must match a valid preset value from `modes/{mode}/schema.ts`.
- **Add an asset category:** Add an entry to `ASSET_CATEGORY_TOKENS`. The key must match a category in `catalog.json`.
- **Tune tool directives:** Edit `TOOL_DIRECTIVES` for the relevant tool (animate, rotate, etc.).

### Prompt Validator

`prompt-validator.ts` runs before every generation:
- Strips injected control tokens (e.g. `<lora:...>`, `embedding:`)
- Resolves conflicting style tokens (e.g. "realistic" in a pixel art prompt)
- Enforces max token length (provider-dependent)
- Sanitizes user input (removes exploitable sequences)

To add a new conflict rule or sanitization pattern, extend the relevant arrays in `prompt-validator.ts`.

---

## 2. Quality Profiles

**File:** `apps/web/src/lib/quality-profiles.ts`

Quality profiles define the inference parameters (steps, CFG guidance, resolution) used per preset or per mode+type combination.

### Interface

```typescript
interface QualityProfile {
  steps: number;       // Denoising steps — more = more detail, slower
  guidance: number;    // CFG scale — higher = more literal prompt, risk of artifacts above ~10
  width?: number;      // Generation width (px)
  height?: number;     // Generation height (px)
  upscaleToHD?: boolean; // Whether to request provider-side upscaling
}
```

### Two Profile Tables

**`QUALITY_PROFILES`** — keyed by preset name, used by simple route dispatch:
```typescript
// Example entries
portrait:        { steps: 30, guidance: 8.5 },   // Complex faces — more steps
rpg_icon:        { steps: 20, guidance: 7.5 },    // Icons — silhouette clarity over detail
animated_effect: { steps: 18, guidance: 6.5 },    // Effects — color pop, faster
```

**`QUALITY_PROFILES_BY_MODE`** — keyed by `mode → type`, used by `getQualityProfile()`:
```typescript
pixel: {
  standard:  { steps: 30, guidance: 7.5, width: 512,  height: 512  },
  hd:        { steps: 50, guidance: 8.0, width: 1024, height: 1024, upscaleToHD: true },
  character: { steps: 32, guidance: 8.5, width: 512,  height: 512  },
  ...
}
```

### Resolver Functions

```typescript
// Simple preset lookup
resolveQualityProfile(preset: string | undefined): QualityProfile

// Mode-aware lookup with HD support
getQualityProfile(mode: string, type: string, hd: boolean): QualityProfile
```

### Tuning Guidelines

| Goal | Change |
|------|--------|
| More detail on a complex preset | Increase `steps` (try +4 increments) |
| More literal prompt adherence | Increase `guidance` (cap at ~9.5 to avoid artifacts) |
| More creative/painterly | Decrease `guidance` (go as low as 5.0) |
| Higher resolution output | Increase `width`/`height` (must be multiples of 64) |
| Enable HD upscaling | Set `upscaleToHD: true` + increase dimensions |

**Empirical testing approach:**
1. Run `npm run gen:hq` with the modified profile
2. Compare outputs at target preset against baseline
3. Run 5+ samples before drawing conclusions (generation is stochastic)
4. Document findings as comments next to the profile entry

---

## 3. Provider Router

**File:** `apps/web/src/lib/provider-router.ts`

The router resolves the optimal inference provider for any given `(mode, tool, hd)` combination. It walks a preference list and returns the first provider whose required API key is present in the environment.

### Provider Capabilities

| Provider | Tools supported | Native negatives | Key required |
|----------|----------------|-----------------|--------------|
| `together` | generate, scene | No | `TOGETHER_API_KEY` |
| `huggingface` | generate | Yes | `HF_TOKEN` |
| `pollinations` | generate | No | None |
| `fal` | generate, rotate, scene | Yes | `FAL_KEY` |
| `replicate` | all tools | Yes | `REPLICATE_API_TOKEN` |
| `comfyui` | all tools | Yes | None (local) |

### Standard vs HD Matrix

**Standard tier** (`useHD: false`) — free providers only:
```typescript
pixel.generate: [together → huggingface → pollinations]
pixel.animate:  [pollinations]
pixel.rotate:   [together → pollinations]
```

**HD tier** (`useHD: true`) — premium providers first:
```typescript
pixel.generate: [fal → replicate → together → pollinations]
pixel.animate:  [replicate → fal → pollinations]
pixel.rotate:   [fal → replicate → pollinations]
```

Vector HD uses Replicate (Recraft V3 SVG) as the top preference for true SVG output.

### Resolver Function

```typescript
resolveOptimalProvider(mode: string, tool: string, useHD: boolean): ProviderName
```

The function:
1. Selects the mode-specific matrix (falls back to business matrix for unknown modes)
2. Selects the tool preference list from that matrix
3. Walks the list: returns the first entry whose `requires` env var is set (or entry with no requirement)
4. Ultimate fallback: `'pollinations'` (always works, no key)

### Voice and Text Routing

```typescript
resolveVoiceProvider(): ProviderEntry | null
resolveTextProvider(): ProviderEntry | null
```

Voice uses HuggingFace Kokoro-82M. Text uses Groq (priority 1) → Together Llama (priority 2).

### How to Add a New Provider

1. Create `apps/web/src/lib/providers/{name}.ts` implementing:
   ```typescript
   export async function {name}Generate(params: GenerateParams): Promise<GenerateResult>
   ```
2. Export from `apps/web/src/lib/providers/index.ts`
3. Add to `ProviderName` union in `packages/core/src/index.ts`
4. Add capabilities to `PROVIDER_CAPABILITIES` and `PROVIDER_META` in `apps/web/src/lib/providers/types.ts`
5. Add to routing matrices in `provider-router.ts` at the appropriate priority position
6. Add the required env var key to `docs/ENV.md`

### How to Reorder Provider Priority

Edit the preference arrays in `STANDARD_MATRIX` or `HD_MATRIX`. The first entry that has its key present wins. To deprioritize a provider, move it lower in the list.

---

## 4. Negative Banks

**File:** `apps/web/src/lib/negative-banks.ts`

Negative prompts suppress unwanted features (wrong style, AI artifacts, hallucinations). They are assembled in layers:

```
Global negatives (all generations)
    + Tool negatives (tool-specific: generate, animate, rotate, inpaint, scene)
    + Preset negatives (preset-specific: portrait, rpg_icon, etc.)
```

### Exported Constants

| Constant | Applied to |
|----------|-----------|
| `PIXEL_NEGATIVES` | Pixel mode: aggressive anti-photorealism set |
| `GLOBAL_PIXEL_NEGATIVES` | Every pixel generation |
| `TOOL_NEGATIVES` | Per-tool additions (Record<tool, string[]>) |
| `PRESET_NEGATIVES` | Per-preset additions (Record<preset, string[]>) |
| `BUSINESS_NEGATIVES` | Business mode negatives |
| `GLOBAL_BUSINESS_NEGATIVES` | Every business generation |

### Encoding for Providers Without Native Negative Support

Together (FLUX.1-schnell-Free) and Pollinations do not accept a negative prompt field. For these providers, use:

```typescript
import { encodeNegativesIntoPositive } from '@/lib/negative-banks';

const positiveWithNegatives = encodeNegativesIntoPositive(positivePrompt, negativeTokens);
// Appends: " | negative: token1, token2, ..."
```

This uses CLIP's natural language understanding to reduce the probability of the negative concepts appearing — it's less effective than native negative prompts but better than nothing.

### How to Tune Negative Tokens

- **Add a token:** Add it to the most specific applicable array (preset > tool > global)
- **Remove a noisy token:** Remove from the array — be conservative, tokens are there for a reason
- **Test changes:** Run 5–10 generations on the affected preset and compare
- Keep tokens short and specific (1–3 words) — long phrases reduce effectiveness
- Avoid contradictory tokens with the positive prompt

---

## 5. Mode System

**Files:**
- `apps/web/src/lib/modes/` — mode config registry
- `apps/web/src/lib/modes/types.ts` — ModeContract interface
- `modes/{mode}/schema.ts` — mode input schema (TypeScript)
- `modes/{mode}/README.md` — what the mode is/isn't for

### ModeContract Interface

```typescript
interface ModeContract {
  id: ModeId;
  name: string;
  description: string;
  targetAudience: string;
  outputTypes: OutputType[];
  exportFormats: ExportFormat[];
  status: ModeStatus;   // 'live' | 'beta' | 'coming_soon'
  studioPath: string;   // e.g. '/pixel/studio'
}
```

### Mode Registry

All modes are registered in `apps/web/src/lib/modes/index.ts`:

```typescript
export const MODES: Record<ModeId, ModeContract> = {
  pixel, business, vector, emoji, uiux, voice, text
};

export const LIVE_MODES    = MODES_LIST.filter(m => m.status === 'live' || m.status === 'beta');
export const COMING_SOON_MODES = MODES_LIST.filter(m => m.status === 'coming_soon');
```

To add a new mode, see [CONTRIBUTING.md](../CONTRIBUTING.md#how-to-add-a-new-asset-engine-mode). The short checklist is in [docs/PIPELINES.md — E3](./PIPELINES.md#e3--adding-a-new-page--mode).

### Mode Isolation Rules

- Each mode has its own gallery, prompt schema, negative bank, quality profiles, and export tooling
- Mode-switching inside a workspace is not permitted (enforced at the project model level)
- Cross-mode asset reuse requires explicit export/import
- Gallery queries always scope to `mode = req.mode` — never leak across modes

---

## 6. Billing & Quota

**Files:**
- `apps/web/src/lib/quota.ts` — HD credit check and deduction
- `apps/web/src/lib/plan-limits.ts` — workspace count limits per plan tier
- `apps/web/src/lib/stripe.ts` — Stripe integration (webhooks, checkout, credit packs)
- `apps/web/prisma/schema.prisma` — User model fields: `hdTopUpCredits`, `hdMonthlyUsed`, `stdGenToday`, `stdGenDate`

### Credit Buckets

```
User
├── hdMonthlyUsed      — HD credits consumed this billing period (resets on renewal)
├── hdTopUpCredits     — One-time purchased credits (never expire)
└── stdGenToday        — Standard generations today (resets at midnight UTC via stdGenDate)
```

**Deduction order for HD:** `hdMonthlyUsed` increments first (against plan allocation), then falls through to `hdTopUpCredits` if monthly allocation is exhausted.

**Standard generation:** `stdGenToday` is incremented atomically. `stdGenDate` is compared to today's UTC date — if different, the counter resets.

### Plan Tiers

Defined in `plan-limits.ts`:
```typescript
const PLAN_WORKSPACE_LIMITS: Record<string, number> = {
  free: 3,
  plus: 10,
  pro:  25,
  max:  50,
};
```

To add a new tier: add an entry here and create the corresponding `Plan` record in the database (via Prisma seed or migration).

### Stripe Integration

- Checkout sessions created in `apps/web/src/app/api/billing/checkout/route.ts`
- Webhook handler at `apps/web/src/app/api/billing/webhook/route.ts`
- `stripe.ts` exports helpers: `createCheckoutSession()`, `createPortalSession()`, `handleWebhook()`
- Required env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_*_PRICE_ID` (one per product)

**Credit pack flow:**
```
User clicks "Buy Credits"
    → createCheckoutSession() with credit pack metadata
    → Stripe Checkout
    → Payment success → webhook → handleWebhook()
    → prisma.user.update({ hdTopUpCredits: { increment: packSize } })
```

**Subscription flow:**
```
User upgrades plan
    → createCheckoutSession() with plan price ID
    → Stripe subscription created
    → webhook → handleWebhook()
    → prisma.subscription.upsert({ plan: newPlan })
```

---

## 7. Rate Limiting

**Files:**
- `apps/web/src/lib/rate-limit.ts` — sliding window rate limiter
- `apps/web/src/middleware.ts` — request-level rate limiting on API routes

### Three-Tier Fallback

```
Upstash Redis (primary) — correct across all Vercel instances
    ↓ if not configured (no UPSTASH_REDIS_REST_URL)
Postgres (fallback) — ~10ms per check, correct but slower
    ↓ if Postgres check fails
In-memory (last resort) — ONLY safe for local dev, NOT for production
```

### Usage in Route Handlers

```typescript
import { rateLimit } from '@/lib/rate-limit';

const key = session?.user?.id ?? `ip:${getClientIp(req)}`;
const result = await rateLimit(key, 10, 60_000); // 10 req / 60s
if (!result.allowed) {
  return new Response('Rate limit exceeded', {
    status: 429,
    headers: { 'Retry-After': String(result.retryAfter ?? 60) },
  });
}
```

### Changing Limits

Rate limit parameters are set at the call site in each route handler. To change limits:
- Authenticated users: find the `rateLimit()` call in the route file and modify `max` / `windowMs`
- Guest users: the middleware (`src/middleware.ts`) applies tighter limits to unauthenticated requests
- For a global change, search for `rateLimit(` across `src/app/api/`

### Redis Cache (Upstash)

Beyond rate limiting, Upstash Redis is also used for:
- **Gallery cache** — caches gallery query results (TTL: 60s by default)
- **Generation queue** — tracks in-flight generations per user (prevents duplicate submissions)

Cache logic: `apps/web/src/lib/cache.ts`

---

## 8. Feature Flags

**File:** `apps/web/src/lib/feature-flags.ts`

Feature flags are environment-variable driven. No external flag service — just env vars checked at request time.

| Flag | Env var | Effect |
|------|---------|--------|
| Maintenance mode | `MAINTENANCE_MODE=true` | Returns 503 on all routes except `/api/health` |
| Disable signups | `DISABLE_SIGNUPS=true` | Prevents new account creation |
| Disable guest generation | `DISABLE_GUEST_GENERATION=true` | Requires auth for all generations |
| Quality gate | `ENABLE_QUALITY_GATE=false` | Disables image entropy/quality check on outputs |
| Generation concurrency | `GENERATION_CONCURRENCY=10` | Max simultaneous AI calls per serverless instance |
| Max batch size | `MAX_BATCH_SIZE=8` | Max images per batch generation request |

### Quality Gate

When `ENABLE_QUALITY_GATE=true` (default), each generated image passes through an entropy check in `apps/web/src/lib/image-quality.ts`. Images that are too uniform (blank/solid color) or too noisy (corrupted) are rejected and trigger a provider retry.

To tune the quality gate thresholds, edit the constants in `image-quality.ts`.

### Adding a New Feature Flag

1. Add the env var check to `feature-flags.ts`:
   ```typescript
   export const MY_FLAG = process.env.MY_FLAG === 'true';
   ```
2. Use it in the relevant route or component
3. Document in `docs/ENV.md` under the Feature Flags section
