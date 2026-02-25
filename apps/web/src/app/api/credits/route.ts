import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';

/**
 * GET /api/credits
 *
 * Returns the authenticated user's full credit balance + plan info.
 * Used by the account dashboard and studio credit widget.
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.subscription.findUnique({
      where:   { userId: session.user.id },
      include: { plan: true },
    }),
  ]);

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
});
