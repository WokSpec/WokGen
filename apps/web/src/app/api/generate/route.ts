import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generate,
  resolveProviderConfig,
  assertKeyPresent,
  serializeError,
} from '@/lib/providers';
import type { ProviderName, Tool, GenerateParams } from '@/lib/providers';

// ---------------------------------------------------------------------------
// POST /api/generate
//
// Request body (JSON):
// {
//   tool:        Tool            (default: "generate")
//   provider:    ProviderName    (default: detected from env)
//   prompt:      string          (required)
//   negPrompt?:  string
//   width?:      number          (default: 512)
//   height?:     number          (default: 512)
//   seed?:       number
//   steps?:      number
//   guidance?:   number
//   stylePreset? StylePreset
//   isPublic?:   boolean         (default: false)
//   apiKey?:     string          (BYOK — stored only in this request, never persisted)
//   comfyuiHost? string          (BYOK ComfyUI host override)
//   modelOverride? string
//   extra?:      Record<string, unknown>
// }
//
// Runs the full generation synchronously and returns the completed job.
// Works correctly on self-hosted Next.js (no serverless cold-start limits).
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
// Allow up to 10 minutes for slow local ComfyUI or high-demand cloud providers
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  // --------------------------------------------------------------------------
  // 1. Parse & validate request body
  // --------------------------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    body = await req.json();
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
    apiKey: byokKey,
    comfyuiHost: byokHost,
    modelOverride,
    extra,
  } = body;

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

  if (!isValidProvider(provider)) {
    return NextResponse.json(
      {
        error: `Invalid provider "${provider}". Must be one of: replicate, fal, together, comfyui`,
      },
      { status: 400 },
    );
  }

  // --------------------------------------------------------------------------
  // 2. Resolve provider config (env vars merged with BYOK overrides)
  // --------------------------------------------------------------------------
  const config = resolveProviderConfig(
    provider as ProviderName,
    typeof byokKey === 'string' ? byokKey : null,
    typeof byokHost === 'string' ? byokHost : null,
  );

  try {
    assertKeyPresent(provider as ProviderName, config);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 },
    );
  }

  // --------------------------------------------------------------------------
  // 3. Create the Job record in the database (status = "running")
  // --------------------------------------------------------------------------
  let job = await prisma.job.create({
    data: {
      tool:       tool as Tool,
      status:     'running',
      provider:   provider as ProviderName,
      prompt:     String(prompt).trim(),
      negPrompt:  typeof negPrompt === 'string' ? negPrompt.trim() || null : null,
      width:      clampSize(Number(width) || 512),
      height:     clampSize(Number(height) || 512),
      seed:       typeof seed === 'number' && seed > 0 ? seed : null,
      isPublic:   Boolean(isPublic),
      params:     extra ? JSON.stringify(extra) : null,
    },
  });

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
    const result = await generate(provider as ProviderName, genParams, config);

    // ------------------------------------------------------------------------
    // 5a. Update Job as succeeded
    // ------------------------------------------------------------------------
    job = await prisma.job.update({
      where: { id: job.id },
      data: {
        status:         'succeeded',
        resultUrl:      result.resultUrl ?? null,
        resultUrls:     result.resultUrls ? JSON.stringify(result.resultUrls) : null,
        providerJobId:  result.providerJobId ?? null,
        // Persist the resolved seed back for reproducibility
        seed:           result.resolvedSeed ?? job.seed,
      },
    });

    // ------------------------------------------------------------------------
    // 5b. If the generation succeeded and isPublic, also create a GalleryAsset
    // ------------------------------------------------------------------------
    if (Boolean(isPublic) && result.resultUrl) {
      await prisma.galleryAsset.create({
        data: {
          jobId:    job.id,
          imageUrl: result.resultUrl,
          thumbUrl: result.resultUrl,
          size:     clampSize(Number(width) || 512),
          tool:     tool as Tool,
          provider: provider as ProviderName,
          prompt:   String(prompt).trim(),
          isPublic: true,
        },
      }).catch((err) => {
        // Non-fatal: gallery creation failure should not surface as a generate error
        console.error('[generate] GalleryAsset creation failed:', err);
      });
    }

    return NextResponse.json({
      ok:             true,
      job:            serializeJob(job),
      resultUrl:      result.resultUrl,
      resultUrls:     result.resultUrls,
      durationMs:     result.durationMs,
      resolvedSeed:   result.resolvedSeed,
    });
  } catch (err) {
    // ------------------------------------------------------------------------
    // 5c. Update Job as failed
    // ------------------------------------------------------------------------
    const serialized = serializeError(err);

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error:  serialized.error,
      },
    }).catch(console.error); // best-effort — don't mask the original error

    console.error(`[generate] Job ${job.id} failed:`, err);

    const statusCode = serialized.statusCode ?? 500;

    return NextResponse.json(
      {
        ok:    false,
        jobId: job.id,
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
const VALID_PROVIDERS = new Set(['replicate', 'fal', 'together', 'comfyui']);
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
