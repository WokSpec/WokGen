import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { Suspense } from 'react';
import BillingClient from './_client';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/billing');

  const [subscription, user] = await Promise.all([
    prisma.subscription.findUnique({
      where:   { userId: session.user.id },
      include: { plan: true },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  const currentPlanId       = subscription?.planId ?? 'free';
  const stripeEnabled       = !!stripe;
  const monthlyAllocation   = subscription?.plan?.creditsPerMonth ?? 0;
  const monthlyUsed         = user?.hdMonthlyUsed ?? 0;
  const monthlyRemaining    = Math.max(0, monthlyAllocation - monthlyUsed);
  const topUpCredits        = user?.hdTopUpCredits ?? 0;

  return (
    <Suspense>
      <BillingClient
        currentPlanId={currentPlanId}
        stripeEnabled={stripeEnabled}
        plans={Object.values(PLANS)}
        hdCredits={{ monthly: monthlyRemaining, topUp: topUpCredits }}
        creditPacks={[]}
      />
    </Suspense>
  );
}
