import type { GenerateParams, GenerateResult, ProviderError } from './types';
import { STYLE_PRESET_TOKENS } from './types';

// ---------------------------------------------------------------------------
// ComfyUI local provider
// Executes pixel art workflows against a locally-running ComfyUI instance
// via its WebSocket + REST prompt API.
//
// ComfyUI API surface used:
//   POST /prompt          — queue a workflow prompt, get prompt_id
//   GET  /history/{id}    — poll until execution complete, get output filenames
//   GET  /view?...        — download the generated image bytes
//   GET  /system_stats    — health-check / reachability probe
// ---------------------------------------------------------------------------

const DEFAULT_COMFY_HOST = 'http://127.0.0.1:8188';

// ---------------------------------------------------------------------------
// ComfyUI REST response types (minimal surface)
// ---------------------------------------------------------------------------

interface ComfyPromptResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, unknown>;
}

interface ComfyHistoryOutput {
  images: Array<{
    filename: string;
    subfolder: string;
    type: 'output' | 'temp' | 'input';
  }>;
}

interface ComfyHistoryEntry {
  prompt: unknown[];
  outputs: Record<string, ComfyHistoryOutput>;
  status: {
    status_str: 'success' | 'error';
    completed: boolean;
    messages: Array<[string, unknown]>;
  };
}

interface ComfyHistory {
  [promptId: string]: ComfyHistoryEntry;
}

// ---------------------------------------------------------------------------
// Workflow template
// ---------------------------------------------------------------------------

/**
 * Build a minimal ComfyUI API-format workflow for pixel art icon generation.
 *
 * Node layout:
 *   1 CheckpointLoaderSimple  →  2 CLIPTextEncodePositive
 *                             →  3 CLIPTextEncodeNegative
 *   1 VAEDecode               ← 4 KSampler ← 5 EmptyLatentImage
 *   6 SaveImage               ← 1 VAEDecode
 */
function buildPixelIconWorkflow(
  prompt: string,
  negPrompt: string,
  width: number,
  height: number,
  seed: number,
  steps: number,
  cfg: number,
  checkpoint: string,
  sampler: string,
  scheduler: string,
): Record<string, unknown> {
  return {
    // ── Node 1: Load checkpoint ─────────────────────────────────────────────
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: checkpoint,
      },
    },

    // ── Node 2: Positive CLIP encode ────────────────────────────────────────
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1], // [node_id, output_index]
      },
    },

    // ── Node 3: Negative CLIP encode ────────────────────────────────────────
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negPrompt,
        clip: ['1', 1],
      },
    },

    // ── Node 4: Empty latent image ──────────────────────────────────────────
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },

    // ── Node 5: KSampler ────────────────────────────────────────────────────
    '5': {
      class_type: 'KSampler',
      inputs: {
        model:            ['1', 0],
        positive:         ['2', 0],
        negative:         ['3', 0],
        latent_image:     ['4', 0],
        seed,
        steps,
        cfg,
        sampler_name:     sampler,
        scheduler,
        denoise:          1.0,
      },
    },

    // ── Node 6: VAE decode ──────────────────────────────────────────────────
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae:     ['1', 2],
      },
    },

    // ── Node 7: Save image ──────────────────────────────────────────────────
    '7': {
      class_type: 'SaveImage',
      inputs: {
        images:          ['6', 0],
        filename_prefix: 'wokgen_',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate pixel art via a locally-running ComfyUI instance.
 *
 * @param params   - unified generation params
 * @param host     - ComfyUI base URL (default: http://127.0.0.1:8188)
 */
export async function comfyuiGenerate(
  params: GenerateParams,
  host: string = DEFAULT_COMFY_HOST,
): Promise<GenerateResult> {
  const base = host.replace(/\/$/, '');

  // Step 0: sanity-check the host is reachable
  await assertReachable(base);

  const startMs = Date.now();

  // Step 1: resolve generation parameters
  const seed =
    params.seed != null && params.seed > 0
      ? params.seed
      : Math.floor(Math.random() * 2 ** 32);

  const width  = snapSize(params.width  ?? 512);
  const height = snapSize(params.height ?? 512);
  const steps  = params.steps    ?? 20;
  const cfg    = params.guidance  ?? 7.5;

  const checkpoint = resolveCheckpoint(params);
  const sampler    = 'dpmpp_2m';
  const scheduler  = 'karras';

  const prompt    = buildPrompt(params);
  const negPrompt = buildNegPrompt(params.negPrompt);

  const workflow = buildPixelIconWorkflow(
    prompt,
    negPrompt,
    width,
    height,
    seed,
    steps,
    cfg,
    checkpoint,
    sampler,
    scheduler,
  );

  // Step 2: queue the prompt
  const { prompt_id } = await queuePrompt(base, workflow);

  // Step 3: poll history until complete
  const history = await waitForCompletion(base, prompt_id);

  // Step 4: find the output image filename
  const outputFilename = extractOutputFilename(history, prompt_id);
  if (!outputFilename) {
    const err = new Error(
      `ComfyUI: prompt ${prompt_id} completed but produced no output image`,
    ) as ProviderError;
    err.provider = 'comfyui';
    err.providerJobId = prompt_id;
    throw err;
  }

  // Step 5: download the image bytes and convert to a data URI
  const imageDataUri = await downloadImage(base, outputFilename.filename, outputFilename.subfolder);

  return {
    provider: 'comfyui',
    providerJobId: prompt_id,
    resultUrl: imageDataUri,
    durationMs: Date.now() - startMs,
    resolvedSeed: seed,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Confirm ComfyUI is listening before we attempt to queue a job */
async function assertReachable(base: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${base}/system_stats`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    const err = new Error(
      `ComfyUI is not reachable at ${base}. ` +
        'Make sure ComfyUI is running (python main.py) and listening on the configured host.',
    ) as ProviderError;
    err.provider = 'comfyui';
    (err as Error & { cause: unknown }).cause = cause;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(
      `ComfyUI health check failed: HTTP ${res.status} ${res.statusText}`,
    ) as ProviderError;
    err.provider = 'comfyui';
    err.statusCode = res.status;
    throw err;
  }
}

async function queuePrompt(
  base: string,
  workflow: Record<string, unknown>,
): Promise<ComfyPromptResponse> {
  const body = {
    prompt: workflow,
    // client_id helps ComfyUI route WebSocket events — we use polling so any
    // stable string is fine here
    client_id: 'wokgen-web',
  };

  const res = await fetch(`${base}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = new Error(
      `ComfyUI /prompt failed ${res.status}: ${text}`,
    ) as ProviderError;
    err.provider = 'comfyui';
    err.statusCode = res.status;
    throw err;
  }

  return res.json() as Promise<ComfyPromptResponse>;
}

async function waitForCompletion(
  base: string,
  promptId: string,
  timeoutMs = 300_000,
): Promise<ComfyHistory> {
  const deadline = Date.now() + timeoutMs;
  let backoff = 1_500;

  while (Date.now() < deadline) {
    const res = await fetch(`${base}/history/${promptId}`);

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      const err = new Error(
        `ComfyUI history poll ${res.status}: ${text}`,
      ) as ProviderError;
      err.provider = 'comfyui';
      err.providerJobId = promptId;
      err.statusCode = res.status;
      throw err;
    }

    const history: ComfyHistory = await res.json();

    const entry = history[promptId];
    if (entry) {
      if (entry.status?.status_str === 'error') {
        const errMsg = extractErrorMessage(entry);
        const err = new Error(
          `ComfyUI execution error for ${promptId}: ${errMsg}`,
        ) as ProviderError;
        err.provider = 'comfyui';
        err.providerJobId = promptId;
        throw err;
      }

      if (entry.status?.completed) {
        return history;
      }
    }

    await sleep(backoff);
    backoff = Math.min(backoff * 1.3, 6_000);
  }

  const err = new Error(
    `ComfyUI prompt ${promptId} timed out after ${timeoutMs / 1000}s`,
  ) as ProviderError;
  err.provider = 'comfyui';
  err.providerJobId = promptId;
  throw err;
}

function extractOutputFilename(
  history: ComfyHistory,
  promptId: string,
): { filename: string; subfolder: string } | null {
  const entry = history[promptId];
  if (!entry?.outputs) return null;

  // Find the first SaveImage node output
  for (const nodeOutput of Object.values(entry.outputs)) {
    const images = nodeOutput.images ?? [];
    const first = images.find((img) => img.type === 'output');
    if (first) {
      return { filename: first.filename, subfolder: first.subfolder ?? '' };
    }
  }
  return null;
}

async function downloadImage(
  base: string,
  filename: string,
  subfolder: string,
): Promise<string> {
  const params = new URLSearchParams({ filename, type: 'output' });
  if (subfolder) params.set('subfolder', subfolder);

  const res = await fetch(`${base}/view?${params.toString()}`);
  if (!res.ok) {
    const err = new Error(
      `ComfyUI image download failed ${res.status}: ${res.statusText}`,
    ) as ProviderError;
    err.provider = 'comfyui';
    throw err;
  }

  const mimeType = res.headers.get('content-type') ?? 'image/png';
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

function extractErrorMessage(entry: ComfyHistoryEntry): string {
  const messages = entry.status?.messages ?? [];
  for (const [type, payload] of messages) {
    if (type === 'execution_error') {
      const p = payload as Record<string, unknown>;
      return String(p?.exception_message ?? p?.message ?? 'unknown error');
    }
  }
  return 'unknown error';
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildPrompt(params: GenerateParams): string {
  const parts = [
    // Pixel art steering prefix — essential for local models without pixel LoRA
    'pixel art, game icon, hard crisp edges, limited color palette, 32 colors maximum, ' +
      'no anti-aliasing, no gradients, centered single object on transparent or dark background, ' +
      'clean readable silhouette, game inventory asset style',
    params.prompt,
  ];

  // Style preset tokens
  if (params.stylePreset && params.stylePreset !== 'raw') {
    const tokens: string = STYLE_PRESET_TOKENS[params.stylePreset] ?? '';
    if (tokens) parts.push(tokens);
  }

  return parts.filter(Boolean).join(', ');
}

function buildNegPrompt(extra?: string): string {
  const base = [
    'blurry, soft, smooth shading, gradient, photorealistic, 3d render, sketch, ' +
      'painting, watercolor, anti-aliased, out of frame, watermark, text, letters, ' +
      'signature, logo, multiple objects, busy background, noise, compression artifacts, ' +
      'person, hands, face unless the item is a character portrait',
  ];
  if (extra) base.push(extra);
  return base.join(', ');
}

// ---------------------------------------------------------------------------
// Misc utilities
// ---------------------------------------------------------------------------

/**
 * Resolve the checkpoint name to use.
 * Checks `params.extra.checkpoint` first; falls back to env var; then a safe default.
 */
function resolveCheckpoint(params: GenerateParams): string {
  if (params.extra?.checkpoint && typeof params.extra.checkpoint === 'string') {
    return params.extra.checkpoint;
  }
  if (typeof process !== 'undefined' && process.env.COMFYUI_CHECKPOINT) {
    return process.env.COMFYUI_CHECKPOINT;
  }
  // Safe fallback — the user must have *a* checkpoint; this name is intentionally
  // generic so it surfaces a clear ComfyUI "checkpoint not found" error rather
  // than a cryptic WokGen error.
  return 'v1-5-pruned-emaonly.safetensors';
}

/**
 * Snap a pixel size to the nearest 64-pixel multiple.
 * ComfyUI's latent space requires sizes divisible by 8; 64 gives headroom.
 */
function snapSize(n: number): number {
  const clamped = Math.max(64, Math.min(2048, n));
  return Math.round(clamped / 64) * 64;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
