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
import type { ProviderName, Tool, GenerateParams } from '@/lib/providers';

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

    // Guests: 5 req/min; authed users: 20 req/min
    const maxReqs = authedUserId ? 20 : 5;
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
    prompt,
    negPrompt,
    width      = 512,
    height     = 512,
    seed,
    steps,
    guidance,
    stylePreset,
    isPublic   = false,
    // BYOK fields — only used in self-hosted mode; stripped in hosted mode
    apiKey: byokKey,
    comfyuiHost: byokHost,
    modelOverride,
    extra,
  } = body;

  // In hosted mode: ignore any client-supplied provider keys
  const resolvedByokKey  = isSelfHosted ? (typeof byokKey  === 'string' ? byokKey  : null) : null;
  const resolvedByokHost = isSelfHosted ? (typeof byokHost === 'string' ? byokHost : null) : null;
  // In hosted mode: use Replicate for HD requests, Pollinations for standard
  const resolvedProvider: ProviderName = isSelfHosted
    ? (provider as ProviderName)
    : useHD ? 'replicate' : 'pollinations';

  // Guard: HD requires REPLICATE_API_TOKEN on server
  if (useHD && !process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'HD generation is temporarily unavailable. Please try standard quality.' },
      { status: 503 },
    );
  }

  // Validate required fields
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: 'prompt is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  if (!isValidTool(tool)) {
    return NextResponse.json(
      {
        error: `Invalid tool "${tool}". Must be one of: generate, animate, rotate, inpaint, scene`,
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
          tool:       tool as Tool,
          status:     'running',
          provider:   resolvedProvider,
          prompt:     String(prompt).trim(),
          negPrompt:  typeof negPrompt === 'string' ? negPrompt.trim() || null : null,
          width:      clampSize(Number(width) || 512),
          height:     clampSize(Number(height) || 512),
          seed:       typeof seed === 'number' && seed > 0 ? seed : null,
          isPublic:   Boolean(isPublic),
          params:     extra ? JSON.stringify(extra) : null,
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
    tool:          tool as Tool,
    prompt:        String(prompt).trim(),
    negPrompt:     typeof negPrompt === 'string' ? negPrompt.trim() || undefined : undefined,
    width:         clampSize(Number(width) || 512),
    height:        clampSize(Number(height) || 512),
    seed:          typeof seed === 'number' && seed > 0 ? seed : undefined,
    steps:         typeof steps === 'number' ? steps : undefined,
    guidance:      typeof guidance === 'number' ? guidance : undefined,
    stylePreset:   isValidStylePreset(stylePreset) ? stylePreset : undefined,
    modelOverride: typeof modelOverride === 'string' ? modelOverride : undefined,
    extra:         extra as Record<string, unknown> | undefined,
  };

  try {
    const result = await generate(resolvedProvider, genParams, config);

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
          provider: resolvedProvider,
          prompt:   String(prompt).trim(),
          isPublic: true,
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

  const where: Record<string, unknown> = {};
  if (tool   && isValidTool(tool))     where.tool   = tool;
  if (status)                          where.status = status;

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
    jobs:       trimmed,
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
const VALID_PROVIDERS = new Set(['replicate', 'fal', 'together', 'comfyui', 'pollinations']);
const VALID_PRESETS  = new Set(['rpg_icon', 'emoji', 'tileset', 'sprite_sheet', 'raw', 'game_ui']);

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
