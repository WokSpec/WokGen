import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

/**
 * GET /api/credits
 *
 * Returns the authenticated user's full credit balance + plan info.
 * Used by the account dashboard and studio credit widget.
 */
export async function GET() {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return API_ERRORS.UNAUTHORIZED();
  }

  const [user, subscription] = await dbQuery(Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.subscription.findUnique({
      where:   { userId: session.user.id },
      include: { plan: true },
    }),
  ]));

  const plan             = subscription?.plan;
  const monthlyAlloc     = plan?.creditsPerMonth ?? 0;
  const monthlyUsed      = user?.hdMonthlyUsed   ?? 0;
  const monthlyRemaining = Math.max(0, monthlyAlloc - monthlyUsed);
  const topUpCredits     = user?.hdTopUpCredits   ?? 0;

  return NextResponse.json({
    planId:            plan?.id             ?? 'free',
    planName:          plan?.name           ?? 'Free',
    monthlyAlloc,
    monthlyUsed,
    monthlyRemaining,
    topUpCredits,
    totalAvailable:    monthlyRemaining + topUpCredits,
    periodEnd:         subscription?.currentPeriodEnd?.toISOString() ?? null,
    stripeCustomerId:  subscription?.stripeCustomerId ?? null,
  });
  } catch (err) {
    log.error({ err }, 'GET /api/credits failed');
    return API_ERRORS.INTERNAL();
  }
}
