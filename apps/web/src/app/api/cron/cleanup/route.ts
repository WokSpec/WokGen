import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldGuestUsage } from '@/lib/quota';
import { prisma } from '@/lib/db';
import { log as logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET /api/cron/cleanup
//
// Purges expired guest usage rows from the database.
// Call this via Vercel Cron (vercel.json) or an external scheduler.
// Requires the CRON_SECRET env var to be set and passed as a Bearer token.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Clean up expired rate limit records
    await prisma.rateLimit.deleteMany({
      where: { reset_at: { lt: BigInt(Date.now()) } }
    }).catch(() => {}); // non-fatal

    // Clean up old guest usage records (older than 2 days)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const cutoffDate = twoDaysAgo.toISOString().slice(0, 10); // YYYY-MM-DD
    await prisma.guestUsage.deleteMany({
      where: { date: { lt: cutoffDate } }
    }).catch(() => {}); // non-fatal

    // Reset stuck running jobs (older than 5 minutes) to failed
    const stuckCutoff = new Date(Date.now() - 5 * 60_000);
    const { count: resetCount } = await prisma.job.updateMany({
      where: { status: 'running', createdAt: { lt: stuckCutoff } },
      data:  { status: 'failed', error: 'Generation timed out' },
    });

    const deleted = await cleanupOldGuestUsage();
    return NextResponse.json({ ok: true, deleted, resetStuck: resetCount });
  } catch (err) {
    logger.error({ err }, '[cron/cleanup] error');
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
