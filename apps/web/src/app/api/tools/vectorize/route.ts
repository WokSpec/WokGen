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

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
      { error: 'Vectorizer.AI credentials not configured. Add VECTORIZER_API_ID and VECTORIZER_API_SECRET. Free at https://vectorizer.ai/' },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.imageUrl?.trim()) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
  }

  // SSRF protection
  const ssrfResult = checkSsrf(body.imageUrl as string);
  if (!ssrfResult.ok) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Fetch the source image
  const imgRes = await fetch(body.imageUrl as string, { signal: AbortSignal.timeout(15_000) });
  if (!imgRes.ok) {
    return NextResponse.json({ error: 'Could not fetch image from URL' }, { status: 400 });
  }

  const imgBuffer = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get('content-type') || 'image/png';

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
}
