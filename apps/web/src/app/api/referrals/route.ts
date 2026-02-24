import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/referrals — return user's referral code + list
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const code = `ref_${userId.slice(0, 8)}`;
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, code: true, status: true, creditsAwarded: true, createdAt: true,
      referred: { select: { email: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    code,
    referralUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://wokgen.wokspec.org'}/?ref=${code}`,
    referrals,
    totalCreditsEarned: referrals.reduce((s, r) => s + r.creditsAwarded, 0),
  });
}

// POST /api/referrals — process referral code (call after new user signup completes)
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code.trim() : null;
  if (!code) return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });

  // Referrer is derived from code: ref_<first8chars>
  const referrerPartial = code.replace('ref_', '');
  const referrer = await prisma.user.findFirst({
    where: { id: { startsWith: referrerPartial } },
    select: { id: true },
  });
  if (!referrer || referrer.id === userId) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
  }

  // Idempotent — don't double-credit
  const existing = await prisma.referral.findUnique({ where: { referredUserId: userId } });
  if (existing) return NextResponse.json({ ok: true, alreadyCredited: true });

  await prisma.referral.create({
    data: {
      referrerId:     referrer.id,
      referredUserId: userId,
      code,
      status:         'credited',
      creditsAwarded: 5, // 5 HD credits for each successful referral
    },
  });

  return NextResponse.json({ ok: true });
}
