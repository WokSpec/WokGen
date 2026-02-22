'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

// ─── Data ────────────────────────────────────────────────────────────────────

const TOOLS = [
  { id: 'generate', icon: '✦', label: 'Generate',     description: 'Text → pixel art sprite or scene at any resolution.' },
  { id: 'animate',  icon: '▶', label: 'Animate',      description: 'Turn a static sprite into a looping animation.' },
  { id: 'rotate',   icon: '↻', label: 'Rotate',       description: '4 or 8-direction views from a single sprite.' },
  { id: 'inpaint',  icon: '⬛', label: 'Inpaint',      description: 'Edit specific regions with a brush mask.' },
  { id: 'scene',    icon: '⊞', label: 'Scenes',       description: 'Generate tilesets, maps, and environments.' },
] as const;

const STEPS = [
  { n: '01', title: 'Sign in',       body: 'Create a free account. No credit card required.' },
  { n: '02', title: 'Describe',      body: 'Type a prompt. Standard generation is always free.' },
  { n: '03', title: 'Export',        body: 'Download your asset. Use it however you want.' },
] as const;

const PLANS = [
  { id: 'free',  label: 'Free',    price: '$0',   note: 'Forever',   features: ['Unlimited standard generation', 'Pollinations AI', 'Download originals'], accent: 'var(--text-muted)' },
  { id: 'plus',  label: 'Plus',    price: '$2',   note: '/month',    features: ['30 HD credits/mo', 'Replicate models', 'FLUX.1 quality'],                   accent: '#a78bfa', highlight: true },
  { id: 'pro',   label: 'Pro',     price: '$6',   note: '/month',    features: ['100 HD credits/mo', 'Priority queue', 'All Plus features'],                 accent: '#a78bfa' },
] as const;

// ─── Subcomponents ───────────────────────────────────────────────────────────

function ToolCard({ tool, index }: { tool: typeof TOOLS[number]; index: number }) {
  return (
    <Link
      href={`/studio?tool=${tool.id}`}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.25rem',
        textDecoration: 'none',
        animationDelay: `${index * 0.06}s`,
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,0.35)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = ''; }}
    >
      <span style={{ fontSize: '1.1rem', color: '#a78bfa', lineHeight: 1 }} aria-hidden="true">{tool.icon}</span>
      <div>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem', fontFamily: 'var(--font-heading)' }}>{tool.label}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tool.description}</p>
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 'auto' }}>Open in Studio →</span>
    </Link>
  );
}

function StepCard({ step }: { step: typeof STEPS[number] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <span className="step-number">{step.n}</span>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{step.title}</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.body}</p>
    </div>
  );
}

function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        borderColor: plan.highlight ? 'rgba(167,139,250,0.3)' : undefined,
        position: 'relative',
      }}
    >
      {plan.highlight && (
        <span
          className="tag tag-purple"
          style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.6rem' }}
        >
          Most popular
        </span>
      )}
      <div>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: plan.accent, fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
          {plan.label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{plan.price}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.note}</span>
        </div>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyle: 'none', padding: 0, margin: 0 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ color: plan.accent, flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/billing"
        className={plan.highlight ? 'btn-primary' : 'btn-ghost'}
        style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.8rem' }}
      >
        {plan.id === 'free' ? 'Get started free' : `Upgrade to ${plan.label}`}
      </Link>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="bg-grid"
        style={{ padding: 'clamp(4rem, 10vw, 7rem) 1.5rem', borderBottom: '1px solid var(--border)' }}
      >
        {/* Purple orb */}
        <div
          className="orb orb-purple"
          style={{ top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, opacity: 0.5 }}
          aria-hidden="true"
        />

        <div style={{ maxWidth: '52rem', margin: '0 auto', textAlign: 'center', position: 'relative' }}>

          {/* Status badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span className="tag tag-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse 2s infinite' }}
                aria-hidden="true"
              />
              Early Preview · Active development
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <span style={{ color: 'var(--text)' }}>Free AI pixel art.</span>
            <br />
            <span className="gradient-text">No setup required.</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '38rem', margin: '0 auto 2.5rem' }}>
            Sign in, type a prompt, generate. Standard quality is always free.
            Upgrade for HD resolution and higher model quality.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
            {session ? (
              <Link href="/studio" className="btn-primary" style={{ minWidth: 160 }}>
                Open Studio →
              </Link>
            ) : (
              <Link href="/auth/signin" className="btn-primary" style={{ minWidth: 160 }}>
                Start for free →
              </Link>
            )}
            <Link href="/gallery" className="btn-ghost">
              Browse Gallery
            </Link>
          </div>

          {/* Trust line */}
          <p style={{ marginTop: '2rem', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            By{' '}
            <a href="https://wokspec.org" style={{ color: 'var(--text-faint)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Wok Specialists
            </a>
            {' '}· Open-source · MIT + Commons Clause
          </p>
        </div>
      </section>

      {/* ── Tools ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}
            >
              Five tools. One studio.
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Everything needed to produce game-ready pixel art assets — all in one tab.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {TOOLS.map((tool, i) => <ToolCard key={tool.id} tool={tool} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
              How it works
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No provider accounts. No API keys. No terminal.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
            {STEPS.map(step => <StepCard key={step.n} step={step} />)}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
              Pricing
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Start free. Pay only for HD model access. Cancel anytime.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            Need more? <Link href="/billing" style={{ color: '#a78bfa', textDecoration: 'none' }}>View all plans and credit packs →</Link>
          </p>
        </div>
      </section>

      {/* ── Callout ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <div
            className="card"
            style={{
              padding: '2rem',
              background: 'rgba(124,58,237,0.05)',
              borderColor: 'rgba(167,139,250,0.2)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a78bfa', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                Batch workflows
              </p>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem', fontFamily: 'var(--font-heading)' }}>
                Need bulk production? Use the Asset Pipeline.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <code style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>packages/asset-pipeline</code> runs
                automated generate → normalize → package → validate cycles. 450+ item catalog included.
              </p>
            </div>
            <a
              href="https://github.com/WokSpec/WokGen/tree/main/packages/asset-pipeline"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
