/**
 * POST /api/animate
 *
 * Generates a pixel art animation as a GIF.
 *
 * Strategy:
 *  1. Generate N individual frames using HuggingFace/Pollinations (free tier)
 *     or Replicate AnimateDiff (HD tier)
 *  2. Each frame gets motion-aware prompt tokens via prompt-builder
 *  3. Assemble frames into a GIF using gifenc
 *  4. Return as base64 data:image/gif
 */

import { NextRequest, NextResponse } from 'next/server';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import sharp from 'sharp';
import {
  buildFramePrompt,
  buildNegativePrompt,
  getAnimationSpec,
  type AnimationType,
  type BuildPromptOptions,
} from '@/lib/prompt-builder';
import { resolveProviderConfig } from '@/lib/providers';
import { huggingfaceGenerate } from '@/lib/providers/huggingface';
import { pollinationsGenerate } from '@/lib/providers/pollinations';
import { checkRateLimit } from '@/lib/rate-limit';
import { log as logger } from '@/lib/logger';
import type { StylePreset, ProviderName } from '@/lib/providers/types';
import type { GenerateParams } from '@/lib/providers/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Sharp is a native Node.js module installed in the project
// We use it to decode PNG/JPEG frames → raw RGBA pixel data for gifenc

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------
interface AnimateRequest {
  prompt: string;
  animationType?: AnimationType;
  frameCount?: number;
  fps?: number;
  loop?: 'infinite' | 'pingpong' | 'once';
  size?: number;
  stylePreset?: StylePreset;
  assetCategory?: GenerateParams['assetCategory'];
  pixelEra?: GenerateParams['pixelEra'];
  backgroundMode?: GenerateParams['backgroundMode'];
  outlineStyle?: GenerateParams['outlineStyle'];
  paletteSize?: GenerateParams['paletteSize'];
  seed?: number;
  quality?: 'standard' | 'hd';
  sourceImageBase64?: string; // for image-to-animate
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const isSelfHosted = process.env.SELF_HOSTED === 'true';
  let authedUserId: string | null = null;

  if (!isSelfHosted) {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    authedUserId = session?.user?.id ?? null;

    const rateLimitKey =
      authedUserId ??
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    // Animate is heavier: 3 req/min for guests, 10 for authed
    const rl = await checkRateLimit(rateLimitKey, authedUserId ? 10 : 3);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 },
      );
    }
  }

  // Parse body
  let body: AnimateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    prompt,
    animationType = 'idle',
    fps: requestedFps,
    loop = 'infinite',
    size = 128,
    stylePreset,
    assetCategory,
    pixelEra,
    backgroundMode = 'transparent',
    outlineStyle = 'bold',
    paletteSize = 32,
    seed: requestedSeed,
    quality = 'standard',
  } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  // Get animation spec defaults
  const spec = getAnimationSpec(animationType);
  const frameCount = Math.min(12, Math.max(2, body.frameCount ?? spec.totalFrames));
  const fps = requestedFps ?? spec.fps;

  // Clamp size to reasonable range for animation
  const clampedSize = Math.min(256, Math.max(32, size));

  const baseSeed =
    requestedSeed ?? Math.floor(Math.random() * 2_147_483_647);

  // Build base prompt options
  const baseOpts: BuildPromptOptions = {
    tool: 'animate',
    userPrompt: prompt.trim(),
    stylePreset,
    assetCategory,
    pixelEra,
    backgroundMode,
    outlineStyle,
    paletteSize,
    width: clampedSize,
    height: clampedSize,
    lightweight: quality === 'standard',
  };

  const negativePrompt = buildNegativePrompt({ assetCategory, pixelEra });

  // Determine provider
  const useHD = quality === 'hd' && Boolean(process.env.REPLICATE_API_TOKEN);
  const provider: ProviderName = useHD
    ? 'replicate'
    : process.env.HF_TOKEN
    ? 'huggingface'
    : 'pollinations';

  const config = resolveProviderConfig(provider, null, null);

  // Generate all frames in parallel (with slight seed offset each)
  const framePromises = Array.from({ length: frameCount }, async (_, i) => {
    const frameSeed = baseSeed + i * 137;
    const framePromptText = buildFramePrompt(baseOpts, animationType, i, frameCount);

    const frameParams: GenerateParams = {
      tool: 'animate',
      prompt: framePromptText,
      negPrompt: negativePrompt,
      width: clampedSize,
      height: clampedSize,
      seed: frameSeed,
      steps: useHD ? 20 : 4,
      guidance: useHD ? 7.5 : 3.5,
      stylePreset,
      assetCategory,
      pixelEra,
      backgroundMode,
      outlineStyle,
      paletteSize,
    };

    if (provider === 'huggingface') {
      return huggingfaceGenerate(frameParams, config);
    }
    // fallback to pollinations
    return pollinationsGenerate(frameParams, config);
  });

  let frameResults: Awaited<ReturnType<typeof huggingfaceGenerate>>[];
  try {
    frameResults = await Promise.all(framePromises);
  } catch (err) {
    logger.error({ err }, '[animate] Frame generation failed');
    return NextResponse.json(
      { error: `Frame generation failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // Extract frame data URLs
  const frameDataUrls = frameResults.map((r) => r.resultUrl).filter(Boolean) as string[];
  if (frameDataUrls.length === 0) {
    return NextResponse.json({ error: 'No frames generated' }, { status: 500 });
  }

  // Assemble GIF from frames
  try {
    const gifBase64 = await assembleGif(frameDataUrls, clampedSize, fps, loop);
    return NextResponse.json({
      ok: true,
      resultUrl: `data:image/gif;base64,${gifBase64}`,
      frameCount: frameDataUrls.length,
      fps,
      durationMs: Math.round(1000 * frameDataUrls.length / fps),
    });
  } catch (err) {
    logger.error({ err }, '[animate] GIF assembly failed');
    return NextResponse.json(
      { error: `GIF assembly failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GIF Assembly using gifenc
// ---------------------------------------------------------------------------
async function assembleGif(
  dataUrls: string[],
  size: number,
  fps: number,
  loop: 'infinite' | 'pingpong' | 'once',
): Promise<string> {
  // Frame delay in centiseconds (1/100 second units for GIF)
  const frameDelay = Math.round(100 / fps);

  // For ping-pong, duplicate frames in reverse (minus first and last)
  const allUrls =
    loop === 'pingpong' && dataUrls.length > 2
      ? [...dataUrls, ...[...dataUrls].reverse().slice(1, -1)]
      : dataUrls;

  // Decode all frames to raw RGBA pixel buffers using sharp
  const frameBuffers = await Promise.all(
    allUrls.map((dataUrl) => decodeFrameToRgba(dataUrl, size, size)),
  );

  // Create GIF encoder
  const gif = GIFEncoder();

  // Loop count: 0 = infinite, 1 = once
  const loopCount = loop === 'once' ? 1 : 0;

  for (let i = 0; i < frameBuffers.length; i++) {
    const rgba = frameBuffers[i];

    // Quantize palette for this frame
    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);

    gif.writeFrame(indexed, size, size, {
      palette,
      delay: frameDelay,
      dispose: 2, // restore to background
      repeat: i === 0 ? loopCount : undefined, // only set on first frame
    });
  }

  gif.finish();

  return Buffer.from(gif.bytes()).toString('base64');
}

/** Decode a base64 data URL to a flat Uint8Array of RGBA pixels */
async function decodeFrameToRgba(
  dataUrl: string,
  width: number,
  height: number,
): Promise<Uint8Array> {
  // Strip the data: prefix to get raw base64
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  const rawBuffer = await sharp(buffer)
    .resize(width, height, { fit: 'fill', kernel: 'nearest' })
    .ensureAlpha()
    .raw()
    .toBuffer();

  return new Uint8Array(rawBuffer);
}
