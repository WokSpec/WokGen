import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org';

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   subscription.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    return NextResponse.json(
      { error: 'Billing service error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
