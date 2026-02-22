'use client';

import { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  priceUsdCents: number;
  creditsPerMonth: number;
}

interface CreditPack {
  id: string;
  name: string;
  priceUsd: number;
  credits: number;
}

interface Props {
  currentPlanId: string;
  stripeEnabled: boolean;
  plans: Plan[];
  hdCredits: { monthly: number; topUp: number };
  creditPacks: CreditPack[];
}

const CREDIT_PACKS: CreditPack[] = [
  { id: 'micro',  name: 'Micro',  priceUsd: 1,  credits: 30   },
  { id: 'small',  name: 'Small',  priceUsd: 3,  credits: 100  },
  { id: 'medium', name: 'Medium', priceUsd: 8,  credits: 400  },
  { id: 'large',  name: 'Large',  priceUsd: 20, credits: 1200 },
];

const PLAN_FEATURES: Record<string, string[]> = {
  free:  ['Unlimited standard (Pollinations)', 'FLUX model', 'Public gallery'],
  plus:  ['100 HD credits / month', 'Replicate FLUX.1-schnell', 'Unused credits roll into top-up'],
  pro:   ['500 HD credits / month', 'Replicate FLUX.1-schnell', 'Priority queue'],
  max:   ['2,000 HD credits / month', 'Replicate FLUX.1-schnell', 'Priority queue', 'Batch export'],
};

export default function BillingClient({
  currentPlanId,
  stripeEnabled,
  plans,
  hdCredits,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    setLoading(planId);
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyPack = async (packId: string) => {
    setLoading(`pack-${packId}`);
    try {
      const res  = await fetch('/api/billing/credits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleManage = async () => {
    setLoading('portal');
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Failed to open billing portal.');
    } finally {
      setLoading(null);
    }
  };

  const totalHd = hdCredits.monthly + hdCredits.topUp;

  return (
    <main className="billing-page">

      {/* HD Credit Balance */}
      {totalHd > 0 && (
        <div className="credits-banner">
          <span className="credits-label">HD Credits</span>
          <span className="credits-value">{hdCredits.monthly} monthly</span>
          {hdCredits.topUp > 0 && (
            <span className="credits-value">+ {hdCredits.topUp} top-up</span>
          )}
        </div>
      )}

      <div className="billing-header">
        <h1>Plans</h1>
        <p>Standard quality (Pollinations) is always free and unlimited. HD uses Replicate — subscribe or buy top-up credits.</p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPaid    = plan.priceUsdCents > 0;
          const features  = PLAN_FEATURES[plan.id] ?? [];

          return (
            <div key={plan.id} className={`plan-card ${isCurrent ? 'plan-card--current' : ''}`}>
              {isCurrent && <span className="plan-badge">Current</span>}
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price">
                {plan.priceUsdCents === 0
                  ? <span className="plan-price-free">Free</span>
                  : <>
                      <span className="plan-price-amount">${plan.priceUsdCents / 100}</span>
                      <span className="plan-price-period">/month</span>
                    </>
                }
              </div>
              <ul className="plan-features">
                {features.map((f) => <li key={f}>{f}</li>)}
              </ul>

              {!isCurrent && (
                <button
                  className="plan-cta"
                  onClick={isPaid ? () => handleUpgrade(plan.id) : undefined}
                  disabled={!stripeEnabled || loading === plan.id}
                >
                  {loading === plan.id ? 'Redirecting…' : isPaid ? 'Upgrade' : 'Downgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Credit Top-Up Packs */}
      <div className="section-header">
        <h2>HD Credit Top-Ups</h2>
        <p>One-time packs. Credits never expire. Used when monthly allocation runs out.</p>
      </div>

      <div className="packs-grid">
        {CREDIT_PACKS.map((pack) => (
          <div key={pack.id} className="pack-card">
            <div className="pack-name">{pack.name}</div>
            <div className="pack-credits">{pack.credits} HD credits</div>
            <div className="pack-price">${pack.priceUsd}</div>
            <button
              className="pack-cta"
              onClick={() => handleBuyPack(pack.id)}
              disabled={!stripeEnabled || loading === `pack-${pack.id}`}
            >
              {loading === `pack-${pack.id}` ? 'Redirecting…' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      {stripeEnabled && currentPlanId !== 'free' && (
        <div className="billing-manage">
          <button
            className="manage-btn"
            onClick={handleManage}
            disabled={loading === 'portal'}
          >
            {loading === 'portal' ? 'Opening…' : 'Manage billing →'}
          </button>
        </div>
      )}

      {!stripeEnabled && (
        <p className="billing-note">Billing is not yet configured.</p>
      )}

      <style jsx>{`
        .billing-page { max-width: 980px; margin: 0 auto; padding: 3rem 1.5rem; }
        .credits-banner {
          display: flex; gap: 1rem; align-items: center;
          background: rgba(167,139,250,.08);
          border: 1px solid rgba(167,139,250,.2);
          border-radius: 8px;
          padding: 0.75rem 1.25rem;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }
        .credits-label { font-weight: 600; color: #a78bfa; }
        .credits-value { color: var(--text-secondary, #888); }
        .billing-header { margin-bottom: 2rem; }
        .billing-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem; }
        .billing-header p { color: var(--text-secondary, #888); margin: 0; max-width: 560px; }
        .section-header { margin: 2.5rem 0 1.25rem; }
        .section-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.4rem; }
        .section-header p { color: var(--text-secondary, #888); margin: 0; font-size: 0.875rem; }
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; }
        .packs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
        .plan-card, .pack-card {
          background: var(--surface-card, #161616);
          border: 1px solid var(--border-subtle, #262626);
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          position: relative;
        }
        .plan-card--current { border-color: #a78bfa; }
        .plan-badge {
          position: absolute; top: 0.75rem; right: 0.75rem;
          font-size: 0.65rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          color: #a78bfa; background: rgba(167,139,250,.12);
          border: 1px solid rgba(167,139,250,.25); border-radius: 4px; padding: 2px 6px;
        }
        .plan-name { font-size: 1.05rem; font-weight: 600; margin: 0; }
        .plan-price { display: flex; align-items: baseline; gap: 0.2rem; }
        .plan-price-free { font-size: 1.4rem; font-weight: 700; }
        .plan-price-amount { font-size: 2rem; font-weight: 700; }
        .plan-price-period { color: var(--text-muted, #666); font-size: 0.85rem; }
        .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
        .plan-features li { font-size: 0.85rem; color: var(--text-secondary, #888); padding-left: 1.1rem; position: relative; }
        .plan-features li::before { content: '✓'; position: absolute; left: 0; color: #a78bfa; }
        .pack-name { font-weight: 600; font-size: 0.95rem; }
        .pack-credits { font-size: 0.875rem; color: var(--text-secondary, #888); flex: 1; }
        .pack-price { font-size: 1.4rem; font-weight: 700; }
        .plan-cta, .pack-cta {
          margin-top: auto; width: 100%; padding: 0.55rem 1rem;
          border-radius: 6px; background: #a78bfa; color: #fff;
          border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer;
        }
        .plan-cta:disabled, .pack-cta:disabled { opacity: 0.6; cursor: not-allowed; }
        .billing-manage { margin-top: 2rem; }
        .manage-btn {
          background: none; border: 1px solid var(--border-subtle, #262626);
          border-radius: 6px; color: var(--text-secondary, #888);
          padding: 0.5rem 1rem; font-size: 0.875rem; cursor: pointer;
        }
        .manage-btn:hover { border-color: #444; color: var(--text-primary, #f0f0f0); }
        .billing-note { color: var(--text-muted, #666); font-size: 0.85rem; margin-top: 2rem; }
      `}</style>
    </main>
  );
}
