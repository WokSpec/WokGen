import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// POST /api/admin/reset-stuck
//
// Auth-gated to ADMIN_EMAIL. Resets stuck running jobs (>5 min old) to failed.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  void req;
  const session = await auth();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stuckCutoff = new Date(Date.now() - 5 * 60_000);
  const { count } = await prisma.job.updateMany({
    where: { status: 'running', createdAt: { lt: stuckCutoff } },
    data:  { status: 'failed', error: 'Generation timed out' },
  });

  return NextResponse.json({ ok: true, reset: count });
}
