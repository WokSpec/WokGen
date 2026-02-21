import type { GenerateParams, GenerateResult, ProviderError } from './types';
import { STYLE_PRESET_TOKENS } from './types';

// ---------------------------------------------------------------------------
// fal.ai models
// ---------------------------------------------------------------------------
export const FAL_MODELS = {
  /** FLUX.1-schnell — fast 4-step generation, sharp results */
  flux_schnell: 'fal-ai/flux/schnell',

  /** FLUX.1-dev — higher quality, 28-step */
  flux_dev: 'fal-ai/flux/dev',

  /** FLUX.1-pro — highest quality */
  flux_pro: 'fal-ai/flux-pro',

  /** Fast SDXL — good for pixel art with negative prompts */
  fast_sdxl: 'fal-ai/fast-sdxl',

  /** FLUX LoRA — supports custom LoRA weights */
  flux_lora: 'fal-ai/flux-lora',
} as const;

export type FalModelKey = keyof typeof FAL_MODELS;

// ---------------------------------------------------------------------------
// fal.ai REST response shapes (minimal)
// ---------------------------------------------------------------------------
interface FalQueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  request_id: string;
  queue_position?: number;
  response_url?: string;
  logs?: Array<{ message: string; timestamp: string }>;
}

interface FalResult {
  images?: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  image?: {
    url: string;
    width: number;
    height: number;
  };
  timings?: {
    inference?: number;
  };
  seed?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Run pixel-art generation via the fal.ai inference API.
 *
 * Uses the queue-based endpoint for reliability:
 *   POST /v1/queue/submit → returns request_id
 *   GET  /v1/queue/status/{request_id} → poll until COMPLETED
 *   GET  /v1/queue/result/{request_id} → fetch final output
 *
 * @param params  - unified generation params
 * @param apiKey  - fal.ai API key (from env FAL_KEY or BYOK header)
 */
export async function falGenerate(
  params: GenerateParams,
  apiKey: string,
): Promise<GenerateResult> {
  const model = resolveModel(params);
  const input = buildInput(params, model);

  const startMs = Date.now();

  // Step 1: submit to queue
  const { request_id } = await submitToQueue(model, input, apiKey);

  // Step 2: poll queue status
  await pollQueue(model, request_id, apiKey);

  // Step 3: fetch result
  const result = await fetchResult(model, request_id, apiKey);

  if (result.error) {
    const err = new Error(`fal.ai generation failed: ${result.error}`) as ProviderError;
    err.provider = 'fal';
    err.providerJobId = request_id;
    throw err;
  }

  const images = result.images ?? (result.image ? [result.image] : []);
  const urls = images.map((img) => img.url).filter(Boolean);

  return {
    provider: 'fal',
    providerJobId: request_id,
    resultUrl: urls[0] ?? null,
    resultUrls: urls.length > 1 ? urls : undefined,
    durationMs: Date.now() - startMs,
    resolvedSeed: result.seed,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveModel(params: GenerateParams): string {
  if (params.modelOverride) return params.modelOverride;

  switch (params.tool) {
    case 'generate':
    case 'rotate':
    case 'scene':
      return FAL_MODELS.flux_schnell;
    default:
      return FAL_MODELS.flux_schnell;
  }
}

function buildInput(
  params: GenerateParams,
  model: string,
): Record<string, unknown> {
  const pixelPrefix =
    'pixel art icon, game asset, crisp hard edges, limited color palette, ' +
    'no anti-aliasing, transparent or solid dark background, single centered object';

  const styleTokens = params.stylePreset
    ? STYLE_PRESET_TOKENS[params.stylePreset]
    : '';

  const fullPrompt = [pixelPrefix, params.prompt, styleTokens]
    .filter(Boolean)
    .join(', ');

  const seed =
    params.seed != null && params.seed > 0
      ? params.seed
      : Math.floor(Math.random() * 2 ** 32);

  const isFluxSchnell = model.includes('schnell');
  const isSdxl = model.includes('sdxl');

  const base: Record<string, unknown> = {
    prompt: fullPrompt,
    image_size: resolveImageSize(params.width ?? 512, params.height ?? 512),
    seed,
    sync_mode: false,
    enable_safety_checker: false,
  };

  if (!isFluxSchnell) {
    // Flux dev / pro / LoRA support more steps and guidance
    base.num_inference_steps = params.steps ?? 28;
    base.guidance_scale = params.guidance ?? 3.5;
  } else {
    base.num_inference_steps = params.steps ?? 4;
  }

  if (isSdxl) {
    base.negative_prompt = buildNegativePrompt(params.negPrompt);
    base.guidance_scale = params.guidance ?? 7.5;
    base.num_inference_steps = params.steps ?? 25;
    base.scheduler = 'DPM++ 2M';
  }

  // For LoRA model, allow passing weights via extra
  if (model.includes('lora') && params.extra?.loras) {
    base.loras = params.extra.loras;
  }

  // Pass any extra caller-supplied params (merged last so they can override)
  if (params.extra) {
    const { loras: _l, ...rest } = params.extra as Record<string, unknown> & { loras?: unknown };
    Object.assign(base, rest);
  }

  return base;
}

/**
 * fal.ai image_size field accepts either a preset string or { width, height }.
 * Map common pixel sizes to fal presets where possible.
 */
function resolveImageSize(
  width: number,
  height: number,
): string | { width: number; height: number } {
  if (width === height) {
    if (width <= 512) return 'square_hd';  // fal renders at 1024 internally
    if (width <= 768) return 'square_hd';
    return 'square_hd';
  }
  if (width > height) return 'landscape_16_9';
  return 'portrait_16_9';
}

function buildNegativePrompt(extra?: string): string {
  const base = [
    'blurry, photo, photorealistic, 3d render, smooth shading, gradient, noisy',
    'anti-aliased, soft edges, watermark, text, signature, logo',
    'multiple objects, busy background, out of frame',
  ];
  if (extra) base.push(extra);
  return base.join(', ');
}

async function submitToQueue(
  model: string,
  input: Record<string, unknown>,
  apiKey: string,
): Promise<{ request_id: string }> {
  const url = `https://queue.fal.run/${model}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = new Error(`fal.ai submit ${res.status}: ${text}`) as ProviderError;
    err.provider = 'fal';
    err.statusCode = res.status;
    throw err;
  }

  return res.json() as Promise<{ request_id: string }>;
}

async function pollQueue(
  model: string,
  requestId: string,
  apiKey: string,
  timeoutMs = 300_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let backoff = 1_500;

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://queue.fal.run/${model}/requests/${requestId}/status`,
      {
        headers: { Authorization: `Key ${apiKey}` },
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      const err = new Error(`fal.ai poll ${res.status}: ${text}`) as ProviderError;
      err.provider = 'fal';
      err.statusCode = res.status;
      err.providerJobId = requestId;
      throw err;
    }

    const status: FalQueueStatus = await res.json();

    if (status.status === 'COMPLETED') return;

    if (status.status === 'FAILED') {
      const err = new Error(`fal.ai job ${requestId} failed`) as ProviderError;
      err.provider = 'fal';
      err.providerJobId = requestId;
      throw err;
    }

    // Log queue position for debugging
    if (status.queue_position != null && status.queue_position > 0) {
      console.debug(`[fal] queue position: ${status.queue_position}`);
    }

    await sleep(backoff);
    backoff = Math.min(backoff * 1.35, 8_000);
  }

  const err = new Error(
    `fal.ai job ${requestId} timed out after ${timeoutMs / 1000}s`,
  ) as ProviderError;
  err.provider = 'fal';
  err.providerJobId = requestId;
  throw err;
}

async function fetchResult(
  model: string,
  requestId: string,
  apiKey: string,
): Promise<FalResult> {
  const res = await fetch(
    `https://queue.fal.run/${model}/requests/${requestId}`,
    {
      headers: { Authorization: `Key ${apiKey}` },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = new Error(
      `fal.ai result fetch ${res.status}: ${text}`,
    ) as ProviderError;
    err.provider = 'fal';
    err.statusCode = res.status;
    err.providerJobId = requestId;
    throw err;
  }

  return res.json() as Promise<FalResult>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
