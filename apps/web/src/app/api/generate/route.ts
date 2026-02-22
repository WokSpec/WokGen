import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generate,
  resolveProviderConfig,
  assertKeyPresent,
  serializeError,
} from '@/lib/providers';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendLowCreditsEmail } from '@/lib/email';
import { isSupportedMode, getMode } from '@/lib/modes';
import type { ProviderName, Tool, GenerateParams } from '@/lib/providers';
import {
  buildBusinessPrompt,
  type BusinessTool,
  type BusinessStyle,
  type BusinessMood,
  type BusinessPlatform,
} from '@/lib/prompt-builder-business';

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

export async function POST(req: NextRequest) {
  const isSelfHosted = process.env.SELF_HOSTED === 'true';

  // --------------------------------------------------------------------------
  // 0. Auth + HD credit check (hosted mode only)
  // --------------------------------------------------------------------------
  let authedUserId: string | null = null;
  let useHD = false; // whether to use Replicate (HD) vs Pollinations (standard)

  if (!isSelfHosted) {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    authedUserId = session?.user?.id ?? null;

    // Determine rate-limit key: userId for authed, IP for guest
    const rateLimitKey = authedUserId
      ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';

    // Guests: 10 req/min; authed users: 30 req/min
    // (increased to handle brand-kit which fires 4 parallel requests)
    const maxReqs = authedUserId ? 30 : 10;
    const rl = await checkRateLimit(rateLimitKey, maxReqs);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    // Parse quality preference from body (peek ahead)
    let rawBody: Record<string, unknown> = {};
    try {
      rawBody = await req.json();
      // Re-attach parsed body so we don't need to parse again below
      (req as NextRequest & { _parsedBody?: Record<string, unknown> })._parsedBody = rawBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const requestedHD = rawBody.quality === 'hd';

    if (requestedHD) {
      // Guests cannot use HD
      if (!authedUserId) {
        return NextResponse.json(
          { error: 'Sign in to use HD generation.' },
          { status: 401 },
        );
      }

      // Check HD credits: monthly allocation first, then top-up bank
      const user = await prisma.user.findUnique({
        where: { id: authedUserId },
        include: { subscription: { include: { plan: true } } },
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
          { status: 429 },
        );
      }
    }
    // Standard (Pollinations) is always free for everyone — no check needed
  }



  // --------------------------------------------------------------------------
  // 1. Parse & validate request body
  // --------------------------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    // In hosted mode body was already parsed above; in self-hosted parse now
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
    mode       = 'pixel',        // product line: pixel | business | vector | emoji | uiux
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
    // BYOK fields — only used in self-hosted mode; stripped in hosted mode
    apiKey: byokKey,
    comfyuiHost: byokHost,
    modelOverride,
    extra,
  } = body;

  // Resolve and validate mode
  const resolvedMode = isSupportedMode(mode) ? mode : 'pixel';
  const modeContract = getMode(resolvedMode);

  // In hosted mode: ignore any client-supplied provider keys
  const resolvedByokKey  = isSelfHosted ? (typeof byokKey  === 'string' ? byokKey  : null) : null;
  const resolvedByokHost = isSelfHosted ? (typeof byokHost === 'string' ? byokHost : null) : null;
  // In hosted mode: use mode-specific HD model; standard falls back through chain.
  const resolvedProvider: ProviderName = isSelfHosted
    ? (provider as ProviderName)
    : useHD ? (modeContract.models.hdProvider as ProviderName)
    : process.env.TOGETHER_API_KEY ? 'together'
    : process.env.FAL_KEY ? 'fal'
    : process.env.HF_TOKEN ? 'huggingface'
    : 'pollinations';

  // Override model for HD if mode specifies a specific model
  const effectiveModelOverride = useHD && modeContract.models.hdModelId && !modelOverride
    ? modeContract.models.hdModelId
    : (typeof modelOverride === 'string' ? modelOverride : undefined);

  // Guard: HD requires REPLICATE_API_TOKEN on server
  if (useHD && !process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'HD generation is temporarily unavailable. Please try standard quality.' },
      { status: 503 },
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
    const built = buildBusinessPrompt({
      tool:           bizTool,
      concept:        effectivePrompt || 'professional brand visual',
      industry:       typeof body.industry      === 'string' ? body.industry      || undefined : undefined,
      style:          bizStyle,
      mood:           bizMood,
      platform:       bizPlatform,
      colorDirection: typeof body.colorDirection === 'string' ? body.colorDirection || undefined : undefined,
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

  // Validate required fields
  if (effectivePrompt.length === 0) {
    return NextResponse.json(
      { error: 'prompt is required and must be a non-empty string' },
      { status: 400 },
    );
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
      console.warn('[generate] DB unavailable, running without job tracking:', (dbErr as Error).message);
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
    steps:          typeof steps === 'number' ? steps : undefined,
    guidance:       typeof guidance === 'number' ? guidance : undefined,
    stylePreset:    isValidStylePreset(stylePreset) ? stylePreset : undefined,
    assetCategory:  typeof assetCategory === 'string' ? assetCategory as GenerateParams['assetCategory'] : undefined,
    pixelEra:       typeof pixelEra === 'string' ? pixelEra as GenerateParams['pixelEra'] : undefined,
    backgroundMode: typeof backgroundMode === 'string' ? backgroundMode as GenerateParams['backgroundMode'] : undefined,
    outlineStyle:   typeof outlineStyle === 'string' ? outlineStyle as GenerateParams['outlineStyle'] : undefined,
    paletteSize:    typeof paletteSize === 'number' ? paletteSize as GenerateParams['paletteSize'] : undefined,
    modelOverride:  effectiveModelOverride,
    extra:          extra as Record<string, unknown> | undefined,
  };

  try {
    let actualProvider: ProviderName = resolvedProvider;
    const result = await generate(resolvedProvider, genParams, config).catch(async (err: unknown) => {
      if (!isSelfHosted) {
        // Pollinations down → try HuggingFace (if key set) or Replicate as last resort
        if (resolvedProvider === 'pollinations') {
          if (process.env.HF_TOKEN) {
            console.warn('[generate] Pollinations failed, falling back to HuggingFace:', (err as Error).message);
            actualProvider = 'huggingface';
            return generate('huggingface', genParams, resolveProviderConfig('huggingface', null, null));
          }
          if (process.env.REPLICATE_API_TOKEN) {
            console.warn('[generate] Pollinations failed, falling back to Replicate:', (err as Error).message);
            actualProvider = 'replicate';
            return generate('replicate', genParams, resolveProviderConfig('replicate', null, null));
          }
          // All fallbacks exhausted — return actionable error
          throw Object.assign(
            new Error(
              'Generation unavailable: Pollinations is temporarily down and no backup provider is configured. ' +
              'To fix this, set HF_TOKEN (free at huggingface.co/settings/tokens) or TOGETHER_API_KEY (free at api.together.ai) in your environment variables.'
            ),
            { statusCode: 503 }
          );
        }
        // HuggingFace failed → fall back to Pollinations (always available)
        if (resolvedProvider === 'huggingface') {
          console.warn('[generate] HuggingFace failed, falling back to Pollinations:', (err as Error).message);
          actualProvider = 'pollinations';
          return generate('pollinations', genParams, resolveProviderConfig('pollinations', null, null));
        }
      }
      throw err;
    });

    // actual provider used (may differ from resolvedProvider if fallback occurred)
    const usedProvider: ProviderName = actualProvider;

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
        console.warn('[generate] Failed to update job record:', (dbErr as Error).message);
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
        console.warn('[generate] Failed to deduct HD credit:', (err as Error).message);
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
        console.error('[generate] GalleryAsset creation failed:', err);
      });
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
      }).catch(console.error); // best-effort — don't mask the original error
    }

    console.error(`[generate] Job ${job?.id ?? '(no-db)'} failed:`, err);

    const statusCode = serialized.statusCode ?? 500;

    return NextResponse.json(
      {
        ok:    false,
        jobId: job?.id ?? null,
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
  const limit  = Math.min(Number(searchParams.get('limit')  ?? 20), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const tool   = searchParams.get('tool')   ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const mode   = searchParams.get('mode')   ?? undefined;

  // Optional: require auth for ?mine=true
  let userId: string | undefined;
  const mine = searchParams.get('mine') === 'true';
  if (mine && !process.env.SELF_HOSTED) {
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
