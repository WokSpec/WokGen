import type { Metadata } from 'next';
import Link from 'next/link';

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
            WokGen has no pricing tiers because we don&apos;t believe creative tools should cost
            money to access. Server costs and model hosting are covered entirely through voluntary
            crypto donations from people who find WokGen useful.
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
            <Link href="/pixel/studio" className="btn-primary btn-lg">
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
