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

// ─── Plan display config ──────────────────────────────────────────────────────

const PLAN_META: Record<string, {
  tagline: string;
  badge?: string;
  features: string[];
  perCredit?: string;
}> = {
  free: {
    tagline: 'Start creating. No card needed.',
    features: [
      'Unlimited standard generation',
      'Pollinations FLUX model',
      'Public gallery access',
      'Guest or signed-in',
    ],
  },
  plus: {
    tagline: 'For regular creators.',
    features: [
      '100 HD credits / month',
      'Replicate FLUX.1-schnell',
      'Saved generation history',
      'Unused credits roll to top-up',
      'Everything in Free',
    ],
    perCredit: '$0.02',
  },
  pro: {
    tagline: 'Best value for power users.',
    badge: 'Most Popular',
    features: [
      '500 HD credits / month',
      'Replicate FLUX.1-schnell',
      'Priority generation queue',
      'Saved generation history',
      'Everything in Plus',
    ],
    perCredit: '$0.012',
  },
  max: {
    tagline: 'Maximum output, lowest cost.',
    features: [
      '2,000 HD credits / month',
      'Replicate FLUX.1-schnell',
      'Bulk export',
      'Priority generation queue',
      'Everything in Pro',
    ],
    perCredit: '$0.0075',
  },
};

// ─── Credit packs ─────────────────────────────────────────────────────────────

const PACKS = [
  { id: 'micro',  label: 'Micro',  price: '$1',  credits: 30,    perCredit: '$0.033', note: '' },
  { id: 'small',  label: 'Small',  price: '$3',  credits: 100,   perCredit: '$0.03',  note: '' },
  { id: 'medium', label: 'Medium', price: '$8',  credits: 400,   perCredit: '$0.02',  note: '' },
  { id: 'large',  label: 'Large',  price: '$20', credits: 1200,  perCredit: '$0.017', note: 'Best value' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingClient({ currentPlanId, stripeEnabled, plans, hdCredits }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast]     = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = searchParams.get('success');
    const creditsSuccess = searchParams.get('credits_success');
    if (success === '1') {
      setToast('Subscription activated! Your credits are ready.');
      router.replace('/billing');
    } else if (creditsSuccess === '1') {
      setToast('Credits added to your account!');
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
      else alert(data.error ?? 'Checkout failed.');
    } catch { alert('Failed to start checkout. Please try again.'); }
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
      else alert(data.error ?? 'Checkout failed.');
    } catch { alert('Failed to start checkout. Please try again.'); }
    finally { setLoading(null); }
  };

  const handleManage = async () => {
    setLoading('portal');
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert('Failed to open billing portal.'); }
    finally { setLoading(null); }
  };

  const totalHd = hdCredits.monthly + hdCredits.topUp;

  // Sort plans by price
  const sortedPlans = [...plans].sort((a, b) => a.priceUsdCents - b.priceUsdCents);

  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* ── Success toast ─────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.3)',
          borderRadius: 4, padding: '0.75rem 1rem', marginBottom: '1.5rem',
          fontSize: '0.875rem', color: '#c4b5fd',
        }}>
          <span>✓ {toast}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            aria-label="Dismiss"
          >×</button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
          Plans & Credits
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 540 }}>
          Standard quality (Pollinations) is always free — no account needed.
          HD uses Replicate — subscribe for monthly credits, or buy a one-time pack.
        </p>
      </div>

      {/* ── HD Credit balance ────────────────────────────────────────── */}
      {totalHd > 0 && (
        <div style={{
          display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap',
          background: 'rgba(167,139,250,.07)', border: '1px solid rgba(167,139,250,.2)',
          borderRadius: 4, padding: '0.85rem 1.25rem', marginBottom: '2rem',
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa' }}>HD Credits</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{hdCredits.monthly}</strong> monthly remaining
          </span>
          {hdCredits.topUp > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{hdCredits.topUp}</strong> top-up bank
            </span>
          )}
        </div>
      )}

      {/* ── Plans grid ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '3rem' }}>
        {sortedPlans.map((plan) => {
          const meta      = PLAN_META[plan.id] ?? { tagline: '', features: [] };
          const isCurrent = plan.id === currentPlanId;
          const isPopular = meta.badge === 'Most Popular';
          const isPaid    = plan.priceUsdCents > 0;
          const isDowngrade = isPaid && plans.find(p => p.id === currentPlanId)?.priceUsdCents > plan.priceUsdCents;

          return (
            <div key={plan.id} style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${isCurrent ? 'rgba(167,139,250,.5)' : isPopular ? 'rgba(167,139,250,.25)' : 'var(--border)'}`,
              borderRadius: 4,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              position: 'relative',
            }}>

              {/* Badges */}
              {isCurrent && (
                <span style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: '#a78bfa', background: 'rgba(167,139,250,.15)',
                  border: '1px solid rgba(167,139,250,.3)', borderRadius: 2, padding: '2px 7px',
                }}>Current</span>
              )}
              {isPopular && !isCurrent && (
                <span style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: '#a78bfa', background: 'rgba(167,139,250,.12)',
                  border: '1px solid rgba(167,139,250,.25)', borderRadius: 2, padding: '2px 7px',
                }}>Popular</span>
              )}

              {/* Plan name */}
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>
                  {plan.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                    {plan.priceUsdCents === 0 ? '$0' : `$${plan.priceUsdCents / 100}`}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                    {plan.priceUsdCents === 0 ? 'forever' : '/month'}
                  </span>
                </div>
                {meta.perCredit && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.2rem' }}>
                    {meta.perCredit}/HD credit
                  </p>
                )}
              </div>

              {/* Tagline */}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {meta.tagline}
              </p>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                {meta.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ color: '#a78bfa', flexShrink: 0, marginTop: '0.05rem' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                {isCurrent ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)', textAlign: 'center', padding: '0.55rem 0' }}>
                    Your current plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!stripeEnabled || !!loading}
                    style={{
                      width: '100%', padding: '0.6rem 1rem',
                      borderRadius: 4,
                      background: isPopular ? 'linear-gradient(135deg, #6d28d9, #7c3aed)' : 'transparent',
                      border: isPopular ? 'none' : '1px solid var(--border)',
                      color: isPopular ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
                      opacity: (!stripeEnabled || !!loading) ? 0.5 : 1,
                      transition: 'opacity 0.15s, background 0.15s',
                    }}
                  >
                    {loading === plan.id ? 'Redirecting…' : isDowngrade ? 'Downgrade' : plan.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Credit packs ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
            HD Credit Top-Ups
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            One-time purchase. Credits never expire. Used after your monthly allocation runs out.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {PACKS.map(pack => (
            <div key={pack.id} style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${pack.note ? 'rgba(167,139,250,.25)' : 'var(--border)'}`,
              borderRadius: 4, padding: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative',
            }}>
              {pack.note && (
                <span style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: '#a78bfa', background: 'rgba(167,139,250,.12)',
                  border: '1px solid rgba(167,139,250,.25)', borderRadius: 2, padding: '1px 5px',
                }}>{pack.note}</span>
              )}
              <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                {pack.label}
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', margin: 0, lineHeight: 1 }}>
                {pack.price}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {pack.credits.toLocaleString()} HD credits
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', margin: 0 }}>
                {pack.perCredit}/credit
              </p>
              <button
                onClick={() => handleBuyPack(pack.id)}
                disabled={!stripeEnabled || !!loading}
                style={{
                  marginTop: '0.25rem', width: '100%', padding: '0.5rem 0.75rem',
                  borderRadius: 4, background: 'transparent',
                  border: '1px solid var(--border)', color: 'var(--text-muted)',
                  fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                  opacity: (!stripeEnabled || !!loading) ? 0.5 : 1,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
              >
                {loading === `pack-${pack.id}` ? 'Redirecting…' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Manage / notes ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', margin: 0 }}>
          Prices in USD. Subscriptions renew monthly. Cancel anytime.{' '}
          <Link href="/docs#pricing" style={{ color: '#a78bfa', textDecoration: 'none' }}>Learn more →</Link>
        </p>
        {stripeEnabled && currentPlanId !== 'free' && (
          <button
            onClick={handleManage}
            disabled={loading === 'portal'}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 4,
              color: 'var(--text-muted)', padding: '0.45rem 0.9rem', fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {loading === 'portal' ? 'Opening…' : 'Manage billing →'}
          </button>
        )}
        {!stripeEnabled && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
            Billing not configured — contact admin.
          </span>
        )}
      </div>

    </main>
  );
}
