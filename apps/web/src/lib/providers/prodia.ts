/**
 * Prodia provider — free Stable Diffusion image generation.
 * No API key required by default; PRODIA_API_KEY unlocks higher rate limits.
 *
 * Flow: POST /v1/sd/generate → poll GET /v1/job/{id} until succeeded/failed
 * API docs: https://docs.prodia.com/reference/generate
 */

import type { GenerateParams, GenerateResult, ProviderError } from './types';

const PRODIA_API = 'https://api.prodia.com/v1';
const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 60; // 120s max

type ProdiaStylePreset = string;

// Map WokGen style presets to Prodia model filenames
const STYLE_TO_MODEL: Record<ProdiaStylePreset, string> = {
  portrait:          'deliberate_v3.safetensors [afd9d2d4]',
  isometric:         'dynavision_0.614.safetensors [8a7d9c8f]',
  character_idle:    'deliberate_v3.safetensors [afd9d2d4]',
  character_side:    'deliberate_v3.safetensors [afd9d2d4]',
  top_down_char:     'edge_of_realism_eorV20.safetensors [3ed5de15]',
  chibi:             'meinamix_meinaV11.safetensors [b56ce717]',
  anime:             'meinamix_meinaV11.safetensors [b56ce717]',
  horror:            'dynavision_0.614.safetensors [8a7d9c8f]',
  sci_fi:            'dreamshaper_8.safetensors [9d40847d]',
  rpg_icon:          'Anything-V3.0-pruned.ckpt [2700c435]',
  badge_icon:        'Anything-V3.0-pruned.ckpt [2700c435]',
  weapon_icon:       'Anything-V3.0-pruned.ckpt [2700c435]',
  emoji:             'Anything-V3.0-pruned.ckpt [2700c435]',
  animated_effect:   'openjourney_V4.ckpt [ca2f377f]',
};

const DEFAULT_MODEL = 'dreamshaper_8.safetensors [9d40847d]';

function selectModel(stylePreset?: string): string {
  if (!stylePreset) return DEFAULT_MODEL;
  return STYLE_TO_MODEL[stylePreset] ?? DEFAULT_MODEL;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function prodiaGenerate(
  params: GenerateParams,
  apiKey?: string,
): Promise<GenerateResult> {
  const t0 = Date.now();
  const key = apiKey ?? process.env.PRODIA_API_KEY ?? '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (key) headers['X-Prodia-Key'] = key;

  const width  = params.width  ?? 512;
  const height = params.height ?? 512;
  const seed   = params.seed   ?? -1;
  const model  = params.modelOverride ?? selectModel(params.stylePreset);

  // Submit generation job
  const submitRes = await fetchWithTimeout(
    `${PRODIA_API}/sd/generate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        prompt:          params.prompt,
        negative_prompt: params.negPrompt ?? 'blurry, low quality, watermark',
        steps:           params.steps     ?? 20,
        cfg_scale:       params.guidance  ?? 7,
        seed,
        width:           Math.min(width, 1024),
        height:          Math.min(height, 1024),
        sampler:         'DPM++ 2M Karras',
        aspect_ratio:    'square',
      }),
    },
    15_000,
  );

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => '');
    const pe: ProviderError = new Error(
      `Prodia submit failed HTTP ${submitRes.status}: ${body}`,
    ) as ProviderError;
    pe.provider = 'prodia';
    pe.statusCode = submitRes.status;
    if (submitRes.status === 429 || submitRes.status >= 500) pe.skipProvider = true;
    throw pe;
  }

  const { job: jobId } = await submitRes.json() as { job: string };
  if (!jobId) {
    const pe: ProviderError = new Error('Prodia: no job ID returned') as ProviderError;
    pe.provider = 'prodia';
    pe.skipProvider = true;
    throw pe;
  }

  // Poll until completion
  for (let poll = 0; poll < MAX_POLLS; poll++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const statusRes = await fetchWithTimeout(
      `${PRODIA_API}/job/${jobId}`,
      { headers },
      10_000,
    );

    if (!statusRes.ok) continue; // transient error, keep polling

    const job = await statusRes.json() as {
      status: 'queued' | 'processing' | 'succeeded' | 'failed';
      imageUrl?: string;
    };

    if (job.status === 'failed') {
      const pe: ProviderError = new Error(`Prodia job ${jobId} failed`) as ProviderError;
      pe.provider = 'prodia';
      pe.providerJobId = jobId;
      pe.skipProvider = true;
      throw pe;
    }

    if (job.status === 'succeeded' && job.imageUrl) {
      // Fetch image and convert to base64 data URL (consistent with other providers)
      const imgRes = await fetch(job.imageUrl);
      if (!imgRes.ok) {
        // Return the remote URL as-is if fetch fails
        return {
          provider:     'prodia',
          providerJobId: jobId,
          resultUrl:    job.imageUrl,
          durationMs:   Date.now() - t0,
          resolvedSeed: seed === -1 ? undefined : seed,
        };
      }
      const buf = await imgRes.arrayBuffer();
      const ct  = imgRes.headers.get('content-type') ?? 'image/jpeg';
      const resultUrl = `data:${ct.split(';')[0]};base64,${Buffer.from(buf).toString('base64')}`;

      return {
        provider:      'prodia',
        providerJobId: jobId,
        resultUrl,
        durationMs:    Date.now() - t0,
        resolvedSeed:  seed === -1 ? undefined : seed,
      };
    }
    // queued | processing → keep polling
  }

  const pe: ProviderError = new Error(
    `Prodia job ${jobId} timed out after ${(MAX_POLLS * POLL_INTERVAL_MS) / 1000}s`,
  ) as ProviderError;
  pe.provider = 'prodia';
  pe.providerJobId = jobId;
  pe.skipProvider = true;
  throw pe;
}
