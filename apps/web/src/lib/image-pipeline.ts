/**
 * Sharp image processing pipeline — resize, watermark, format conversion.
 *
 * Wraps sharp to provide a composable pipeline for post-processing generated
 * images before delivery or download.
 *
 * - Resize: constrain to max dimension while preserving aspect ratio
 * - Watermark: overlay a semi-transparent text or SVG badge
 * - Convert: output as webp (smaller) or png (lossless)
 * - Thumbnail: 256×256 crop for gallery previews
 *
 * All methods gracefully return null if sharp is unavailable (Edge runtime).
 */

export interface ProcessImageOptions {
  /** Max width or height in pixels (preserves aspect ratio) */
  maxDimension?: number;
  /** Output format. Default: same as input */
  format?: 'png' | 'webp' | 'jpeg';
  /** JPEG/WebP quality 1-100. Default: 90 */
  quality?: number;
  /** Watermark text. Rendered as a small SVG overlay in bottom-right */
  watermark?: string;
}

export interface ProcessImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  byteLength: number;
}

export async function processImage(
  input: Buffer | string,
  options: ProcessImageOptions = {},
): Promise<ProcessImageResult | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp') as typeof import('sharp');

    const buf = typeof input === 'string'
      ? Buffer.from(await (await fetch(input, { signal: AbortSignal.timeout(15_000) })).arrayBuffer())
      : input;

    let pipeline = sharp(buf);
    const meta   = await pipeline.metadata();

    // Resize
    if (options.maxDimension) {
      pipeline = pipeline.resize({
        width:  options.maxDimension,
        height: options.maxDimension,
        fit:    'inside',
        withoutEnlargement: true,
      });
    }

    // Watermark (SVG text overlay)
    if (options.watermark) {
      const w   = meta.width  ?? 512;
      const h   = meta.height ?? 512;
      const fz  = Math.max(10, Math.round(Math.min(w, h) * 0.035));
      const pad = Math.round(fz * 0.6);
      const wm  = options.watermark.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
      const svgBuf = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
        `<text x="${w - pad}" y="${h - pad}" ` +
        `font-family="sans-serif" font-size="${fz}" ` +
        `fill="white" fill-opacity="0.55" ` +
        `text-anchor="end" dominant-baseline="auto">${wm}</text></svg>`,
      );
      pipeline = pipeline.composite([{ input: svgBuf, top: 0, left: 0, blend: 'over' }]);
    }

    // Format conversion
    if (options.format === 'webp') {
      pipeline = pipeline.webp({ quality: options.quality ?? 90 });
    } else if (options.format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: options.quality ?? 90, mozjpeg: true });
    } else if (options.format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 7 });
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return {
      buffer:     data,
      format:     info.format,
      width:      info.width,
      height:     info.height,
      byteLength: info.size,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a 256×256 thumbnail (center-cropped) for gallery use.
 */
export async function generateThumbnail(input: Buffer | string): Promise<Buffer | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp') as typeof import('sharp');
    const buf = typeof input === 'string'
      ? Buffer.from(await (await fetch(input, { signal: AbortSignal.timeout(10_000) })).arrayBuffer())
      : input;
    return await sharp(buf)
      .resize(256, 256, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return null;
  }
}
