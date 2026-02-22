import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { planId } = await req.json();
  const plan = PLANS[planId as keyof typeof PLANS];
  if (!plan || plan.priceUsdCents === 0) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
  if (!plan.stripePriceId) {
    return NextResponse.json({ error: 'Stripe price not configured for this plan' }, { status: 503 });
  }

  // Get or create Stripe customer
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });

  let customerId = subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name:  user?.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?success=1`,
    cancel_url:  `${baseUrl}/billing`,
    metadata:   { userId: session.user.id, planId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
