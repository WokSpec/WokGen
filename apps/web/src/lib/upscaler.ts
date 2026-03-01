/**
 * Image upscaler — 4x upscaling via Real-ESRGAN on HuggingFace Inference API.
 * Model: ai-forever/Real-ESRGAN
 * Env: HF_TOKEN
 */

import sharp from 'sharp';

const HF_REALESRGAN_URL =
  'https://router.huggingface.co/hf-inference/models/ai-forever/Real-ESRGAN';

export interface UpscaleOptions {
  scale?: 2 | 4; // default: 4
}

export interface UpscaleResult {
  url: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  durationMs: number;
}

export async function upscaleImage(
  imageUrl: string,
  options?: UpscaleOptions,
  hfToken?: string,
): Promise<UpscaleResult> {
  const t0 = Date.now();
  const token = hfToken ?? process.env.HF_TOKEN ?? '';
  if (!token) throw new Error('Upscaler requires HF_TOKEN. Get free token at https://huggingface.co/settings/tokens');

  // Fetch source image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: HTTP ${imgRes.status}`);
  const imgBuf = Buffer.from(await imgRes.arrayBuffer());

  // Get original dimensions via sharp
  const originalMeta = await sharp(imgBuf).metadata();
  const originalWidth  = originalMeta.width  ?? 0;
  const originalHeight = originalMeta.height ?? 0;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000); // 2 min for upscale

  let resultBuf: Buffer;
  try {
    const res = await fetch(HF_REALESRGAN_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        Accept:         'image/png',
      },
      body:   imgBuf,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const e = new Error(`Real-ESRGAN error ${res.status}: ${body}`);
      (e as NodeJS.ErrnoException & { skipProvider?: boolean }).skipProvider =
        res.status === 503 || res.status === 429;
      throw e;
    }

    resultBuf = Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }

  // Get upscaled dimensions
  const resultMeta = await sharp(resultBuf).metadata();
  const width  = resultMeta.width  ?? originalWidth  * (options?.scale ?? 4);
  const height = resultMeta.height ?? originalHeight * (options?.scale ?? 4);

  const base64 = resultBuf.toString('base64');
  const url = `data:image/png;base64,${base64}`;

  return { url, width, height, originalWidth, originalHeight, durationMs: Date.now() - t0 };
}
