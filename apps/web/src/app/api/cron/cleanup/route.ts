import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldGuestUsage } from '@/lib/quota';

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
    const deleted = await cleanupOldGuestUsage();
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error('[cron/cleanup] error:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
