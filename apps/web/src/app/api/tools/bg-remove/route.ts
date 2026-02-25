import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removeBackground } from '@/lib/bg-remove';
import { prisma } from '@/lib/db';
import { log as logger } from '@/lib/logger';
import { checkSsrf } from '@/lib/ssrf-check';
import { z } from 'zod';
import { withErrorHandler, dbQuery } from '@/lib/api-handler';
import { API_ERRORS } from '@/lib/api-response';
import { validateBody } from '@/lib/validate';

const BgRemoveSchema = z.object({
  imageUrl:    z.string().url('Must be a valid URL').optional(),
  imageBase64: z.string().optional(),
  projectId:   z.string().optional(),
}).refine(d => d.imageUrl || d.imageBase64, { message: 'Provide either imageUrl or imageBase64' });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(async (req) => {
  if (!process.env.HF_TOKEN) {
    return API_ERRORS.INTERNAL('Background removal is not configured. Set HF_TOKEN environment variable.');
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  // If a projectId is provided the user must be authenticated
  // (prevent anonymous activity events tied to projects)
  const authRequired = false;

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
      const user = await dbQuery(prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: { select: { planId: true, status: true } } },
      }));
      isPaid = ['plus', 'pro', 'max'].includes(user?.subscription?.planId ?? 'free') && user?.subscription?.status === 'active';
    }

    if (!isPaid) {
      const rl = await prisma.rateLimit.upsert({
        where: { key: rateLimitKey },
        update: { count: { increment: 1 } },
        create: { key: rateLimitKey, count: 1, reset_at: resetAt },
      });
      if (rl.count > 3) {
        return API_ERRORS.RATE_LIMITED();
      }
    }
  } catch {
    // Non-critical: allow through if quota check fails
  }

  const { data: body, error: bodyError } = await validateBody(req, BgRemoveSchema);
  if (bodyError) return bodyError;

  const { imageUrl, imageBase64, projectId } = body;

  if (projectId && !userId) {
    return API_ERRORS.UNAUTHORIZED();
  }

  // SSRF protection for imageUrl
  if (imageUrl) {
    const ssrfResult = checkSsrf(imageUrl);
    if (!ssrfResult.ok) {
      return API_ERRORS.BAD_REQUEST('Invalid URL');
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
        return API_ERRORS.INTERNAL(`Background removal failed: ${res.status} ${errText.slice(0, 200)}`);
      }

      const resultBuffer = await res.arrayBuffer();
      const resultBase64 = Buffer.from(resultBuffer).toString('base64');

      if (userId && projectId) {
        prisma.activityEvent.create({ data: { projectId, userId, type: 'tool.used', message: 'Background removed' } }).catch(() => {});
      }
      if (userId) {
        prisma.notification.create({ data: { userId, type: 'tool_complete', title: 'Tool complete', body: 'Background removal finished', read: false } }).catch(() => {});
      }
      return NextResponse.json({ resultBase64, mimeType: 'image/png' });
    } catch (err) {
      logger.error({ err }, '[bg-remove] base64 path failed');
      return API_ERRORS.INTERNAL('Background removal failed');
    }
  }

  // imageUrl path — use existing lib
  const result = await removeBackground(imageUrl!);

  if (!result) {
    return API_ERRORS.INTERNAL('Background removal failed');
  }

  const resultBase64 = result.replace(/^data:[^;]+;base64,/, '');

  if (userId && projectId) {
    prisma.activityEvent.create({ data: { projectId, userId, type: 'tool.used', message: 'Background removed' } }).catch(() => {});
  }
  if (userId) {
    prisma.notification.create({ data: { userId, type: 'tool_complete', title: 'Tool complete', body: 'Background removal finished', read: false } }).catch(() => {});
  }
  return NextResponse.json({ resultBase64, mimeType: 'image/png' });
});
