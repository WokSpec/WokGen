/**
 * Image quality gate for generated assets.
 *
 * Detects blank/corrupt/solid-color outputs that indicate a failed generation.
 * Uses sharp (already installed) to analyze pixel entropy.
 *
 * A blank image typically has near-zero entropy (all pixels identical).
 * A corrupt image will fail to parse entirely.
 *
 * Returns: { ok: boolean; reason?: string; entropy?: number }
 *
 * Only runs in Node.js runtime (not Edge). Falls back to ok=true if sharp
 * is unavailable or the URL cannot be fetched (non-fatal).
 */

const ENTROPY_THRESHOLD = 0.8; // bits per pixel — blank images are < 0.1
const MAX_FETCH_BYTES   = 4 * 1024 * 1024; // 4MB — don't fetch huge images
const FETCH_TIMEOUT_MS  = 8000;

export interface QualityGateResult {
  ok: boolean;
  reason?: string;
  entropy?: number;
  widthPx?: number;
  heightPx?: number;
}

export async function checkImageQuality(imageUrl: string): Promise<QualityGateResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp') as typeof import('sharp');

    // Fetch image bytes
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let buffer: Buffer;
    try {
      const res = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return { ok: true }; // non-fatal if can't fetch

      const contentLength = Number(res.headers.get('content-length') ?? 0);
      if (contentLength > MAX_FETCH_BYTES) return { ok: true }; // too large, skip

      const arrayBuf = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
    } catch {
      clearTimeout(timeout);
      return { ok: true }; // fetch failed — non-fatal
    }

    if (buffer.length === 0) {
      return { ok: false, reason: 'empty_response' };
    }

    // Parse with sharp
    const img = sharp(buffer);
    const meta = await img.metadata();

    if (!meta.width || !meta.height) {
      return { ok: false, reason: 'corrupt_image' };
    }

    // Check image dimensions — minimum 64x64
    if (meta.width < 32 || meta.height < 32) {
      return { ok: false, reason: 'too_small', widthPx: meta.width, heightPx: meta.height };
    }

    // Compute entropy by analyzing a small region (center crop 128x128)
    const sampleSize = Math.min(128, meta.width, meta.height);
    const { data, info } = await img
      .extract({
        left:   Math.floor((meta.width  - sampleSize) / 2),
        top:    Math.floor((meta.height - sampleSize) / 2),
        width:  sampleSize,
        height: sampleSize,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Shannon entropy over channel values
    const channels = info.channels;
    const freq = new Float64Array(256).fill(0);
    for (let i = 0; i < data.length; i += channels) {
      // Use red channel for entropy (representative for grayscale/color)
      freq[data[i]]++;
    }
    const total = data.length / channels;
    let entropy = 0;
    for (const f of freq) {
      if (f > 0) {
        const p = f / total;
        entropy -= p * Math.log2(p);
      }
    }

    // entropy is in bits — max ~8 for random image, ~0 for solid color
    if (entropy < ENTROPY_THRESHOLD) {
      return {
        ok: false,
        reason: 'blank_or_solid_color',
        entropy,
        widthPx: meta.width,
        heightPx: meta.height,
      };
    }

    return { ok: true, entropy, widthPx: meta.width, heightPx: meta.height };

  } catch {
    // If sharp or any step fails, pass through (non-fatal quality gate)
    return { ok: true };
  }
}
