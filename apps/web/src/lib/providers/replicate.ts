import type { GenerateParams, GenerateResult, ProviderError } from './types';
import { buildPrompt, buildNegativePrompt } from '../prompt-builder';

// ---------------------------------------------------------------------------
// Models available on Replicate
// ---------------------------------------------------------------------------
export const REPLICATE_MODELS = {
  /** Stability SDXL — reliable, great for pixel art with LoRA prompting */
  sdxl: 'stability-ai/sdxl',

  /** FLUX.1-schnell — fast, high quality, 4-step generation */
  flux_schnell: 'black-forest-labs/flux-schnell',

  /** FLUX.1-dev — higher quality, slower */
  flux_dev: 'black-forest-labs/flux-dev',

  /** Zeroscope v2 XL — used for animation frames */
  animate: 'anotherjesse/zeroscope-v2-xl',

  /** Controlnet tile — used for inpainting / upscaling pixel art */
  controlnet_tile: 'andreasjansson/stable-diffusion-inpainting',

  /** Recraft V3 SVG — high-quality vector/SVG generation */
  recraft_v3_svg: 'recraft-ai/recraft-v3-svg',
} as const;

export type ReplicateModelKey = keyof typeof REPLICATE_MODELS;

// ---------------------------------------------------------------------------
// Replicate REST types (minimal surface)
// ---------------------------------------------------------------------------
interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string[] | null;
  error: string | null;
  urls: {
    get: string;
    cancel: string;
  };
  metrics?: {
    predict_time?: number;
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Run a pixel-art generation request via the Replicate API.
 * Polls until the prediction is complete and returns the image URL(s).
 *
 * @param params  - unified generation params from the WokGen API layer
 * @param apiKey  - Replicate API token (from env or BYOK header)
 */
export async function replicateGenerate(
  params: GenerateParams,
  apiKey: string,
): Promise<GenerateResult> {
  const model = resolveModel(params);
  const input = buildInput(params, model);

  // Step 1: create prediction
  const prediction = await createPrediction(model, input, apiKey);

  // Step 2: poll to completion
  const completed = await pollPrediction(prediction.urls.get, apiKey);

  if (completed.status === 'failed') {
    const err: ProviderError = new Error(
      completed.error ?? 'Replicate prediction failed',
    );
    err.provider = 'replicate';
    err.jobId = prediction.id;
    throw err;
  }

  const output = completed.output ?? [];

  return {
    provider: 'replicate',
    providerJobId: prediction.id,
    resultUrl: output[0] ?? null,
    resultUrls: output.length > 1 ? output : undefined,
    durationMs: Math.round((completed.metrics?.predict_time ?? 0) * 1000),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveModel(params: GenerateParams): string {
  // Allow caller to override; otherwise pick by tool
  if (params.modelOverride) return params.modelOverride;

  // Vector HD → use Recraft V3 SVG for high-quality SVG output
  if (params.mode === 'vector' && params.useHD) {
    return REPLICATE_MODELS.recraft_v3_svg;
  }

  switch (params.tool) {
    case 'animate':
      return REPLICATE_MODELS.animate;
    default:
      // For generate / rotate / scene — prefer FLUX schnell (fast + sharp)
      return REPLICATE_MODELS.flux_schnell;
  }
}

function buildInput(
  params: GenerateParams,
  model: string,
): Record<string, unknown> {
  const isFlux = model.includes('flux');
  const isSdxl = model.includes('sdxl');
  const isAnimate = model.includes('zeroscope') || model.includes('animate');
  const isRecraft = model.includes('recraft');

  const fullPrompt = buildPrompt({
    tool: params.tool,
    userPrompt: params.prompt,
    stylePreset: params.stylePreset,
    assetCategory: params.assetCategory,
    pixelEra: params.pixelEra,
    backgroundMode: params.backgroundMode,
    outlineStyle: params.outlineStyle,
    paletteSize: params.paletteSize,
    width: params.width,
    height: params.height,
  });

  const negativePrompt = buildNegativePrompt({
    assetCategory: params.assetCategory,
    pixelEra: params.pixelEra,
    userNegPrompt: params.negPrompt,
  });

  const seed =
    params.seed != null && params.seed > 0
      ? params.seed
      : Math.floor(Math.random() * 2 ** 32);

  if (isRecraft) {
    // Map stylePreset to recraft style param
    const recraftStyleMap: Record<string, string> = {
      outline: 'vector_illustration',
      filled:  'vector_illustration',
      rounded: 'icon',
      sharp:   'icon',
    };
    const style =
      (params.stylePreset && recraftStyleMap[params.stylePreset]) ??
      'vector_illustration';
    return {
      prompt: fullPrompt,
      style,
      size: params.width ?? 1024,
    };
  }

  if (isFlux) {
    return {
      prompt: fullPrompt,
      num_inference_steps: params.steps ?? 4,
      guidance_scale: params.guidance ?? 3.5,
      width: params.width ?? 512,
      height: params.height ?? 512,
      seed,
      output_format: 'png',
      output_quality: 100,
    };
  }

  if (isSdxl) {
    return {
      prompt: fullPrompt,
      negative_prompt: negativePrompt,
      width: snapToSdxlSize(params.width ?? 512),
      height: snapToSdxlSize(params.height ?? 512),
      num_inference_steps: params.steps ?? 20,
      guidance_scale: params.guidance ?? 7.5,
      scheduler: 'DPMSolverMultistep',
      seed,
    };
  }

  if (isAnimate) {
    return {
      prompt: fullPrompt,
      negative_prompt: negativePrompt,
      num_inference_steps: params.steps ?? 25,
      guidance_scale: params.guidance ?? 7.5,
      seed,
    };
  }

  // Generic fallback
  return {
    prompt: fullPrompt,
    negative_prompt: negativePrompt,
    width: params.width ?? 512,
    height: params.height ?? 512,
    seed,
  };
}

/** SDXL requires multiples of 64px, min 512 */
function snapToSdxlSize(n: number): number {
  const rounded = Math.round(n / 64) * 64;
  return Math.max(512, Math.min(1024, rounded));
}

async function createPrediction(
  model: string,
  input: Record<string, unknown>,
  apiKey: string,
): Promise<ReplicatePrediction> {
  // FLUX models use the /models/:owner/:name/predictions endpoint
  const isVersioned = model.includes(':');
  const url = isVersioned
    ? 'https://api.replicate.com/v1/predictions'
    : `https://api.replicate.com/v1/models/${model}/predictions`;

  const body: Record<string, unknown> = { input };
  if (isVersioned) {
    const [, version] = model.split(':');
    body.version = version;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=5', // short-circuit if finishes fast
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err: ProviderError = new Error(
      `Replicate API ${res.status}: ${text}`,
    );
    err.provider = 'replicate';
    err.statusCode = res.status;
    throw err;
  }

  return res.json() as Promise<ReplicatePrediction>;
}

async function pollPrediction(
  getUrl: string,
  apiKey: string,
  timeoutMs = 300_000,
): Promise<ReplicatePrediction> {
  const deadline = Date.now() + timeoutMs;
  let backoff = 1500; // ms between polls — start at 1.5s

  while (Date.now() < deadline) {
    const res = await fetch(getUrl, {
      // ask Replicate to hold the connection up to 60s if still processing
      headers: { Authorization: `Bearer ${apiKey}`, Prefer: 'wait=60' } as HeadersInit,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      const err: ProviderError = new Error(
        `Replicate poll ${res.status}: ${text}`,
      );
      err.provider = 'replicate';
      err.statusCode = res.status;
      throw err;
    }

    const prediction: ReplicatePrediction = await res.json();

    if (
      prediction.status === 'succeeded' ||
      prediction.status === 'failed' ||
      prediction.status === 'canceled'
    ) {
      return prediction;
    }

    // Still running — wait with backoff (cap at 8s)
    await sleep(backoff);
    backoff = Math.min(backoff * 1.3, 8_000);
  }

  const err: ProviderError = new Error(
    `Replicate prediction timed out after ${timeoutMs / 1000}s`,
  );
  err.provider = 'replicate';
  throw err;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
