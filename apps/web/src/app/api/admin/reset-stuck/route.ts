import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

// ---------------------------------------------------------------------------
// POST /api/admin/reset-stuck
//
// Auth-gated to admin. Resets stuck running jobs (>5 min old) to failed.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  void req;
  const adminResult = await requireAdmin();
  if (isAdminResponse(adminResult)) return adminResult;

  const stuckCutoff = new Date(Date.now() - 5 * 60_000);
  const { count } = await prisma.job.updateMany({
    where: { status: 'running', createdAt: { lt: stuckCutoff } },
    data:  { status: 'failed', error: 'Generation timed out' },
  });

  return NextResponse.json({ ok: true, reset: count });
}
