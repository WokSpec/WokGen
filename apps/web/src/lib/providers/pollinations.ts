/**
 * Pollinations.ai provider — completely free, no API key required.
 * Uses the public image generation endpoint backed by FLUX.1-schnell.
 *
 * API: GET https://image.pollinations.ai/prompt/{encoded_prompt}
 *      Returns the image as binary (JPEG/PNG).
 *
 * We fetch the image server-side and return it as a base64 data URL so
 * the client never has to deal with CORS or Pollinations' redirect chain.
 */

import type { ProviderConfig, GenerateParams, GenerateResult, ProviderError } from './types';
import { buildPrompt, buildNegativePrompt } from '../prompt-builder';

const BASE_URL = 'https://image.pollinations.ai/prompt';
const TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function pollinationsGenerate(
  params: GenerateParams,
  _config: ProviderConfig,
): Promise<GenerateResult> {
  const t0 = Date.now();

  // Build prompt with central prompt builder
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
    lightweight: true, // Pollinations has a URL length limit — use compact tokens
  });
  const negPrompt = buildNegativePrompt({
    assetCategory: params.assetCategory,
    pixelEra: params.pixelEra,
    userNegPrompt: params.negPrompt,
  });

  const width  = params.width  ?? 512;
  const height = params.height ?? 512;
  const seed   = params.seed   ?? Math.floor(Math.random() * 2_147_483_647);

  const url = new URL(`${BASE_URL}/${encodeURIComponent(fullPrompt)}`);
  url.searchParams.set('width',   String(width));
  url.searchParams.set('height',  String(height));
  url.searchParams.set('seed',    String(seed));
  url.searchParams.set('model',   'flux');
  url.searchParams.set('nologo',  'true');
  url.searchParams.set('enhance', 'false');

  // Negative prompt is not natively supported but we can suffix the main prompt
  if (negPrompt) {
    url.searchParams.set('negative_prompt', negPrompt);
  }

  const timeoutMs = _config.timeoutMs ?? TIMEOUT_MS;
  const MAX_RETRIES = 2;

  let imageBuffer: ArrayBuffer;
  let contentType = 'image/jpeg';
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url.toString(),
        { redirect: 'follow' },
        timeoutMs,
      );

      if (!res.ok) {
        // Cloudflare/origin 5xx — retry with backoff before giving up
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 2_000 * (attempt + 1)));
          continue;
        }
        const pe: ProviderError = new Error(`Pollinations returned HTTP ${res.status}`) as ProviderError;
        pe.provider = 'pollinations';
        pe.statusCode = res.status;
        if (res.status >= 500) pe.skipProvider = true;
        throw pe;
      }

      contentType = res.headers.get('content-type') ?? 'image/jpeg';
      imageBuffer = await res.arrayBuffer();
      break; // success
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        const pe: ProviderError = new Error(`Request timed out after ${timeoutMs / 1000}s`) as ProviderError;
        pe.provider = 'pollinations';
        if (attempt < MAX_RETRIES) { lastErr = pe; continue; }
        throw pe;
      }
      if ((err as ProviderError).provider === 'pollinations' && attempt < MAX_RETRIES) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }

  if (!imageBuffer!) {
    throw lastErr ?? Object.assign(new Error('Pollinations: all retry attempts failed'), { provider: 'pollinations', skipProvider: true });
  }

  // Convert to base64 data URL
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const mimeType = contentType.split(';')[0].trim();
  const resultUrl = `data:${mimeType};base64,${base64}`;

  return {
    provider:      'pollinations',
    resultUrl,
    durationMs:    Date.now() - t0,
    resolvedSeed:  seed,
  };
}
