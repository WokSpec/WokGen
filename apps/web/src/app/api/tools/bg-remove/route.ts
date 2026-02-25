import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removeBackground } from '@/lib/bg-remove';
import { prisma } from '@/lib/db';
import { log as logger } from '@/lib/logger';
import { checkSsrf } from '@/lib/ssrf-check';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/bg-remove
 * Body: { imageUrl?: string, imageBase64?: string }
 * Returns: { resultBase64: string, mimeType: 'image/png' }
 * Quota: free = 3/day (via RateLimit table), paid = unlimited
 */
export async function POST(req: NextRequest) {
  if (!process.env.HF_TOKEN) {
    return NextResponse.json(
      { error: 'Background removal is not configured. Set HF_TOKEN environment variable.' },
      { status: 503 }
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  // Quota check: free/guest users get 3 bg-remove operations per day
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const rateLimitKey = userId ? `bg-remove:user:${userId}:${today}` : `bg-remove:ip:${ip}:${today}`;
    const resetAt = (() => {
      const d = new Date();
      d.setUTCHours(24, 0, 0, 0);
      return BigInt(d.getTime());
    })();

    // Determine if paid
    let isPaid = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: { select: { planId: true, status: true } } },
      });
      isPaid = ['plus', 'pro', 'max'].includes(user?.subscription?.planId ?? 'free') && user?.subscription?.status === 'active';
    }

    if (!isPaid) {
      const rl = await prisma.rateLimit.upsert({
        where: { key: rateLimitKey },
        update: { count: { increment: 1 } },
        create: { key: rateLimitKey, count: 1, reset_at: resetAt },
      });
      if (rl.count > 3) {
        return NextResponse.json(
          { error: 'Daily limit reached (3/day on free plan). Upgrade for unlimited.' },
          { status: 429 }
        );
      }
    }
  } catch {
    // Non-critical: allow through if quota check fails
  }

  let body: { imageUrl?: string; imageBase64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageUrl, imageBase64 } = body;

  if (!imageUrl && !imageBase64) {
    return NextResponse.json(
      { error: 'Provide either imageUrl or imageBase64' },
      { status: 400 }
    );
  }

  // SSRF protection for imageUrl
  if (imageUrl) {
    const ssrfResult = checkSsrf(imageUrl);
    if (!ssrfResult.ok) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }

  if (imageBase64) {
    // Upload base64 to a temporary data URL — we pass it through our own bg-remove
    // which fetches URLs. Convert base64 to blob URL approach via temp file is complex,
    // so we use the HF API directly with the buffer.
    try {
      const hfToken = process.env.HF_TOKEN!;
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const res = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
          Accept: 'image/png',
        },
        body: buffer,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return NextResponse.json(
          { error: `Background removal failed: ${res.status} ${errText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const resultBuffer = await res.arrayBuffer();
      const resultBase64 = Buffer.from(resultBuffer).toString('base64');

      return NextResponse.json({ resultBase64, mimeType: 'image/png' });
    } catch (err) {
      logger.error({ err }, '[bg-remove] base64 path failed');
      return NextResponse.json({ error: 'Background removal failed' }, { status: 500 });
    }
  }

  // imageUrl path — use existing lib
  const result = await removeBackground(imageUrl!);

  if (!result) {
    return NextResponse.json({ error: 'Background removal failed' }, { status: 502 });
  }

  const resultBase64 = result.replace(/^data:[^;]+;base64,/, '');

  return NextResponse.json({ resultBase64, mimeType: 'image/png' });
}
