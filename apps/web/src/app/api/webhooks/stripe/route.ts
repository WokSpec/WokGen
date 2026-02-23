import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { sendBillingReceiptEmail, sendSubscriptionCanceledEmail } from '@/lib/email';
import type Stripe from 'stripe';

// Raw body required for Stripe signature verification
export const dynamic = 'force-dynamic';

/** Reverse-lookup: Stripe price ID → our plan ID */
function planIdFromPriceId(priceId: string): string | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId && plan.stripePriceId === priceId) return plan.id;
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;

        // --- Credit pack (one-time payment) ---
        if (s.mode === 'payment' && s.metadata?.type === 'credit_pack') {
          const userId  = s.metadata.userId;
          const credits = parseInt(s.metadata.credits ?? '0', 10);
          if (userId && credits > 0) {
            await prisma.user.update({
              where: { id: userId },
              data:  { hdTopUpCredits: { increment: credits } },
            });
          }
          break;
        }

        // --- Subscription checkout ---
        if (s.mode !== 'subscription') break;

        const userId = s.metadata?.userId;
        const planId = s.metadata?.planId;
        const stripeSubId = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id;

        if (!userId || !planId || !stripeSubId) break;

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as unknown as {
          current_period_end: number;
          current_period_start: number;
        };
        const periodStart = new Date(stripeSub.current_period_start * 1000);
        const periodEnd   = new Date(stripeSub.current_period_end   * 1000);

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            planId,
            status:              'active',
            stripeCustomerId:    typeof s.customer === 'string' ? s.customer : s.customer?.id,
            stripeSubscriptionId: stripeSubId,
            currentPeriodStart:  periodStart,
            currentPeriodEnd:    periodEnd,
          },
          update: {
            planId,
            status:              'active',
            stripeCustomerId:    typeof s.customer === 'string' ? s.customer : s.customer?.id,
            stripeSubscriptionId: stripeSubId,
            currentPeriodStart:  periodStart,
            currentPeriodEnd:    periodEnd,
          },
        });
        // Reset monthly HD usage counter for new subscription period
        await prisma.user.update({
          where: { id: userId },
          data:  { hdMonthlyUsed: 0 },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!existing) break;

        // Resolve planId from the active price ID (handles portal plan changes)
        const activePriceId = sub.items?.data?.[0]?.price?.id ?? null;
        const resolvedPlanId = activePriceId ? (planIdFromPriceId(activePriceId) ?? existing.planId) : existing.planId;

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planId:             resolvedPlanId,
            status:             sub.status,
            cancelAtPeriodEnd:  sub.cancel_at_period_end ?? false,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
          },
        });
        // Reset monthly HD usage on renewal
        if (existing.userId) {
          await prisma.user.update({
            where: { id: existing.userId },
            data:  { hdMonthlyUsed: 0 },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
          include: { user: true },
        });
        if (!existing) break;

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: 'canceled',
            planId: 'free',
          },
        });

        // Send cancellation email
        if (existing.user?.email && existing.currentPeriodEnd) {
          await sendSubscriptionCanceledEmail(
            existing.user.email,
            existing.currentPeriodEnd,
          ).catch(() => {});
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inv = event.data.object as any;
        const amountPaid: number = (inv.amount_paid ?? 0) / 100; // cents → dollars
        if (amountPaid <= 0) break; // skip $0 invoices (trials)
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        if (!customerId) break;
        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
          include: { user: true, plan: true },
        });
        if (sub?.user?.email) {
          await sendBillingReceiptEmail(
            sub.user.email,
            amountPaid,
            sub.plan?.name ?? undefined,
          ).catch(() => {});
        }
        break;
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subId: string | undefined =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subId) break;

        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (!existing) break;

        await prisma.subscription.update({
          where: { id: existing.id },
          data: { status: 'past_due' },
        });
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error('[stripe/webhook] Handler error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
