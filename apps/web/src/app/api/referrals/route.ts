import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/referrals — return user's referral code + list
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return API_ERRORS.UNAUTHORIZED();

    const code = `ref_${userId.slice(0, 8)}`;
    const referrals = await dbQuery(prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, code: true, status: true, creditsAwarded: true, createdAt: true,
        referred: { select: { email: true, createdAt: true } },
      },
    }));

    return NextResponse.json({
      code,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://wokgen.wokspec.org'}/?ref=${code}`,
      referrals,
      totalCreditsEarned: referrals.reduce((s, r) => s + r.creditsAwarded, 0),
    });
  } catch (err) {
    log.error({ err }, 'GET /api/referrals failed');
    return API_ERRORS.INTERNAL();
  }
}

// POST /api/referrals — process referral code (call after new user signup completes)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return API_ERRORS.UNAUTHORIZED();

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }
    const body = rawBody as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : null;
    if (!code) return API_ERRORS.BAD_REQUEST('Missing referral code');

    // Referrer is derived from code: ref_<first8chars>
    const referrerPartial = code.replace('ref_', '');
    const referrer = await dbQuery(prisma.user.findFirst({
      where: { id: { startsWith: referrerPartial } },
      select: { id: true },
    }));
    if (!referrer || referrer.id === userId) {
      return API_ERRORS.BAD_REQUEST('Invalid referral code');
    }

    // Idempotent — don't double-credit
    const existing = await dbQuery(prisma.referral.findUnique({ where: { referredUserId: userId } }));
    if (existing) return NextResponse.json({ ok: true, alreadyCredited: true });

    await dbQuery(prisma.referral.create({
      data: {
        referrerId:     referrer.id,
        referredUserId: userId,
        code,
        status:         'credited',
        creditsAwarded: 5, // 5 HD credits for each successful referral
      },
    }));

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'POST /api/referrals failed');
    return API_ERRORS.INTERNAL();
  }
}
