/**
 * Stable Horde provider — federated volunteer GPU network.
 *
 * 100% free. No billing ever. 300+ open-source models.
 * Anonymous key "0000000000" works (low priority, longer queue).
 * Free account at https://stablehorde.net — earns kudos for higher priority.
 *
 * API docs: https://stablehorde.net/api
 * Flow: POST /generate/async → poll /generate/check/{id} → GET /generate/status/{id}
 */

import type { ProviderConfig, GenerateParams, GenerateResult, ProviderError } from './types';

const HORDE_API = 'https://stablehorde.net/api/v2';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
// Anonymous key — works but low queue priority. Set STABLE_HORDE_KEY for better priority.
const ANON_KEY = '0000000000';

// Models to try in order — popular, high-worker-count models
const FREE_MODELS = [
  'Deliberate',
  'DreamShaper',
  'stable_diffusion',
  'Realistic Vision',
  'SDXL 1.0',
];

export async function stablehordeGenerate(
  params: GenerateParams,
  config: ProviderConfig,
): Promise<GenerateResult> {
  const t0 = Date.now();
  const apiKey = config.apiKey || ANON_KEY;

  const width  = snapSize(params.width  ?? 512);
  const height = snapSize(params.height ?? 512);
  const seed   = params.seed != null && params.seed > 0
    ? params.seed
    : Math.floor(Math.random() * 2_147_483_647);

  // Build prompt — combine user prompt with style tokens
  const prompt = [params.prompt, params.stylePreset].filter(Boolean).join(', ');
  const negPrompt = params.negPrompt
    ? params.negPrompt
    : 'nsfw, blurry, low quality, watermark, text, logo, signature';

  // Try each model until one works
  let lastErr: unknown;
  for (const modelName of FREE_MODELS) {
    try {
      const result = await tryModel(modelName, prompt, negPrompt, width, height, seed, apiKey, config.timeoutMs ?? 120_000, t0);
      return result;
    } catch (err) {
      lastErr = err;
      const pe = err as ProviderError;
      // Only continue to next model on queue/capacity errors
      if (pe.statusCode && pe.statusCode < 500 && !pe.skipProvider) throw err;
      // Otherwise try next model
    }
  }

  const fe = new Error('Stable Horde: all models failed or timed out') as ProviderError;
  fe.provider = 'stablehorde';
  fe.skipProvider = true;
  throw lastErr ?? fe;
}

async function tryModel(
  modelName: string,
  prompt: string,
  negPrompt: string,
  width: number,
  height: number,
  seed: number,
  apiKey: string,
  timeoutMs: number,
  t0: number,
): Promise<GenerateResult> {
  // Submit generation job
  const submitRes = await fetchWithTimeout(`${HORDE_API}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Client-Agent': 'WokGen:1.1.0:contact@wokgen.ai',
    },
    body: JSON.stringify({
      prompt: negPrompt ? `${prompt} ### ${negPrompt}` : prompt,
      params: {
        sampler_name: 'k_euler_a',
        cfg_scale: 7,
        steps: 20,
        width,
        height,
        seed: String(seed),
        n: 1,
      },
      models: [modelName],
      r2: true,          // use R2 CDN (faster delivery)
      nsfw: false,
      censor_nsfw: true,
      slow_workers: true, // use slower workers too (more availability)
    }),
  }, 60_000);

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => '');
    const pe = new Error(`Stable Horde submit failed (${submitRes.status}): ${body.slice(0, 200)}`) as ProviderError;
    pe.provider = 'stablehorde';
    pe.statusCode = submitRes.status;
    if (submitRes.status >= 500) pe.skipProvider = true;
    throw pe;
  }

  const { id } = await submitRes.json() as { id: string };
  if (!id) {
    const pe = new Error('Stable Horde: no job ID returned') as ProviderError;
    pe.provider = 'stablehorde';
    pe.skipProvider = true;
    throw pe;
  }

  // Poll until done (or timeout)
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3_000));

    const checkRes = await fetchWithTimeout(`${HORDE_API}/generate/check/${id}`, {
      headers: { 'apikey': apiKey, 'Client-Agent': 'WokGen:1.1.0:contact@wokgen.ai' },
    }, Math.min(60_000, deadline - Date.now()));

    if (!checkRes.ok) continue; // transient check failure, keep polling

    const check = await checkRes.json() as {
      done: boolean;
      faulted: boolean;
      waiting: number;
      processing: number;
      wait_time: number;
      queue_position: number;
    };

    if (check.faulted) {
      const pe = new Error(`Stable Horde: job faulted for model ${modelName}`) as ProviderError;
      pe.provider = 'stablehorde';
      pe.skipProvider = true;
      throw pe;
    }

    if (!check.done) continue;

    // Retrieve result
    const statusRes = await fetchWithTimeout(`${HORDE_API}/generate/status/${id}`, {
      headers: { 'apikey': apiKey, 'Client-Agent': 'WokGen:1.1.0:contact@wokgen.ai' },
    }, 60_000);

    if (!statusRes.ok) {
      const pe = new Error(`Stable Horde status fetch failed (${statusRes.status})`) as ProviderError;
      pe.provider = 'stablehorde';
      pe.skipProvider = true;
      throw pe;
    }

    const status = await statusRes.json() as {
      generations: Array<{ img: string; worker_name: string; model: string }>;
    };

    const gen = status.generations?.[0];
    if (!gen?.img) {
      const pe = new Error('Stable Horde: no image in result') as ProviderError;
      pe.provider = 'stablehorde';
      pe.skipProvider = true;
      throw pe;
    }

    // img is either a URL (r2: true) or base64 string
    let resultUrl: string;
    if (gen.img.startsWith('http')) {
      resultUrl = gen.img;
    } else {
      resultUrl = `data:image/webp;base64,${gen.img}`;
    }

    return {
      provider:     'stablehorde',
      resultUrl,
      durationMs:   Date.now() - t0,
      resolvedSeed: seed,
      providerJobId: id,
    };
  }

  const pe = new Error(`Stable Horde: job timed out after ${Math.round(timeoutMs / 1000)}s`) as ProviderError;
  pe.provider = 'stablehorde';
  pe.skipProvider = true;
  throw pe;
}

/** Snap to nearest 64, clamped [64, 1024] — SD models require multiples of 8/64 */
function snapSize(n: number): number {
  return Math.max(64, Math.min(1024, Math.round(n / 64) * 64));
}
