import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, CREDIT_PACKS } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import type { CreditPackId } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { packId } = await req.json() as { packId: CreditPackId };
  const pack = CREDIT_PACKS[packId];
  if (!pack) {
    return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
  }
  if (!pack.stripePriceId) {
    return NextResponse.json({ error: 'Stripe price not configured for this pack' }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });

  let customerId = subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    user?.email ?? undefined,
      name:     user?.name  ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'payment',
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?credits_success=1`,
    cancel_url:  `${baseUrl}/billing`,
    allow_promotion_codes: true,
    metadata: {
      userId:  session.user.id,
      packId,
      credits: String(pack.credits),
      type:    'credit_pack',
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
