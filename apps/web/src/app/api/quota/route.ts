import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuotaStatus, getUserPlanId } from '@/lib/quota';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/quota
 *
 * Returns the caller's current standard-generation quota for today.
 * Used by studio pages to display the "X / Y generations remaining" badge.
 *
 * Response shape:
 *   { used, limit, remaining, tier, resetsIn }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId  = session?.user?.id ?? null;

    const clientIP =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    const planId = userId ? await getUserPlanId(userId) : 'guest';

    if (userId) {
      const cacheKey = `quota:${userId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-store' } });
    }

    const status = await getQuotaStatus(userId, clientIP, planId);

    // Compute seconds until next UTC midnight
    const now      = Date.now();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const resetsIn = Math.ceil((midnight.getTime() - now) / 1000);

    const quotaData = { ...status, resetsIn };

    if (userId) await cache.set(`quota:${userId}`, quotaData, 30);

    return NextResponse.json(quotaData, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[quota] GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch quota' }, { status: 500 });
  }
}
