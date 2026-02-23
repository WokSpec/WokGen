import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing — WokGen',
  description: 'Simple, transparent pricing. Free to start, affordable to scale. No feature gates — all tiers get everything.',
};

/* ── Data ────────────────────────────────────────────────────────────────── */

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Start creating. No card needed.',
    highlight: false,
    features: [
      '50 image generations/day',
      '3 SFX / 5 voice per day',
      '5 Eral AI voice sessions/day',
      '30 Eral chat messages/day',
      '3 projects',
      'Eral Director (1 plan/day)',
      'Brand kit (1)',
      'Community gallery',
      'All 8 studios',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$5',
    period: '/month',
    tagline: 'For regular creators who mean it.',
    highlight: false,
    features: [
      '200 standard generations/day',
      '50 HD (Replicate) credits/month',
      '20 SFX / 20 voice per day',
      'Unlimited Eral AI voice',
      'Priority routing (faster results)',
      'Unlimited projects',
      'Batch generation (×4)',
      'ElevenLabs HD voices',
      'Eral Director (20 plans/day)',
      'Brand kits (5)',
      'Style snapshots',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/month',
    tagline: 'Best value for power users.',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '500 standard generations/day',
      '150 HD credits/month',
      'Unlimited SFX + voice',
      'Voice cloning (1 voice)',
      'Batch generation (×16)',
      'API access',
      'Team (3 seats)',
      'Sprite atlas builder',
      'Eral Director (100 plans/day)',
      'Unlimited brand kits',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    price: '$25',
    period: '/month',
    tagline: 'Maximum output, minimum friction.',
    highlight: false,
    features: [
      'Unlimited standard generations',
      '500 HD credits/month',
      '5 custom voice clones',
      'Unlimited team seats',
      'Highest API rate limits',
      'Early access to new features',
      'Eral Director (unlimited)',
    ],
  },
] as const;

const FAQ = [
  {
    q: 'Is WokGen really free to use?',
    a: 'Yes. Standard quality generation (powered by Pollinations) is completely free — no account required. You get 50 generations per day with a free account.',
  },
  {
    q: 'What are HD credits?',
    a: 'HD credits unlock Replicate-powered high-resolution generation. Each HD generation costs 1 credit. Monthly credits reset on your billing date. Unused credits don\'t roll over, but top-up packs never expire.',
  },
  {
    q: 'Do paid tiers unlock features or just quantity?',
    a: 'Quantity only. All features — Eral AI, Director, Brand Kits, Projects, all 8 studios — are available on every tier. Paid tiers give you more generations, more HD credits, and higher limits.',
  },
  {
    q: 'Can I self-host WokGen?',
    a: 'Yes. WokGen is MIT licensed and fully open source on GitHub. Self-hosting bypasses all quota and billing — bring your own API keys.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Cancel from your billing portal — you\'ll keep your plan until the end of the billing period.',
  },
];

/* ── Component ───────────────────────────────────────────────────────────── */

export default function PricingPage() {
  return (
    <main className="pricing-page">

      {/* Header */}
      <section className="pricing-header">
        <p className="pricing-eyebrow">Simple, transparent pricing</p>
        <h1 className="pricing-h1">
          All features, every tier.
          <span className="pricing-h1-accent"> Pay for quantity.</span>
        </h1>
        <p className="pricing-sub">
          Standard generation is always free. Paid tiers unlock more capacity, HD generation, and
          team features — not different features.
        </p>
      </section>

      {/* Plans grid */}
      <section className="pricing-plans-section">
        <div className="pricing-plans-inner">
          <div className="pricing-plans-grid">
            {PLANS.map(plan => (
              <div key={plan.id} className={`pricing-plan-card ${plan.highlight ? 'pricing-plan-card--highlight' : ''}`}>
                {'badge' in plan && plan.badge && (
                  <span className="pricing-plan-badge">{plan.badge}</span>
                )}
                <div className="pricing-plan-head">
                  <p className="pricing-plan-name">{plan.name}</p>
                  <div className="pricing-plan-price-row">
                    <span className="pricing-plan-price">{plan.price}</span>
                    <span className="pricing-plan-period">{plan.period}</span>
                  </div>
                  <p className="pricing-plan-tagline">{plan.tagline}</p>
                </div>
                <ul className="pricing-plan-features">
                  {plan.features.map(f => (
                    <li key={f} className="pricing-plan-feature">
                      <span className="pricing-plan-check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="pricing-plan-cta">
                  {plan.id === 'free' ? (
                    <Link href="/pixel/studio" className={`pricing-cta-btn pricing-cta-btn--${plan.highlight ? 'primary' : 'default'}`}>
                      Start for Free →
                    </Link>
                  ) : (
                    <Link href={`/billing?plan=${plan.id}`} className={`pricing-cta-btn pricing-cta-btn--${plan.highlight ? 'primary' : 'default'}`}>
                      Get {plan.name} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="pricing-plans-note">
            All prices in USD. Subscriptions renew monthly. Cancel anytime from your billing portal.
          </p>
        </div>
      </section>

      {/* Credit packs callout */}
      <section className="pricing-packs-callout">
        <div className="pricing-section-inner">
          <h2 className="pricing-section-title">Need more HD credits?</h2>
          <p className="pricing-section-sub">
            One-time top-up packs. Credits never expire and stack with your monthly allocation.
          </p>
          <div className="pricing-packs-row">
            {[
              { label: 'Micro',  price: '$1',  credits: 30   },
              { label: 'Small',  price: '$3',  credits: 100  },
              { label: 'Medium', price: '$8',  credits: 400  },
              { label: 'Large',  price: '$20', credits: 1200, note: 'Best value' },
            ].map(p => (
              <div key={p.label} className={`pricing-pack ${p.note ? 'pricing-pack--featured' : ''}`}>
                {'note' in p && p.note && <span className="pricing-pack-note">{p.note}</span>}
                <p className="pricing-pack-label">{p.label}</p>
                <p className="pricing-pack-price">{p.price}</p>
                <p className="pricing-pack-credits">{p.credits.toLocaleString()} HD credits</p>
                <Link href="/billing" className="pricing-pack-btn">Buy →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-faq">
        <div className="pricing-section-inner">
          <h2 className="pricing-section-title">FAQ</h2>
          <div className="pricing-faq-list">
            {FAQ.map(item => (
              <details key={item.q} className="pricing-faq-item">
                <summary className="pricing-faq-q">{item.q}</summary>
                <p className="pricing-faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pricing-bottom-cta">
        <div className="pricing-section-inner" style={{ textAlign: 'center' }}>
          <h2 className="pricing-bottom-title">Start free. Upgrade when you&apos;re ready.</h2>
          <p className="pricing-bottom-sub">No credit card. No feature gates. Just generation.</p>
          <div className="pricing-bottom-actions">
            <Link href="/pixel/studio" className="btn-primary btn-lg">Open Studio →</Link>
            <Link href="/billing" className="btn-ghost btn-lg">See plans</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
