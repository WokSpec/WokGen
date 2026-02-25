/**
 * Vectorizer.AI — convert raster images to clean, scalable SVG vectors
 * API: https://vectorizer.ai/api
 * Key: VECTORIZER_API_ID + VECTORIZER_API_SECRET
 * Free tier: 2 free vectorizations/day
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkSsrf } from '@/lib/ssrf-check';
import { z } from 'zod';
import { validateBody } from '@/lib/validate';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

const VectorizeSchema = z.object({
  imageUrl:    z.string().url('Must be a valid URL').optional(),
  imageBase64: z.string().optional(),
}).refine(d => d.imageUrl || d.imageBase64, { message: 'imageUrl or imageBase64 is required' });

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return API_ERRORS.UNAUTHORIZED();
  }

  // Rate limit: 20 vectorizations per hour per user
  const rl = await checkRateLimit(`vectorize:${session.user.id}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.', retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  const apiId     = process.env.VECTORIZER_API_ID;
  const apiSecret = process.env.VECTORIZER_API_SECRET;

  if (!apiId || !apiSecret) {
    return NextResponse.json(
      { error: 'Vectorizer API is not configured' },
      { status: 503 },
    );
  }

  const { data: body, error: bodyError } = await validateBody(req, VectorizeSchema);
  if (bodyError) return bodyError;
  const imageUrl: string | undefined = body.imageUrl?.trim();
  const imageBase64: string | undefined = body.imageBase64;

  let imgBuffer: ArrayBuffer;
  let contentType: string;

  if (imageBase64) {
    // Decode data URL (data:<mime>;base64,<data>) or raw base64
    const commaIdx = imageBase64.indexOf(',');
    const mimeMatch = imageBase64.match(/^data:([^;]+);/);
    contentType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Data = commaIdx >= 0 ? imageBase64.slice(commaIdx + 1) : imageBase64;
    imgBuffer = Buffer.from(base64Data, 'base64').buffer;
  } else {
    // SSRF protection
    const ssrfResult = checkSsrf(imageUrl as string);
    if (!ssrfResult.ok) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the source image
    const imgRes = await fetch(imageUrl as string, { signal: AbortSignal.timeout(15_000) });
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Could not fetch image from URL' }, { status: 400 });
    }

    imgBuffer = await imgRes.arrayBuffer();
    contentType = imgRes.headers.get('content-type') || 'image/png';
  }

  // Submit to Vectorizer.AI
  const formData = new FormData();
  formData.append('image', new Blob([imgBuffer], { type: contentType }), 'image.png');
  formData.append('output.svg.version', 'svg_1_1');
  formData.append('processing.max_colors', '256');

  const credentials = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');
  const vecRes = await fetch('https://vectorizer.ai/api/v1/vectorize', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}` },
    body: formData,
    signal: AbortSignal.timeout(45_000),
  });

  if (!vecRes.ok) {
    const errText = await vecRes.text().catch(() => '');
    return NextResponse.json(
      { error: `Vectorizer.AI error: ${errText}` },
      { status: vecRes.status },
    );
  }

  const svgContent = await vecRes.text();
  return NextResponse.json({ svg: svgContent, contentType: 'image/svg+xml' });
  } catch (err) {
    log.error({ err }, 'POST /api/tools/vectorize failed');
    return API_ERRORS.INTERNAL();
  }
}
