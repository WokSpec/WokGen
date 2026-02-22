/**
 * Hugging Face Inference API provider — free tier, no billing required.
 *
 * Requires a free HF account token (Read access):
 *   https://huggingface.co/settings/tokens
 *
 * Uses the HF Inference Router: https://router.huggingface.co
 * Primary model: black-forest-labs/FLUX.1-schnell (fast, high quality)
 */

import type { ProviderConfig, GenerateParams, GenerateResult, ProviderError } from './types';
import { STYLE_PRESET_TOKENS } from './types';

// New HF Inference Router (replaces deprecated api-inference.huggingface.co)
const HF_ROUTER = 'https://router.huggingface.co/hf-inference/models';

/** FLUX.1-schnell via HF Inference Router (free with HF account token) */
const DEFAULT_MODEL = 'black-forest-labs/FLUX.1-schnell';

export async function huggingfaceGenerate(
  params: GenerateParams,
  config: ProviderConfig,
): Promise<GenerateResult> {
  const t0 = Date.now();

  if (!config.apiKey) {
    const err = new Error(
      'HuggingFace requires a free access token. ' +
      'Get one at https://huggingface.co/settings/tokens (free account, no billing needed). ' +
      'Set HF_TOKEN in your environment variables.'
    ) as ProviderError;
    err.provider   = 'huggingface';
    err.statusCode = 401;
    throw err;
  }

  const model  = (params.modelOverride as string | undefined) ?? DEFAULT_MODEL;
  const prompt = buildPrompt(params);
  const seed   = params.seed != null && params.seed > 0
    ? params.seed
    : Math.floor(Math.random() * 2_147_483_647);

  const width  = snapSize(params.width  ?? 512);
  const height = snapSize(params.height ?? 512);

  const body: Record<string, unknown> = {
    inputs: prompt,
    parameters: {
      num_inference_steps: model.includes('schnell') ? 4 : 20,
      width,
      height,
      seed,
      ...(params.negPrompt ? { negative_prompt: params.negPrompt } : {}),
    },
    options: { wait_for_model: true },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${config.apiKey}`,
    Accept:         'image/png,image/jpeg,*/*',
  };

  const timeoutMs  = config.timeoutMs ?? 120_000;
  const controller = new AbortController();
  const tid        = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${HF_ROUTER}/${model}`, {
      method:  'POST',
      headers,
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
  } finally {
    clearTimeout(tid);
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const txt = await res.text();
      const j   = JSON.parse(txt);
      detail    = j?.error ?? txt.slice(0, 200);
    } catch { /* ignore */ }
    const err = new Error(`HuggingFace API error: ${detail}`) as ProviderError;
    err.provider   = 'huggingface';
    err.statusCode = res.status;
    throw err;
  }

  const contentType = res.headers.get('content-type') ?? 'image/png';
  const buffer      = await res.arrayBuffer();
  const base64      = Buffer.from(buffer).toString('base64');
  const mimeType    = contentType.split(';')[0].trim();
  const resultUrl   = `data:${mimeType};base64,${base64}`;

  return {
    provider:     'huggingface',
    resultUrl,
    durationMs:   Date.now() - t0,
    resolvedSeed: seed,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPrompt(params: GenerateParams): string {
  const presetTokens = params.stylePreset
    ? STYLE_PRESET_TOKENS[params.stylePreset]
    : '';
  return [
    'pixel art, game asset, crisp pixel edges, limited color palette',
    presetTokens,
    params.prompt.trim(),
  ]
    .filter(Boolean)
    .join(', ');
}

/** Snap to nearest 64 within [64, 1024] — HF models work best on even multiples */
function snapSize(n: number): number {
  return Math.max(64, Math.min(1024, Math.round(n / 64) * 64));
}
