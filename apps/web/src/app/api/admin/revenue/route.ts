import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Price map (cents/month) — must match Stripe price config
const PLAN_PRICE_CENTS: Record<string, number> = {
  free:  0,
  plus:  500,
  pro:   1200,
  max:   2500,
};

// ---------------------------------------------------------------------------
// GET /api/admin/revenue
//
// Returns MRR estimate from active subscriptions.
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();

  // Active subscriptions (not expired)
  const subs = await prisma.subscription.findMany({
    where: {
      planId:          { not: 'free' },
      currentPeriodEnd: { gte: now },
    },
    select: { planId: true },
  });

  let mrr = 0;
  const byPlan: Record<string, { count: number; revenue: number }> = {};

  for (const sub of subs) {
    const price = PLAN_PRICE_CENTS[sub.planId] ?? 0;
    mrr += price;
    if (!byPlan[sub.planId]) byPlan[sub.planId] = { count: 0, revenue: 0 };
    byPlan[sub.planId].count   += 1;
    byPlan[sub.planId].revenue += price;
  }

  return NextResponse.json({
    mrr,
    activeSubscriptions: subs.length,
    byPlan,
    generatedAt: now.toISOString(),
  });
}
