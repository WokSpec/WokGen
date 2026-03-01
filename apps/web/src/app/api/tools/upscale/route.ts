/**
 * POST /api/tools/upscale
 * 4x image upscaling via Real-ESRGAN on HuggingFace Inference API.
 * Requires authenticated session. Rate limited: 5/minute per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { upscaleImage } from '@/lib/upscaler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  imageUrl: z.string().url('Must be a valid URL'),
  scale:    z.union([z.literal(2), z.literal(4)]).optional().default(4),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const rl = await checkRateLimit(`upscale:${session.user.id}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (!process.env.HF_TOKEN) {
    return NextResponse.json(
      { error: 'Upscaling not configured. Set HF_TOKEN environment variable.' },
      { status: 503 },
    );
  }

  try {
    const result = await upscaleImage(parsed.data.imageUrl, { scale: parsed.data.scale });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upscale failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
