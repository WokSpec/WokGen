'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  priceUsdCents: number;
  creditsPerMonth: number;
}

interface Props {
  currentPlanId: string;
  stripeEnabled: boolean;
  plans: Plan[];
  hdCredits: { monthly: number; topUp: number };
  creditPacks: unknown[];
}

/* ── Plan meta ───────────────────────────────────────────────────────────── */

const PLAN_META: Record<string, {
  tagline: string;
  badge?: string;
  features: string[];
  perCredit?: string;
}> = {
  free: {
    tagline: 'Start creating. No card needed.',
    features: [
      '50 image generations/day',
      '3 sound effects/day',
      '5 voice generations/day (1,000 char limit)',
      '5 Eral voice conversations/day',
      '30 Eral messages/day',
      '3 projects',
      'Community gallery access',
      'Color palette extraction',
      'QR code generator',
      'Background remover (3/day)',
      'Eral Director (1 plan/day)',
      'Brand kit (1)',
    ],
  },
  plus: {
    tagline: 'For regular creators who mean it.',
    features: [
      '200 standard generations/day',
      '50 HD credits/month',
      '20 sound effects/day',
      '20 voice generations/day (3,000 char)',
      'Unlimited Eral voice',
      'Priority provider routing',
      'Unlimited projects',
      'Batch ×4 variants',
      'ElevenLabs HD voices',
      'Style snapshots',
      'Eral Director (20 plans/day)',
      'Brand kits (5)',
    ],
    perCredit: '$0.02',
  },
  pro: {
    tagline: 'Best value for power users.',
    badge: 'Most Popular',
    features: [
      'Everything in Plus',
      '500 standard generations/day',
      '150 HD credits/month',
      'Unlimited sound effects',
      'Unlimited voice (10,000 char)',
      'Voice cloning (1 custom voice)',
      'Batch ×16 variants',
      'API access',
      'Team (3 seats)',
      'Sprite atlas builder',
      'Eral Director (100 plans/day)',
      'Unlimited brand kits',
    ],
    perCredit: '$0.012',
  },
  max: {
    tagline: 'Maximum output, minimum friction.',
    features: [
      'Everything in Pro',
      'Unlimited standard generations',
      '500 HD credits/month',
      '5 custom voices (cloning)',
      'Unlimited team seats',
      'Highest API rate limits',
      'Early access to new features',
      'Eral Director (unlimited)',
    ],
    perCredit: '$0.0075',
  },
};

/* ── Credit packs ────────────────────────────────────────────────────────── */

const PACKS = [
  { id: 'micro',  label: 'Micro',  price: '$1',  credits: 30,   perCredit: '$0.033', note: '' },
  { id: 'small',  label: 'Small',  price: '$3',  credits: 100,  perCredit: '$0.030', note: '' },
  { id: 'medium', label: 'Medium', price: '$8',  credits: 400,  perCredit: '$0.020', note: '' },
  { id: 'large',  label: 'Large',  price: '$20', credits: 1200, perCredit: '$0.017', note: 'Best value' },
] as const;

/* ── Component ───────────────────────────────────────────────────────────── */

export default function BillingClient({ currentPlanId, stripeEnabled, plans, hdCredits }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const searchParams = useSearchParams();
  const router       = useRouter();
  const highlightPlan = searchParams.get('plan') ?? null;

  useEffect(() => {
    const success        = searchParams.get('success');
    const creditsSuccess = searchParams.get('credits_success');
    if (success === '1') {
      setToast({ msg: 'Subscription activated! Your credits are ready.', type: 'success' });
      router.replace('/billing');
    } else if (creditsSuccess === '1') {
      setToast({ msg: 'Credits added to your account!', type: 'success' });
      router.replace('/billing');
    }
  }, [searchParams, router]);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlanId) return;
    setLoading(planId);
    try {
      const res  = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setToast({ msg: data.error ?? 'Checkout failed. Please try again.', type: 'error' });
    } catch { setToast({ msg: 'Network error. Please try again.', type: 'error' }); }
    finally { setLoading(null); }
  };

  const handleBuyPack = async (packId: string) => {
    setLoading(`pack-${packId}`);
    try {
      const res  = await fetch('/api/billing/credits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setToast({ msg: data.error ?? 'Checkout failed. Please try again.', type: 'error' });
    } catch { setToast({ msg: 'Network error. Please try again.', type: 'error' }); }
    finally { setLoading(null); }
  };

  const handleManage = async () => {
    setLoading('portal');
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setToast({ msg: data.error ?? 'Could not open billing portal.', type: 'error' });
    } catch { setToast({ msg: 'Network error. Please try again.', type: 'error' }); }
    finally { setLoading(null); }
  };

  const totalHd     = hdCredits.monthly + hdCredits.topUp;
  const sortedPlans = [...plans].sort((a, b) => a.priceUsdCents - b.priceUsdCents);

  return (
    <main className="billing-page">

      {/* Toast */}
      {toast && (
        <div className={`billing-toast billing-toast--${toast.type}`}>
          <span>{toast.type === 'error' ? '! ' : '✓ '}{toast.msg}</span>
          <button className="billing-toast__dismiss" onClick={() => setToast(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Stripe unavailable */}
      {!stripeEnabled && (
        <div className="billing-banner--warn">
          <span>!</span>
          <span>Billing is not configured on this deployment. Standard generation is still free and unlimited.</span>
        </div>
      )}

      {/* Header */}
      <div className="billing-header">
        <h1 className="billing-header__title">Plans &amp; Credits</h1>
        <p className="billing-header__sub">
          Standard quality (Pollinations) is always free — no account needed.
          HD uses Replicate — subscribe for monthly credits, or buy a one-time pack.
        </p>
      </div>

      {/* HD credit bar */}
      {totalHd > 0 && (
        <div className="billing-hd-bar">
          <span className="billing-hd-bar__label">HD Credits</span>
          <span className="billing-hd-bar__stat">
            <strong>{hdCredits.monthly}</strong> monthly remaining
          </span>
          {hdCredits.topUp > 0 && (
            <span className="billing-hd-bar__stat">
              <strong>{hdCredits.topUp}</strong> top-up bank
            </span>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="billing-plans-grid">
        {sortedPlans.map((plan) => {
          const meta        = PLAN_META[plan.id] ?? { tagline: '', features: [] };
          const isCurrent   = plan.id === currentPlanId;
          const isPopular   = meta.badge === 'Most Popular';
          const isHighlight = plan.id === highlightPlan && !isCurrent;
          const isPaid      = plan.priceUsdCents > 0;
          const isDowngrade = isPaid && (plans.find(p => p.id === currentPlanId)?.priceUsdCents ?? 0) > plan.priceUsdCents;

          let cardClass = 'billing-plan-card';
          if (isCurrent)   cardClass += ' billing-plan-card--current';
          else if (isHighlight) cardClass += ' billing-plan-card--highlight';
          else if (isPopular)   cardClass += ' billing-plan-card--popular';

          return (
            <div key={plan.id} className={cardClass}>

              {/* Badges */}
              {isCurrent && <span className="billing-plan-badge">Current</span>}
              {isPopular && !isCurrent && <span className="billing-plan-badge">Popular</span>}

              {/* Pricing */}
              <div>
                <p className="billing-plan-name">{plan.name}</p>
                <div className="billing-plan-price-row">
                  <span className="billing-plan-price">
                    {plan.priceUsdCents === 0 ? '$0' : `$${plan.priceUsdCents / 100}`}
                  </span>
                  <span className="billing-plan-period">
                    {plan.priceUsdCents === 0 ? 'forever' : '/month'}
                  </span>
                </div>
                {meta.perCredit && (
                  <p className="billing-plan-per-credit">{meta.perCredit}/HD credit</p>
                )}
              </div>

              {/* Tagline */}
              <p className="billing-plan-tagline">{meta.tagline}</p>

              {/* Features */}
              <ul className="billing-plan-features">
                {meta.features.map(f => (
                  <li key={f} className="billing-plan-feature">
                    <span className="billing-plan-feature__check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="billing-plan-cta">
                {isCurrent ? (
                  <p className="billing-plan-current-text">Your current plan</p>
                ) : (
                  <button
                    className={`billing-plan-btn ${isPopular ? 'billing-plan-btn--popular' : 'billing-plan-btn--default'}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!stripeEnabled || !!loading}
                  >
                    {loading === plan.id
                      ? 'Redirecting…'
                      : isDowngrade
                        ? 'Downgrade'
                        : plan.id === 'free'
                          ? 'Downgrade to Free'
                          : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit packs */}
      <div className="billing-packs-section">
        <div className="billing-packs-header">
          <h2 className="billing-packs-title">HD Credit Top-Ups</h2>
          <p className="billing-packs-sub">
            One-time purchase. Credits never expire. Used after your monthly allocation runs out.
          </p>
        </div>

        <div className="billing-packs-grid">
          {PACKS.map(pack => (
            <div key={pack.id} className={`billing-pack-card ${pack.note ? 'billing-pack-card--featured' : ''}`}>
              {pack.note && <span className="billing-pack-badge">{pack.note}</span>}
              <p className="billing-pack-name">{pack.label}</p>
              <p className="billing-pack-price">{pack.price}</p>
              <p className="billing-pack-credits">{pack.credits.toLocaleString()} HD credits</p>
              <p className="billing-pack-per">{pack.perCredit}/credit</p>
              <button
                className="billing-pack-btn"
                onClick={() => handleBuyPack(pack.id)}
                disabled={!stripeEnabled || !!loading}
              >
                {loading === `pack-${pack.id}` ? 'Redirecting…' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="billing-footer">
        <p className="billing-footer__note">
          Prices in USD. Subscriptions renew monthly. Cancel anytime.{' '}
          <Link href="/docs#pricing">Learn more →</Link>
        </p>
        {stripeEnabled && currentPlanId !== 'free' && (
          <button className="billing-manage-btn" onClick={handleManage} disabled={loading === 'portal'}>
            {loading === 'portal' ? 'Opening…' : 'Manage billing →'}
          </button>
        )}
        {!stripeEnabled && (
          <span className="billing-footer__note">Billing not configured — contact admin.</span>
        )}
      </div>

    </main>
  );
}
