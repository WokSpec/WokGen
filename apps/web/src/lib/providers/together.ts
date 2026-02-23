import type { GenerateParams, GenerateResult, ProviderError } from './types';
import { buildPrompt, buildNegativePrompt } from '../prompt-builder';

// ---------------------------------------------------------------------------
// Together.ai provider
// FLUX.1-schnell-Free is available at zero cost — no billing required.
// ---------------------------------------------------------------------------

const TOGETHER_API_BASE = 'https://api.together.xyz/v1';
const TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const TOGETHER_MODELS = {
  /** FLUX.1-schnell — free tier, fast, high quality */
  flux_schnell_free: 'black-forest-labs/FLUX.1-schnell-Free',

  /** FLUX.1-schnell — paid tier (higher rate limits) */
  flux_schnell: 'black-forest-labs/FLUX.1-schnell',

  /** FLUX.1-dev — higher quality, paid, 28-step */
  flux_dev: 'black-forest-labs/FLUX.1-dev',

  /** SDXL Base 1.0 — Stability classic, good for pixel art with negative prompts */
  sdxl_base: 'stabilityai/stable-diffusion-xl-base-1.0',
} as const;

export type TogetherModelKey = keyof typeof TOGETHER_MODELS;

interface TogetherImageResponse {
  id: string;
  model: string;
  object: 'list';
  data: Array<{
    index: number;
    b64_json?: string;
    url?: string;
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface TogetherErrorResponse {
  error?: {
    message: string;
    type?: string;
    code?: string | number;
  };
  message?: string;
}

/**
 * Generate pixel art via Together.ai image generation API.
 *
 * Together's image API is OpenAI-compatible (`/v1/images/generations`).
 * FLUX.1-schnell-Free is the recommended free-tier model.
 *
 * @param params - unified generation params
 * @param apiKey - Together.ai API key
 */
export async function togetherGenerate(
  params: GenerateParams,
  apiKey: string,
): Promise<GenerateResult> {
  const startMs = Date.now();

  const model = resolveModel(params);
  const prompt = buildPrompt({
    tool:           params.tool,
    userPrompt:     params.prompt,
    stylePreset:    params.stylePreset,
    assetCategory:  params.assetCategory,
    pixelEra:       params.pixelEra,
    backgroundMode: params.backgroundMode,
    outlineStyle:   params.outlineStyle,
    paletteSize:    params.paletteSize,
    width:          params.width,
    height:         params.height,
  });
  const { width, height } = resolveSize(params);
  const steps = resolveSteps(params, model);
  const seed =
    params.seed != null && params.seed > 0
      ? params.seed
      : Math.floor(Math.random() * 2 ** 31);

  const body: Record<string, unknown> = {
    model,
    prompt,
    width,
    height,
    steps,
    seed,
    n: 1,
    // Request base64 so we aren't dependent on Together CDN URL expiry
    response_format: 'b64_json',
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(`${TOGETHER_API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, TIMEOUT_MS);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      const pe: ProviderError = new Error(`Request timed out after ${TIMEOUT_MS / 1000}s`);
      pe.provider = 'together';
      throw pe;
    }
    throw err;
  }

  if (!res.ok) {
    const errBody: TogetherErrorResponse = await res.json().catch(() => ({}));
    const message =
      errBody?.error?.message ??
      errBody?.message ??
      `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(`Together.ai API error: ${message}`) as ProviderError;
    err.provider = 'together';
    err.statusCode = res.status;
    throw err;
  }

  const data: TogetherImageResponse = await res.json();
  const item = data.data?.[0];

  if (!item) {
    const err = new Error('Together.ai returned no image data') as ProviderError;
    err.provider = 'together';
    throw err;
  }

  // Prefer b64_json — wrap as data URI so downstream code can use it as <img src>
  let resultUrl: string | null = null;
  if (item.b64_json) {
    resultUrl = `data:image/png;base64,${item.b64_json}`;
  } else if (item.url) {
    resultUrl = item.url;
  }

  return {
    provider: 'together',
    providerJobId: data.id,
    resultUrl,
    durationMs: Date.now() - startMs,
    resolvedSeed: seed,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveModel(params: GenerateParams): string {
  if (params.modelOverride) return params.modelOverride;
  // Default: free tier
  return TOGETHER_MODELS.flux_schnell_free;
}

function resolveSize(params: GenerateParams): { width: number; height: number } {
  const snap = (n: number) => Math.max(64, Math.min(1024, Math.round(n / 32) * 32));
  return {
    width: snap(params.width ?? 512),
    height: snap(params.height ?? 512),
  };
}

/**
 * FLUX-schnell works best at 4 steps; FLUX-dev at 28.
 * Higher step counts on schnell produce diminishing returns.
 */
function resolveSteps(params: GenerateParams, model: string): number {
  if (params.steps != null) return params.steps;
  if (model.includes('schnell')) return 4;
  if (model.includes('dev')) return 28;
  return 4;
}
