/**
 * GET /api/v1/me
 * WokSDK v1 — returns user info for the authenticated API key owner.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiUser = await authenticateApiKey(req);
  if (!apiUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: apiUser.userId },
    select: {
      id: true,
      name: true,
      email: true,
      subscription: { select: { planId: true, status: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const planId = user.subscription?.planId ?? 'free';

  return NextResponse.json({
    id:    user.id,
    name:  user.name ?? '',
    email: user.email ?? '',
    plan:  planId,
    usage: {
      creditsUsed:        0,
      creditsLimit:       planId === 'free' ? 50 : 1000,
      generationsToday:   0,
    },
  });
}
