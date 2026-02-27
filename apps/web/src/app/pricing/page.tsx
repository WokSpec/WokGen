import type { Metadata } from 'next';
import Link from 'next/link';
import ProWaitlistForm from './_waitlist-form';

export const metadata: Metadata = {
  title: 'Pricing — WokGen',
  description:
    'WokGen is free. Forever. No subscriptions, no feature gates, no paywalls. ' +
    'Powered entirely by open-source models and sustained by the community.',
};

/* ── Open-source model data ──────────────────────────────────────────────── */

const MODELS = [
  {
    name: 'FLUX.1-schnell',
    org: 'Black Forest Labs',
    license: 'Apache 2.0',
    type: 'Image generation',
  },
  {
    name: 'Stable Diffusion',
    org: 'Stability AI',
    license: 'CreativeML',
    type: 'Image generation',
  },
  {
    name: 'Deliberate',
    org: 'XpucT',
    license: 'CreativeML',
    type: 'Image generation',
  },
  {
    name: 'DreamShaper',
    org: 'Lykon',
    license: 'CreativeML',
    type: 'Image generation',
  },
  {
    name: 'SDXL 1.0',
    org: 'Stability AI',
    license: 'CreativeML',
    type: 'Image generation',
  },
  {
    name: 'Llama 3.3 70B',
    org: 'Meta',
    license: 'Llama License',
    type: 'Language model',
  },
  {
    name: 'Kokoro-82M',
    org: 'hexgrad',
    license: 'Apache 2.0',
    type: 'Text-to-speech',
  },
  {
    name: 'Stable Horde',
    org: 'crowdsourced GPUs',
    license: 'AGPL',
    type: 'Distributed inference',
  },
] as const;

/* ── Tier data ───────────────────────────────────────────────────────────── */

const FREE_FEATURES = [
  '100 generations / day',
  'Standard quality',
  'Up to 10 projects',
  'All creative tools',
  'Eral 7c (10 msgs/hr)',
  'Public gallery',
  'Community support',
  'API access (WokAPI)',
];

const PRO_FEATURES = [
  'Unlimited generations',
  'HD quality (unlimited)',
  'Unlimited projects',
  'All tools + early access',
  'Eral 7c (unlimited)',
  'Private workspace',
  'Priority support',
  'Higher API rate limits',
];

const ENTERPRISE_FEATURES = [
  'Everything in Pro',
  'Dedicated infrastructure',
  'SSO + audit logs',
  'Custom model fine-tuning',
  'Priority Eral 7c',
  'White-label option',
  'SLA guarantees',
  'Dedicated account manager',
];

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function PricingPage() {
  return (
    <main className="manifesto-page">

      {/* Hero */}
      <section className="pricing-header">
        <p className="pricing-eyebrow">Open Source · Free Forever</p>
        <h1 className="pricing-h1">
          WokGen is free.{' '}
          <span className="pricing-h1-accent">Forever.</span>
        </h1>
        <p className="pricing-sub">
          No subscriptions. No feature gates. No paywalls.
        </p>
      </section>

      {/* Tier comparison */}
      <section style={{ maxWidth: '1060px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* FREE */}
          <div style={{
            border: '2px solid rgba(var(--accent-rgb, 129,140,248), 0.4)',
            borderRadius: '14px',
            padding: '1.75rem',
            background: 'rgba(var(--accent-rgb, 129,140,248), 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>FREE</span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '99px', background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 600 }}>Forever</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>$0<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}> / mo</span></div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>The full WokGen experience. Always free, no credit card required.</p>
            </div>
            <Link href="/studio" className="btn-primary" style={{ textAlign: 'center' }}>
              Start creating →
            </Link>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {FREE_FEATURES.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.05rem' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div style={{
            border: '2px solid var(--blue)',
            borderRadius: '14px',
            padding: '1.75rem',
            background: 'var(--surface-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-raised)', border: '1px solid var(--blue)', borderRadius: '99px', padding: '0.2rem 0.875rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--blue)', whiteSpace: 'nowrap' }}>
              Coming Soon
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue)' }}>PRO</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-muted)' }}>TBD<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}> / mo</span></div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Power-user features with unlimited generation and private workspace.</p>
            </div>
            <ProWaitlistForm />
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {PRO_FEATURES.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--blue)', flexShrink: 0, marginTop: '0.05rem' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* ENTERPRISE */}
          <div style={{
            border: '2px solid var(--green)',
            borderRadius: '14px',
            padding: '1.75rem',
            background: 'var(--surface-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>ENTERPRISE</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>Custom</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Dedicated infrastructure, SSO, audit logs, and white-label options for teams.</p>
            </div>
            <a
              href="mailto:enterprise@wokspec.ai?subject=WokGen%20Enterprise%20Inquiry"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--green)',
                color: 'var(--green)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textDecoration: 'none',
                background: 'var(--success-bg)',
              }}
            >
              Contact us →
            </a>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {ENTERPRISE_FEATURES.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: '0.05rem' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* Models */}
      <section className="manifesto-models-section">
        <div className="manifesto-models-inner">
          <p className="manifesto-models-label">Powered entirely by open-source models</p>
          <div className="manifesto-models-grid">
            {MODELS.map((m) => (
              <div key={m.name} className="manifesto-model-card">
                <div className="manifesto-model-name">{m.name}</div>
                <div className="manifesto-model-org">{m.org} · {m.type}</div>
                <span className="manifesto-model-license">{m.license}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/open-source" className="btn-ghost">
              View full model registry →
            </Link>
          </div>
        </div>
      </section>

      {/* Community section */}
      <section className="manifesto-section">
        <div className="manifesto-section-inner">
          <p className="pricing-eyebrow">Sustained by the community</p>
          <h2 className="manifesto-section-h2">
            No investors. No ads. Just you.
          </h2>
          <p className="manifesto-section-desc">
            WokGen is open-source and community-funded. Server costs and model hosting are covered
            entirely through voluntary crypto donations from people who find WokGen useful.
            The core product is and always will be free.
          </p>
          <div className="manifesto-actions">
            <Link href="/support" className="btn-primary btn-lg">
              Support with crypto →
            </Link>
          </div>
        </div>
      </section>

      {/* Self-host section */}
      <section className="manifesto-section">
        <div className="manifesto-section-inner">
          <p className="pricing-eyebrow">Self-host everything</p>
          <h2 className="manifesto-section-h2">
            Your infra. Your rules.
          </h2>
          <p className="manifesto-section-desc">
            Run WokGen on your own hardware with{' '}
            <strong>ComfyUI</strong> for image generation and{' '}
            <strong>Ollama</strong> for local language models. Zero quota,
            zero rate limits, and complete control over your data.
            The entire stack is MIT-licensed and fully documented.
          </p>
          <div className="manifesto-actions">
            <Link href="/docs" className="btn-ghost btn-lg">
              Read the self-hosting guide →
            </Link>
            <a
              href="https://github.com/WokSpec/WokGen"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost btn-lg"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="manifesto-section">
        <div className="manifesto-section-inner">
          <h2 className="manifesto-section-h2">Ready to create?</h2>
          <p className="manifesto-section-desc">
            Open the studio, pick a model, and start generating — no account required.
          </p>
          <div className="manifesto-actions">
            <Link href="/studio" className="btn-primary btn-lg">
              Open Studio →
            </Link>
            <Link href="/support" className="btn-ghost btn-lg">
              Support the project
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
