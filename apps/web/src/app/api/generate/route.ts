import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { log as logger } from '@/lib/logger';
import {
  generate,
  resolveProviderConfig,
  assertKeyPresent,
  serializeError,
} from '@/lib/providers';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  claimStdSlot,
  checkConcurrent,
  releaseConcurrentSlot,
  getUserPlanId,
  PER_MIN_RATE,
} from '@/lib/quota';
import { sendLowCreditsEmail } from '@/lib/email';
import { isSupportedMode, getMode } from '@/lib/modes';
import type { ProviderName, Tool, GenerateParams, GenerateResult } from '@/lib/providers';
import {
  buildBusinessPrompt,
  type BusinessTool,
  type BusinessStyle,
  type BusinessMood,
  type BusinessPlatform,
} from '@/lib/prompt-builder-business';
import {
  buildVectorPrompt,
  type VectorTool,
  type VectorStyle,
  type VectorWeight,
} from '@/lib/prompt-builder-vector';
import { buildPixelPrompt } from '@/lib/prompt-builder-pixel';
import { removeBackground, removeBackgroundWithFallback } from '@/lib/bg-remove';
import { resolveOptimalProvider } from '@/lib/provider-router';
import { assembleNegativePrompt, encodeNegativesIntoPositive } from '@/lib/negative-banks';
import { validateAndSanitize, autoEnrichPrompt } from '@/lib/prompt-validator';
import { resolveQualityProfile, getQualityProfile } from '@/lib/quality-profiles';
import { buildVariantPrompt } from '@/lib/variant-builder';
import { buildPrompt as buildEnginePrompt } from '@/lib/prompt-engine';
import { validatePrompt } from '@/lib/input-sanitize';

// ---------------------------------------------------------------------------
// POST /api/generate
//
// Three modes:
//   SELF_HOSTED=true  → BYOK, no auth, no quota
//   Authenticated     → standard (free) or HD (credit-gated)
//   Guest             → standard only, IP rate-limited (5 req/min)
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// Module-level provider failure tracker (Redis-backed with in-memory fallback)
// Skips providers that have failed ≥3 times in the last 60 seconds.
// ---------------------------------------------------------------------------
const _providerFailureCounts = new Map<string, { count: number; resetAt: number }>();
const _FAILURE_WINDOW_MS = 60_000;
const _MAX_FAILURES = 3;
const _FAILURE_KEY_PREFIX = 'wokgen:provider:fail:';
const _FAILURE_TTL = 60; // seconds

function _getRedisClient() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    return new Redis({ url, token });
  } catch { return null; }
}

async function recordProviderFailure(provider: string): Promise<void> {
  const redis = _getRedisClient();
  if (redis) {
    try {
      await redis.incr(`${_FAILURE_KEY_PREFIX}${provider}`);
      await redis.expire(`${_FAILURE_KEY_PREFIX}${provider}`, _FAILURE_TTL);
      return;
    } catch { /* fall through to in-memory */ }
  }
  // In-memory fallback
  const now = Date.now();
  const entry = _providerFailureCounts.get(provider);
  if (!entry || now > entry.resetAt) {
    _providerFailureCounts.set(provider, { count: 1, resetAt: now + _FAILURE_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

async function isProviderThrottled(provider: string): Promise<boolean> {
  const redis = _getRedisClient();
  if (redis) {
    try {
      const val = await redis.get(`${_FAILURE_KEY_PREFIX}${provider}`) as number | null;
      return (val ?? 0) >= _MAX_FAILURES;
    } catch { /* fall through to in-memory */ }
  }
  // In-memory fallback
  const now = Date.now();
  const entry = _providerFailureCounts.get(provider);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= _MAX_FAILURES;
}

/** Ordered fallback providers to try when `primary` fails (non-self-hosted only). */
function getFallbackChain(primary: ProviderName): ProviderName[] {
  const candidates: Array<{ provider: ProviderName; key?: string }> = [
    { provider: 'together',    key: 'TOGETHER_API_KEY' },
    { provider: 'huggingface', key: 'HF_TOKEN' },
    { provider: 'pollinations' }, // always available — no key needed
  ];
  return candidates
    .filter(c => c.provider !== primary && (!c.key || Boolean(process.env[c.key])))
    .map(c => c.provider);
}

export async function POST(req: NextRequest) {
  const isSelfHosted = process.env.SELF_HOSTED === 'true';
  // Generate a request ID for tracing
  const requestId = randomUUID().slice(0, 10);

  // --------------------------------------------------------------------------
  // 0. Auth + quota enforcement (hosted mode only)
  //
  // Tiers enforced:
  //   guest → 3 std/day per IP,  2 req/min,  max 1 concurrent
  //   free  → 10 std/day,        5 req/min,  max 2 concurrent
  //   plus  → unlimited std,    15 req/min,  max 3 concurrent
  //   pro   → unlimited std,    30 req/min,  max 5 concurrent
  // --------------------------------------------------------------------------
  let authedUserId: string | null = null;
  let useHD = false;

  // Extract client IP once (used for both rate-limit and guest quota)
  const clientIP =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!isSelfHosted) {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    authedUserId = session?.user?.id ?? null;

    // ── 0a. Per-minute rate limit ─────────────────────────────────────────
    // Key: userId for authenticated users, IP for guests.
    // Rate limits enforced via Redis (shared across all Vercel instances).
    const rateLimitKey = authedUserId ?? clientIP;

    // Resolve plan tier for rate limit (skip heavy DB lookup; use fast path)
    // We'll do the full planId lookup below only for quota enforcement.
    let rlPlanId = 'guest';
    if (authedUserId) {
      rlPlanId = await getUserPlanId(authedUserId); // ~1 DB read, cached in Redis
    }
    const rlTier  = authedUserId ? rlPlanId : 'guest';
    const maxReqs = PER_MIN_RATE[rlTier] ?? PER_MIN_RATE.free;

    const rl = await checkRateLimit(rateLimitKey, maxReqs, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.retryAfter}s.` },
        { status: 429, headers: {
          'Retry-After':           String(rl.retryAfter ?? 60),
          'X-RateLimit-Limit':     String(maxReqs),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(Math.floor(Date.now() / 1000) + (rl.retryAfter ?? 60)),
        } },
      );
    }

    // ── 0b. Parse body (needed to determine if HD) ────────────────────────
    let rawBody: Record<string, unknown> = {};
    try {
      rawBody = await req.json();
      (req as NextRequest & { _parsedBody?: Record<string, unknown> })._parsedBody = rawBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const requestedHD = rawBody.quality === 'hd';
    const planId      = authedUserId ? rlPlanId : 'guest'; // reuse already-fetched planId

    // ── 0c. HD credits check ──────────────────────────────────────────────
    if (requestedHD) {
      if (!authedUserId) {
        return NextResponse.json(
          { error: 'Sign in to use HD generation.' },
          { status: 401 },
        );
      }
      const user = await prisma.user.findUnique({
        where: { id: authedUserId },
        select: {
          hdMonthlyUsed:  true,
          hdTopUpCredits: true,
          subscription: {
            select: {
              plan: { select: { creditsPerMonth: true } },
            },
          },
        },
      });
      const monthlyAllocation = user?.subscription?.plan.creditsPerMonth ?? 0;
      const monthlyUsed       = user?.hdMonthlyUsed ?? 0;
      const monthlyRemaining  = Math.max(0, monthlyAllocation - monthlyUsed);
      const topUpBank         = user?.hdTopUpCredits ?? 0;

      if (monthlyRemaining > 0 || topUpBank > 0) {
        useHD = true;
      } else {
        return NextResponse.json(
          {
            error: 'No HD credits remaining. Buy a top-up pack or upgrade your plan.',
            hdCredits: { monthlyRemaining: 0, topUpBank: 0 },
          },
          { status: 402 },
        );
      }
    }

    // ── 0d. Standard daily quota ──────────────────────────────────────────
    // Enforced for ALL standard (non-HD) generations, including guests.
    // Atomic: either claims the slot or rejects. No double-counting.
    if (!requestedHD) {
      const quota = await claimStdSlot(authedUserId, clientIP, planId);
      if (!quota.allowed) {
        const isGuest = !authedUserId;
        return NextResponse.json(
          {
            error: isGuest
              ? `Daily limit reached (${quota.limit} free generations/day). Sign up for more.`
              : `Daily generation limit reached (${quota.used}/${quota.limit}). Resets in ${Math.ceil((quota.retryAfter ?? 3600) / 3600)}h.`,
            quota: {
              used:       quota.used,
              limit:      quota.limit,
              remaining:  0,
              tier:       quota.tier,
              resetsIn:   quota.retryAfter,
            },
            code: 'QUOTA_EXCEEDED',
          },
          { status: 429, headers: {
            'Retry-After':           String(quota.retryAfter ?? 3600),
            'X-RateLimit-Limit':     String(quota.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset':     String(Math.floor(Date.now() / 1000) + (quota.retryAfter ?? 3600)),
          } },
        );
      }

      // Attach quota info to response headers for frontend to read
      (req as NextRequest & { _quotaRemaining?: number })._quotaRemaining = quota.remaining;

      // Fire quota_warning notification at 80% usage (once per day, non-blocking)
      if (authedUserId && quota.limit > 0 && quota.remaining > 0) {
        const usedPct = quota.used / quota.limit;
        if (usedPct >= 0.8) {
          const warnKey = `wokgen:quota_warn:${authedUserId}:${new Date().toISOString().slice(0, 10)}`;
          import('@/lib/cache').then(({ cache }) =>
            cache.get<boolean>(warnKey).then(already => {
              if (!already) {
                cache.set(warnKey, true, 86400); // once per day
                prisma.notification.create({
                  data: {
                    userId: authedUserId!,
                    type:   'quota_warning',
                    title:  'Approaching daily limit',
                    body:   `You've used ${quota.used} of your ${quota.limit} daily generations (${Math.round(usedPct * 100)}%).`,
                    link:   '/billing',
                  },
                }).catch(() => {});
              }
            })
          ).catch(() => {});
        }
      }
    }

    // ── 0e. Concurrent request limit ─────────────────────────────────────
    // Prevents one user from monopolising generation workers.
    const concur = await checkConcurrent(authedUserId, clientIP, planId);
    if (!concur.allowed) {
      // For guests: release the concurrent slot we just claimed
      if (!authedUserId) await releaseConcurrentSlot(clientIP);
      return NextResponse.json(
        {
          error: 'You already have a generation in progress. Please wait for it to finish.',
          concurrent: { running: concur.running, max: concur.max },
          code: 'CONCURRENT_LIMIT',
        },
        { status: 503, headers: { 'Retry-After': '60' } },
      );
    }
  }



  // --------------------------------------------------------------------------
  // 1. Parse & validate request body
  // --------------------------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    body = (req as NextRequest & { _parsedBody?: Record<string, unknown> })._parsedBody
      ?? await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const {
    tool       = 'generate',
    provider   = detectProvider(),
    mode       = 'pixel',        // product line: pixel | business | vector | uiux
    prompt,
    negPrompt,
    width      = 512,
    height     = 512,
    seed,
    steps,
    guidance,
    stylePreset,
    assetCategory,
    pixelEra,
    backgroundMode,
    outlineStyle,
    paletteSize,
    projectId,
    isPublic   = false,
    _promptBuilt = false, // studio already built prompt — skip server-side enrichment
    // BYOK fields — only used in self-hosted mode; stripped in hosted mode
    apiKey: byokKey,
    comfyuiHost: byokHost,
    modelOverride,
    extra,
    async: asyncFlag = false, // flag for BullMQ async path
  } = body;

  // Validate prompt length and sanitize at API boundary
  if (prompt !== undefined) {
    const promptCheck = validatePrompt(prompt);
    if (!promptCheck.ok) {
      return NextResponse.json({ error: promptCheck.error }, { status: 400 });
    }
  }

  // Async path: enqueue and return immediately if REDIS_URL + async flag
  if (asyncFlag === true && process.env.REDIS_URL && authedUserId) {
    const { enqueueGeneration } = await import('@/lib/gen-queue');
    const queueJobId = randomUUID();
    const effectivePrompt = typeof prompt === 'string' ? prompt.trim() : '';
    const effectiveMode = typeof mode === 'string' && isSupportedMode(mode) ? mode : 'pixel';
    const effectiveStyle = typeof stylePreset === 'string' ? stylePreset : undefined;
    
    try {
      await enqueueGeneration({
        jobId: queueJobId,
        userId: authedUserId,
        prompt: effectivePrompt,
        mode: effectiveMode,
        style: effectiveStyle,
      });
      return NextResponse.json(
        { jobId: queueJobId, status: 'queued' },
        { status: 202 },
      );
    } catch (error) {
      logger.warn({ jobId: queueJobId, error }, '[async] Failed to enqueue generation');
      // Fall through to sync path on failure
    }
  }

  // Resolve and validate mode — reject unknown modes with a 400
  if (mode !== undefined && mode !== null && !isSupportedMode(mode)) {
    return NextResponse.json(
      { error: `Invalid mode "${mode}". Must be one of: pixel, business, vector, uiux` },
      { status: 400 },
    );
  }
  const resolvedMode = isSupportedMode(mode) ? mode : 'pixel';
  const modeContract = getMode(resolvedMode);

  // Voice and text modes have dedicated endpoints — reject early with a helpful message
  if (resolvedMode === 'voice') {
    return NextResponse.json(
      { error: 'Voice generation uses /api/voice/generate', code: 'WRONG_ENDPOINT' },
      { status: 400 },
    );
  }
  if (resolvedMode === 'text') {
    return NextResponse.json(
      { error: 'Text generation uses /api/text/generate', code: 'WRONG_ENDPOINT' },
      { status: 400 },
    );
  }

  // In hosted mode: ignore any client-supplied provider keys
  const resolvedByokKey  = isSelfHosted ? (typeof byokKey  === 'string' ? byokKey  : null) : null;
  const resolvedByokHost = isSelfHosted ? (typeof byokHost === 'string' ? byokHost : null) : null;
  // In hosted mode: use quality-aware provider matrix; self-hosted uses client-supplied provider
  const resolvedProvider: ProviderName = isSelfHosted
    ? (provider as ProviderName)
    : resolveOptimalProvider(
        isSupportedMode(mode) ? String(mode) : 'pixel',
        typeof tool === 'string' ? tool : 'generate',
        useHD,
      );

  // Override model for HD if mode specifies a specific model
  const effectiveModelOverride = useHD && modeContract.models.hdModelId && !modelOverride
    ? modeContract.models.hdModelId
    : (typeof modelOverride === 'string' ? modelOverride : undefined);

  // Guard: HD requires REPLICATE_API_TOKEN on server
  if (useHD && !process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'HD generation is temporarily unavailable. Please try standard quality.', code: 'PROVIDER_ERROR' },
      { status: 503, headers: { 'Retry-After': '60' } },
    );
  }

  // --------------------------------------------------------------------------
  // Business mode: enrich prompt via buildBusinessPrompt + normalize tool name
  // --------------------------------------------------------------------------
  const extraRecord = (extra as Record<string, unknown>) ?? {};
  let effectiveTool: string   = typeof tool === 'string' ? tool : 'generate';
  let effectivePrompt: string = typeof prompt === 'string' ? prompt.trim() : '';
  let effectiveNeg: string | undefined = typeof negPrompt === 'string' ? negPrompt.trim() || undefined : undefined;
  let effectiveWidth: number  = clampSize(Number(width)  || 512);
  let effectiveHeight: number = clampSize(Number(height) || 512);

  // Apply batch variant mutation (sent by pixel studio as variantIndex in body)
  const variantIndex = typeof body.variantIndex === 'number' ? body.variantIndex : 0;
  if (variantIndex > 0 && effectivePrompt) {
    effectivePrompt = buildVariantPrompt(
      effectivePrompt,
      variantIndex,
      effectiveTool,
      typeof stylePreset === 'string' ? stylePreset : undefined,
    );
  }

  if (resolvedMode === 'business') {
    // All business tools map to the standard 'generate' pipeline
    const originalTool = effectiveTool; // capture before override
    effectiveTool = 'generate';
    const bizTool     = ((extraRecord.businessTool ?? originalTool) as BusinessTool) || 'logo';
    const bizStyle    = (extraRecord.businessStyle  ?? body.style)  as BusinessStyle  | undefined;
    const bizMood     = (extraRecord.businessMood   ?? body.mood)   as BusinessMood   | undefined;
    const bizPlatform = (extraRecord.businessPlatform ?? body.platform) as BusinessPlatform | undefined;
    const bizIndex    = typeof extraRecord.brandKitIndex === 'number'
      ? extraRecord.brandKitIndex as 1 | 2 | 3 | 4
      : undefined;

    // ── Brand Kit injection: if projectId is provided, fetch the project's
    //    brand kit and auto-inject colors, mood, and industry into the prompt.
    let brandColorDirection: string | undefined = typeof body.colorDirection === 'string' ? body.colorDirection || undefined : undefined;
    let brandIndustry:       string | undefined = typeof body.industry       === 'string' ? body.industry       || undefined : undefined;
    let brandMoodOverride:   BusinessMood | undefined = bizMood;

    if (typeof projectId === 'string' && projectId) {
      try {
        const kit = await prisma.brandKit.findFirst({
          where:  { projectId },
          select: { paletteJson: true, mood: true, industry: true },
        });
        if (kit) {
          // Parse palette JSON → extract primary hex color direction string
          const palette = JSON.parse(kit.paletteJson || '[]') as { hex?: string; role?: string }[];
          const primaryColor = palette.find(c => c.role === 'primary' || c.role === 'brand')?.hex
            ?? palette[0]?.hex;
          if (primaryColor && !brandColorDirection) {
            brandColorDirection = primaryColor; // inject primary brand color
          }
          if (kit.industry && !brandIndustry)  brandIndustry      = kit.industry;
          if (kit.mood     && !brandMoodOverride) brandMoodOverride = kit.mood as BusinessMood;
        }
      } catch { /* non-fatal — brand kit fetch failure should not block generation */ }
    }

    const built = buildBusinessPrompt({
      tool:           bizTool,
      concept:        effectivePrompt || 'professional brand visual',
      industry:       brandIndustry,
      style:          bizStyle,
      mood:           brandMoodOverride,
      platform:       bizPlatform,
      colorDirection: brandColorDirection,
      brandKitIndex:  bizIndex,
    });
    effectivePrompt  = built.prompt;
    effectiveNeg     = built.negPrompt;
    // For brand-kit each index has different dimensions; use builder output
    if (bizTool === 'brand-kit') {
      effectiveWidth  = built.width;
      effectiveHeight = built.height;
    } else {
      // For other business tools the studio passes correct dimensions; keep them
      // but fall back to builder dims if studio sent defaults
      if (effectiveWidth === 512 && effectiveHeight === 512) {
        effectiveWidth  = built.width;
        effectiveHeight = built.height;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Pixel mode: enrich prompt via buildPixelPrompt
  // --------------------------------------------------------------------------
  if (resolvedMode === 'pixel' && effectivePrompt && !_promptBuilt) {
    const spriteType =
      typeof extraRecord.spriteType === 'string' ? extraRecord.spriteType
      : typeof assetCategory === 'string' && assetCategory !== 'none' ? assetCategory
      : undefined;
    const pixelEraStr  = typeof pixelEra === 'string' && pixelEra !== 'none' ? pixelEra : undefined;
    const paletteSizeN = typeof paletteSize === 'number' ? paletteSize : undefined;
    const frameCountN  = typeof extraRecord.animFrameCount === 'number' ? extraRecord.animFrameCount : undefined;

    const built = buildPixelPrompt({
      concept:     effectivePrompt,
      width:       effectiveWidth,
      height:      effectiveHeight,
      spriteType,
      era:         pixelEraStr,
      paletteSize: paletteSizeN,
      frameCount:  frameCountN,
    });

    effectivePrompt = built.prompt;
    effectiveNeg    = effectiveNeg
      ? `${effectiveNeg}, ${built.negPrompt}`
      : built.negPrompt;
  }

  // --------------------------------------------------------------------------
  // Vector mode: enrich prompt via buildVectorPrompt
  // --------------------------------------------------------------------------
  if (resolvedMode === 'vector' && effectivePrompt && !_promptBuilt) {
    const vTool    = (extraRecord.vectorTool   ?? 'icon')    as VectorTool;
    const vStyle   = (extraRecord.vectorStyle  ?? 'outline') as VectorStyle;
    const vWeight  = (extraRecord.strokeWeight ?? 'regular') as VectorWeight;
    const vColors  = typeof body.colorCount === 'number' ? body.colorCount : 1;
    const built    = buildVectorPrompt({
      tool:        vTool,
      concept:     effectivePrompt,
      style:       vStyle,
      strokeWeight: vWeight,
      colorCount:  vColors,
      category:    typeof body.category === 'string' ? body.category : undefined,
    });
    effectivePrompt  = built.prompt;
    effectiveNeg     = effectiveNeg ? `${effectiveNeg}, ${built.negPrompt}` : built.negPrompt;
    if (effectiveWidth === 512 && effectiveHeight === 512) {
      effectiveWidth  = built.width;
      effectiveHeight = built.height;
    }
  }

  // Validate required fields
  if (effectivePrompt.length === 0) {
    return NextResponse.json(
      { error: 'prompt is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  // --------------------------------------------------------------------------
  // Mode quality booster — appended after all builders, before validation.
  // Adds a consistent set of quality anchors per mode without overriding user
  // intent. Only applied when the prompt was NOT pre-built by the studio.
  // --------------------------------------------------------------------------
  const QUALITY_BOOSTERS: Record<string, string> = {
    pixel:    'best quality, masterpiece, highly detailed pixel art, game-ready, crisp pixel grid',
    business: 'professional quality, clean design, high resolution, polished, masterpiece',
    vector:   'clean vector art, crisp edges, scalable, professional quality, print ready',
    uiux:     'clean UI design, professional interface, modern, accessible, pixel perfect',
  };

  if (!_promptBuilt) {
    const booster = QUALITY_BOOSTERS[resolvedMode];
    if (booster) {
      effectivePrompt = `${effectivePrompt}, ${booster}`;
    }
  }

  // --------------------------------------------------------------------------
  // Prompt pipeline: validate + sanitize → negative bank assembly
  // --------------------------------------------------------------------------
  const validation = validateAndSanitize(
    effectivePrompt,
    effectiveNeg,
    resolvedMode,
    typeof stylePreset === 'string' ? stylePreset : undefined,
    resolvedProvider,
  );

  if (validation.invalid) {
    return NextResponse.json(
      { error: validation.invalidReason ?? 'Prompt is too short or contains no meaningful content.' },
      { status: 400 },
    );
  }

  effectivePrompt = validation.sanitized;
  effectiveNeg    = validation.sanitizedNeg || undefined;

  // Auto-enrich minimal prompts with art-direction context
  const enrichResult = autoEnrichPrompt(effectivePrompt, resolvedMode);
  if (enrichResult.wasEnriched) effectivePrompt = enrichResult.enriched;

  // Assemble rich negative prompt (merges user neg + automatic banks)
  // For business mode the route already built a neg above — augment it
  const richNeg = assembleNegativePrompt(
    effectiveTool,
    typeof stylePreset === 'string' ? stylePreset : undefined,
    effectiveNeg,
    resolvedMode,
  );

  // Providers without native negative prompt support get negatives injected
  // into the positive prompt via CLIP avoidance tokens
  const { PROVIDER_CAPABILITIES } = await import('@/lib/providers/types');
  const providerCaps = PROVIDER_CAPABILITIES[resolvedProvider];
  if (providerCaps && !providerCaps.supportsNegativePrompt && richNeg) {
    effectivePrompt = encodeNegativesIntoPositive(effectivePrompt, richNeg);
    effectiveNeg    = undefined; // don't send neg to provider that ignores it
  } else if (richNeg) {
    effectiveNeg = richNeg;
  }

  // Resolve quality profile — mode-aware first, then preset-level fallback
  // Mode-aware profile picks up correct steps/guidance tuned per mode+type.
  const modeType = (() => {
    if (resolvedMode === 'pixel') {
      const spriteType = typeof body.extra === 'object' && body.extra !== null
        ? (body.extra as Record<string, unknown>).spriteType as string | undefined
        : undefined;
      return spriteType ?? (typeof stylePreset === 'string' ? stylePreset : 'standard');
    }
    if (resolvedMode === 'business') {
      return typeof (body.extra as Record<string, unknown>)?.businessTool === 'string'
        ? String((body.extra as Record<string, unknown>).businessTool)
        : 'standard';
    }
    if (resolvedMode === 'vector') {
      return typeof (body.extra as Record<string, unknown>)?.vectorTool === 'string'
        ? String((body.extra as Record<string, unknown>).vectorTool)
        : 'standard';
    }
    if (resolvedMode === 'uiux') {
      return typeof stylePreset === 'string' ? stylePreset.replace('uiux_', '') : 'standard';
    }
    return 'standard';
  })();
  const modeQuality    = getQualityProfile(resolvedMode, modeType, useHD);
  const presetQuality  = resolveQualityProfile(typeof stylePreset === 'string' ? stylePreset : undefined);
  // Client-supplied values take priority, then mode-aware, then preset-level
  let resolvedSteps    = typeof steps    === 'number' ? steps    : (modeQuality.steps    ?? presetQuality.steps);
  let resolvedGuidance = typeof guidance === 'number' ? guidance : (modeQuality.guidance ?? presetQuality.guidance);

  // --------------------------------------------------------------------------
  // Prompt engine hardening — enforce mode-specific guidance floors, step
  // minimums, and transparent-background negatives via the unified PromptConfig
  // interface. Runs after all per-mode builders so it only augments the final
  // assembled prompt rather than replacing builder output.
  // --------------------------------------------------------------------------
  if (isSupportedMode(resolvedMode)) {
    const engineHint = buildEnginePrompt({
      mode: resolvedMode as 'pixel' | 'business' | 'vector' | 'uiux',
      userPrompt: typeof prompt === 'string' ? prompt.trim() : '',
      backgroundMode: typeof backgroundMode === 'string'
        ? (backgroundMode as 'default' | 'transparent' | 'custom')
        : 'default',
      subType:
        typeof extraRecord.businessTool === 'string' ? extraRecord.businessTool
        : typeof extraRecord.vectorTool  === 'string' ? extraRecord.vectorTool
        : typeof assetCategory === 'string' && assetCategory !== 'none' ? String(assetCategory)
        : undefined,
    });
    // Enforce guidance and steps floors when client didn't override them
    if (typeof guidance !== 'number') {
      resolvedGuidance = Math.max(resolvedGuidance, engineHint.guidance);
    }
    if (typeof steps !== 'number') {
      resolvedSteps = Math.max(resolvedSteps, engineHint.steps);
    }
    // Prepend engine negatives (highest priority, before assembleNegativePrompt)
    const firstEngineNegTerm = engineHint.negative.split(',')[0].trim().toLowerCase();
    if (engineHint.negative && !effectiveNeg?.toLowerCase().includes(firstEngineNegTerm)) {
      effectiveNeg = effectiveNeg
        ? `${engineHint.negative}, ${effectiveNeg}`
        : engineHint.negative;
    }
  }

  if (!isValidTool(effectiveTool)) {
    return NextResponse.json(
      {
        error: `Invalid tool "${effectiveTool}". Must be one of: generate, animate, rotate, inpaint, scene`,
      },
      { status: 400 },
    );
  }

  if (!isValidProvider(resolvedProvider)) {
    return NextResponse.json(
      {
        error: `Invalid provider "${resolvedProvider}". Must be one of: replicate, fal, together, comfyui`,
      },
      { status: 400 },
    );
  }

  // --------------------------------------------------------------------------
  // 2. Resolve provider config (env vars merged with BYOK overrides)
  // --------------------------------------------------------------------------
  const config = resolveProviderConfig(
    resolvedProvider,
    resolvedByokKey,
    resolvedByokHost,
  );

  try {
    assertKeyPresent(resolvedProvider, config);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 },
    );
  }

  // --------------------------------------------------------------------------
  // 3. Create the Job record in the database (status = "running")
  //    DB is optional — if DATABASE_URL is not configured or the schema has
  //    not been migrated yet, we skip job tracking and still run generation.
  // --------------------------------------------------------------------------
  const dbAvailable = Boolean(process.env.DATABASE_URL);
  let job: Awaited<ReturnType<typeof prisma.job.create>> | null = null;

  if (dbAvailable) {
    try {
      job = await prisma.job.create({
        data: {
          tool:       effectiveTool as Tool,
          status:     'running',
          provider:   resolvedProvider,
          prompt:     effectivePrompt,
          negPrompt:  effectiveNeg ?? null,
          width:      effectiveWidth,
          height:     effectiveHeight,
          seed:       typeof seed === 'number' && seed > 0 ? seed : null,
          isPublic:   Boolean(isPublic),
          params:     extra ? JSON.stringify(extra) : null,
          mode:       resolvedMode,
          ...(typeof projectId === 'string' ? { projectId } : {}),
          ...(authedUserId ? { userId: authedUserId } : {}),
        },
      });
    } catch (dbErr) {
      // Non-fatal — log and continue without job tracking
      logger.warn({ err: (dbErr as Error).message }, '[generate] DB unavailable, running without job tracking');
    }
  }

  // --------------------------------------------------------------------------
  // 4. Build GenerateParams and run the provider
  // --------------------------------------------------------------------------
  const genParams: GenerateParams = {
    tool:           effectiveTool as Tool,
    prompt:         effectivePrompt,
    negPrompt:      effectiveNeg,
    width:          effectiveWidth,
    height:         effectiveHeight,
    seed:           typeof seed === 'number' && seed > 0 ? seed : undefined,
    steps:          resolvedSteps,
    guidance:       resolvedGuidance,
    stylePreset:    isValidStylePreset(stylePreset) ? stylePreset : undefined,
    assetCategory:  typeof assetCategory === 'string' ? assetCategory as GenerateParams['assetCategory'] : undefined,
    pixelEra:       typeof pixelEra === 'string' ? pixelEra as GenerateParams['pixelEra'] : undefined,
    backgroundMode: typeof backgroundMode === 'string' ? backgroundMode as GenerateParams['backgroundMode'] : undefined,
    outlineStyle:   typeof outlineStyle === 'string' ? outlineStyle as GenerateParams['outlineStyle'] : undefined,
    paletteSize:    typeof paletteSize === 'number' ? paletteSize as GenerateParams['paletteSize'] : undefined,
    modelOverride:  effectiveModelOverride,
    extra:          extra as Record<string, unknown> | undefined,
    mode:           resolvedMode,
    useHD,
  };

  try {
    // Build provider chain: primary first, then key-available fallbacks (skip throttled ones).
    const fallbacks = getFallbackChain(resolvedProvider);
    const throttledChecks = await Promise.all(fallbacks.map(p => isProviderThrottled(p)));
    const availableFallbacks = fallbacks.filter((_, i) => !throttledChecks[i]);
    const providerChain: ProviderName[] = isSelfHosted
      ? [resolvedProvider]
      : [resolvedProvider, ...availableFallbacks];

    let usedProvider: ProviderName = resolvedProvider;
    let result: GenerateResult | undefined;
    let lastErr: unknown;

    for (const candidateProvider of providerChain) {
      try {
        const candidateConfig = candidateProvider === resolvedProvider
          ? config
          : resolveProviderConfig(candidateProvider, null, null);

        const timedResult = await Promise.race([
          generate(candidateProvider, genParams, candidateConfig),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(Object.assign(new Error('Generation timed out'), { statusCode: 504 })),
              180_000,
            ),
          ),
        ]);

        // Validate the result URL — reject empty/malformed responses before accepting
        const hasValidUrl =
          isValidResultUrl(timedResult.resultUrl) ||
          timedResult.resultUrls?.some(u => isValidResultUrl(u));
        if (!hasValidUrl) {
          throw Object.assign(
            new Error(`Provider ${candidateProvider} returned an invalid image URL`),
            { statusCode: 502, provider: candidateProvider },
          );
        }

        result     = timedResult;
        usedProvider = candidateProvider;
        if (candidateProvider !== resolvedProvider) {
          logger.warn({ primary: resolvedProvider, fallback: candidateProvider }, '[generate] primary failed; used fallback');        }
        break;
      } catch (err) {
        lastErr = err;
        void recordProviderFailure(candidateProvider);
        const statusCode = (err as { statusCode?: number }).statusCode ?? 0;
        const errorMsg = err instanceof Error ? err.message.toLowerCase() : '';
        
        // Check for content filter errors (422 or safety-related messages)
        const isContentFilter = statusCode === 422 || errorMsg.includes('nsfw') || 
                               errorMsg.includes('safety') || errorMsg.includes('policy');
        
        // Attempt retry with sanitized prompt on content filter rejection
        if (isContentFilter && candidateProvider === resolvedProvider && genParams.prompt) {
          try {
            logger.info({ provider: candidateProvider }, '[generate] content filter detected; retrying with sanitized prompt');
            
            // Sanitize prompt by removing explicit content keywords
            const sanitizedPrompt = genParams.prompt
              .replace(/\b(nude|nsfw|explicit|gore|violence|blood|NSFW|sexually|erotic)\b/gi, '')
              .trim() + ' safe for work, family friendly';
            
            const retryConfig = candidateProvider === resolvedProvider
              ? config
              : resolveProviderConfig(candidateProvider, null, null);
            
            const retryParams = { ...genParams, prompt: sanitizedPrompt };
            
            const retryResult = await Promise.race([
              generate(candidateProvider, retryParams, retryConfig),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(Object.assign(new Error('Generation timed out'), { statusCode: 504 })),
                  180_000,
                ),
              ),
            ]);
            
            // Validate retry result URL
            const hasValidUrl =
              isValidResultUrl(retryResult.resultUrl) ||
              retryResult.resultUrls?.some(u => isValidResultUrl(u));
            if (!hasValidUrl) {
              throw Object.assign(
                new Error(`Provider ${candidateProvider} returned an invalid image URL`),
                { statusCode: 502, provider: candidateProvider },
              );
            }
            
            result = retryResult;
            usedProvider = candidateProvider;
            logger.info({ provider: candidateProvider }, '[generate] retry with sanitized prompt succeeded');
            break;
          } catch (retryErr) {
            logger.warn({ provider: candidateProvider, err: (retryErr as Error).message }, 
              '[generate] retry with sanitized prompt failed');
            // Fall through to normal error handling
            lastErr = retryErr;
          }
        }
        
        // Continue the chain only for transient failures (503, 429, 504/timeout)
        const isTransient =
          statusCode === 503 || statusCode === 429 || statusCode === 504 ||
          (err instanceof Error && /timeout|loading|unavailable|rate.?limit/i.test(err.message));
        if (!isTransient && !isContentFilter) {
          // Hard failure (auth error, bad request, etc.) — don't try fallbacks
          throw err;
        }
        logger.warn({ provider: candidateProvider, err: errorMsg },
          `[generate] ${candidateProvider} transient error (${statusCode}), trying next`
        );
      }
    }

    if (!result) {
      throw Object.assign(
        new Error(
          providerChain.length > 1
            ? 'All generation providers are temporarily busy. Please try again in a moment.'
            : ((lastErr as Error)?.message ?? 'Generation failed'),
        ),
        { statusCode: 503 },
      );
    }

    // actual provider used (may differ from resolvedProvider if fallback occurred)

    // ------------------------------------------------------------------------
    // 5a-pre. Background removal — when transparentBackground is requested,
    //         post-process the image to strip the background via RMBG-1.4.
    //         On failure: return original image with a diagnostic note (no
    //         silent failure).
    // ------------------------------------------------------------------------
    let bgRemovalNote: string | undefined;
    if (backgroundMode === 'transparent' && result.resultUrl) {
      const bgResult = await removeBackgroundWithFallback(result.resultUrl);
      result = { ...result, resultUrl: bgResult.url };
      if (!bgResult.bgRemoved) bgRemovalNote = bgResult.note;
    }

    // ------------------------------------------------------------------------
    // 5a-pre2. Image quality gate — detect blank/corrupt outputs (non-fatal)
    // ------------------------------------------------------------------------
    if (result.resultUrl && process.env.ENABLE_QUALITY_GATE !== 'false') {
      try {
        const { checkImageQuality } = await import('@/lib/image-quality');
        const qr = await checkImageQuality(result.resultUrl);
        if (!qr.ok) {
          logger.warn({ reason: qr.reason, entropy: qr.entropy }, '[generate] quality gate: blank/corrupt output detected');
          // Attach quality warning to response but still return — don't fail silently
          (result as GenerateResult & { qualityWarning?: string }).qualityWarning = qr.reason;
        }
      } catch {
        // non-fatal — quality gate failure should never block the response
      }
    }

    // ------------------------------------------------------------------------
    // 5a. Update Job as succeeded
    // ------------------------------------------------------------------------
    if (job) {
      try {
        job = await prisma.job.update({
          where: { id: job.id },
          data: {
            status:         'succeeded',
            resultUrl:      result.resultUrl ?? null,
            resultUrls:     result.resultUrls ? JSON.stringify(result.resultUrls) : null,
            providerJobId:  result.providerJobId ?? null,
            seed:           result.resolvedSeed ?? job.seed,
          },
        });
      } catch (dbErr) {
        logger.warn({ err: (dbErr as Error).message }, '[generate] Failed to update job record');
      }
    }

    // Deduct HD credit on success (hosted mode + HD generation)
    let hdCreditsRemaining: { monthly: number; topUp: number } | null = null;

    if (!isSelfHosted && authedUserId && useHD) {
      try {
        // Use monthly credits first, then top-up bank
        const user = await prisma.user.findUnique({ where: { id: authedUserId } });
        const sub  = await prisma.subscription.findUnique({
          where: { userId: authedUserId },
          include: { plan: true },
        });
        const monthlyAllocation = sub?.plan.creditsPerMonth ?? 0;
        const monthlyUsed       = user?.hdMonthlyUsed ?? 0;
        const monthlyRemaining  = Math.max(0, monthlyAllocation - monthlyUsed);

        if (monthlyRemaining > 0) {
          await prisma.user.update({
            where: { id: authedUserId },
            data: { hdMonthlyUsed: { increment: 1 } },
          });
          hdCreditsRemaining = {
            monthly: monthlyRemaining - 1,
            topUp:   user?.hdTopUpCredits ?? 0,
          };
        } else {
          // Draw from top-up bank
          const updated = await prisma.user.update({
            where: { id: authedUserId },
            data: { hdTopUpCredits: { decrement: 1 } },
          });
          hdCreditsRemaining = { monthly: 0, topUp: Math.max(0, updated.hdTopUpCredits) };
        }
      } catch (err) {
        logger.warn({ err: (err as Error).message }, '[generate] Failed to deduct HD credit');
      }

      // Send low-credits warning email when user hits 5 remaining (once per threshold)
      if (hdCreditsRemaining) {
        const totalRemaining = hdCreditsRemaining.monthly + hdCreditsRemaining.topUp;
        if (totalRemaining === 5) {
          const user = await prisma.user.findUnique({ where: { id: authedUserId }, select: { email: true } });
          if (user?.email) {
            sendLowCreditsEmail(user.email, 5).catch(() => {});
          }
        }
      }
    }

    // Update user generation stats (non-blocking)
    if (!isSelfHosted && authedUserId) {
      prisma.userPreference.upsert({
        where: { userId: authedUserId },
        create: {
          userId: authedUserId,
          stats: JSON.stringify({ totalGenerations: 1, successRate: 1.0, lastActive: new Date().toISOString() }),
        },
        update: {
          stats: JSON.stringify({ totalGenerations: 1, successRate: 1.0, lastActive: new Date().toISOString() }),
          updatedAt: new Date(),
        },
      }).catch(() => {});
    }

    // ------------------------------------------------------------------------
    // 5b. If the generation succeeded and isPublic, also create a GalleryAsset
    // ------------------------------------------------------------------------
    if (job && Boolean(isPublic) && result.resultUrl) {
      await prisma.galleryAsset.create({
        data: {
          jobId:    job.id,
          imageUrl: result.resultUrl,
          thumbUrl: result.resultUrl,
          size:     clampSize(Number(width) || 512),
          tool:     tool as Tool,
          provider: usedProvider,
          prompt:   String(prompt).trim(),
          isPublic: true,
          mode:     resolvedMode,
        },
      }).catch((err) => {
        logger.error('[generate] GalleryAsset creation failed:', err);
      });
    }

    // Record activity event if this job belongs to a project (non-blocking)
    if (job && typeof projectId === 'string' && projectId) {
      prisma.activityEvent.create({
        data: {
          projectId,
          userId:  authedUserId ?? null,
          type:    'generate',
          message: `Generated "${effectivePrompt.slice(0, 60)}" with ${resolvedMode}/${effectiveTool}`,
          refId:   job.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      ok:                  true,
      job:                 job ? serializeJob(job) : null,
      resultUrl:           result.resultUrl,
      resultUrls:          result.resultUrls,
      durationMs:          result.durationMs,
      resolvedSeed:        result.resolvedSeed,
      hdCreditsRemaining,
      quality:             useHD ? 'hd' : 'standard',
      guestDownloadGated:  authedUserId === null,
      bgRemovalNote,
      // Quota info for frontend display (undefined for HD/paid tiers)
      quotaRemaining: !useHD
        ? (req as NextRequest & { _quotaRemaining?: number })._quotaRemaining
        : undefined,
    }, {
      headers: {
        'X-WokGen-Request-Id': requestId,
        'X-WokGen-Provider':   usedProvider,
      },
    });
  } catch (err) {
    // ------------------------------------------------------------------------
    // 5c. Update Job as failed
    // ------------------------------------------------------------------------
    const serialized = serializeError(err);

    if (job) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error:  serialized.error,
        },
      }).catch((e) => logger.error(e, '[generate] gallery asset creation failed')); // best-effort — don't mask the original error
    }

    logger.error({ jobId: job?.id ?? '(no-db)', err }, '[generate] job failed');

    const statusCode = serialized.statusCode ?? 500;
    const hint = getErrorHint(err);

    return NextResponse.json(
      {
        ok:    false,
        jobId: job?.id ?? null,
        hint,
        code:  'PROVIDER_ERROR',
        ...serialized,
      },
      { status: statusCode >= 400 ? statusCode : 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/generate — list recent jobs (lightweight history endpoint)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit     = Math.min(Number(searchParams.get('limit')  ?? 20), 100);
  const cursor    = searchParams.get('cursor')    ?? undefined;
  const tool      = searchParams.get('tool')      ?? undefined;
  const status    = searchParams.get('status')    ?? undefined;
  const mode      = searchParams.get('mode')      ?? undefined;
  const projectId = searchParams.get('projectId') ?? undefined;

  // Optional: require auth for ?mine=true or ?projectId=
  let userId: string | undefined;
  const mine = searchParams.get('mine') === 'true';
  if ((mine || projectId) && !process.env.SELF_HOSTED) {
    try {
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      if (session?.user?.id) userId = session.user.id;
    } catch { /* ignore */ }
  }

  const where: Record<string, unknown> = {};
  if (tool   && isValidTool(tool))     where.tool   = tool;
  if (status)                          where.status = status;
  if (mode)                            where.mode   = mode;
  if (userId)                          where.userId = userId;

  // projectId filter — verify ownership before applying
  if (projectId && userId) {
    try {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project && project.userId === userId) {
        where.projectId = projectId;
      }
      // If project doesn't belong to user, silently ignore filter (returns all their jobs)
    } catch { /* ignore */ }
  }

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id:           true,
      tool:         true,
      status:       true,
      provider:     true,
      prompt:       true,
      width:        true,
      height:       true,
      seed:         true,
      resultUrl:    true,
      resultUrls:   true,
      isPublic:     true,
      createdAt:    true,
      updatedAt:    true,
    },
  });

  const hasMore  = jobs.length > limit;
  const trimmed  = hasMore ? jobs.slice(0, limit) : jobs;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

  return NextResponse.json({
    jobs:       trimmed.map(j => ({ ...j, imageUrl: j.resultUrl })),
    nextCursor,
    hasMore,
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function detectProvider(): ProviderName {
  if (process.env.REPLICATE_API_TOKEN) return 'replicate';
  if (process.env.FAL_KEY)             return 'fal';
  if (process.env.TOGETHER_API_KEY)    return 'together';
  return 'comfyui';
}

function getErrorHint(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  if (msg.includes('timed out')) return 'The generation took too long. Try a simpler prompt or a different provider.';
  if (msg.includes('rate limit') || msg.includes('429')) return 'Rate limit hit. Try again in a moment or switch providers.';
  if (msg.includes('nsfw') || msg.includes('safety')) return 'Your prompt triggered a safety filter. Try rephrasing it.';
  if (msg.includes('unauthorized') || msg.includes('401')) return 'API key invalid or expired. Check your provider settings.';
  return 'Generation failed. Try again or switch providers.';
}

/**
 * Verify a generation result URL is well-formed.
 * Accepts data: URIs (base64 image blobs) and http/https remote URLs.
 */
function isValidResultUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/') || url.startsWith('data:audio/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const VALID_TOOLS    = new Set(['generate', 'animate', 'rotate', 'inpaint', 'scene']);
const VALID_PROVIDERS = new Set(['replicate', 'fal', 'together', 'comfyui', 'pollinations', 'huggingface']);
const VALID_PRESETS  = new Set([
  'rpg_icon', 'emoji', 'tileset', 'sprite_sheet', 'raw', 'game_ui',
  'character_idle', 'character_side', 'top_down_char', 'isometric', 'chibi',
  'horror', 'sci_fi', 'nature_tile', 'animated_effect', 'portrait', 'badge_icon', 'weapon_icon',
]);

function isValidTool(v: unknown): v is Tool {
  return typeof v === 'string' && VALID_TOOLS.has(v);
}

function isValidProvider(v: unknown): v is ProviderName {
  return typeof v === 'string' && VALID_PROVIDERS.has(v);
}

function isValidStylePreset(v: unknown): v is import('@/lib/providers').StylePreset {
  return typeof v === 'string' && VALID_PRESETS.has(v);
}

/** Clamp a pixel size between 32 and 2048 */
function clampSize(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 512;
  return Math.max(32, Math.min(2048, n));
}

/** Strip sensitive fields before returning job data to client */
function serializeJob(job: {
  id: string;
  tool: string;
  status: string;
  provider: string;
  prompt: string;
  negPrompt: string | null;
  width: number;
  height: number;
  seed: number | null;
  resultUrl: string | null;
  resultUrls: string | null;
  error: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:         job.id,
    tool:       job.tool,
    status:     job.status,
    provider:   job.provider,
    prompt:     job.prompt,
    width:      job.width,
    height:     job.height,
    seed:       job.seed,
    resultUrl:  job.resultUrl,
    resultUrls: job.resultUrls ? JSON.parse(job.resultUrls) : null,
    isPublic:   job.isPublic,
    createdAt:  job.createdAt.toISOString(),
    updatedAt:  job.updatedAt.toISOString(),
  };
}
