'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

// ─── Data ────────────────────────────────────────────────────────────────────

const TOOLS = [
  { id: 'generate', icon: '✦', label: 'Generate',  description: 'Text-to-pixel-art. Any style, size, era, or category.', example: 'iron sword, ornate crossguard' },
  { id: 'animate',  icon: '▶', label: 'Animate',   description: 'Static sprites become looping GIF animations in seconds.', example: 'knight walking cycle, 8 frames' },
  { id: 'rotate',   icon: '↻', label: 'Rotate',    description: '4 or 8-direction turntable views from a single character.', example: 'warrior sprite, all 4 directions' },
  { id: 'inpaint',  icon: '⬛', label: 'Inpaint',   description: 'Mask + repaint any region with brush-precision edits.', example: 'replace sword with axe' },
  { id: 'scene',    icon: '⊞', label: 'Scenes',    description: 'Full tilesets, maps, and environments — entire game scenes.', example: 'dungeon stone floor tileset' },
] as const;

const STEPS = [
  { n: '01', title: 'Sign in',  body: 'Create a free account with GitHub. No credit card required.' },
  { n: '02', title: 'Describe', body: 'Type a prompt. Choose your style, size, and era. Generate.' },
  { n: '03', title: 'Export',   body: 'Download your PNG or GIF. License is yours — use it anywhere.' },
] as const;

const FEATURES = [
  { icon: '∞', label: 'Free forever',     body: 'Standard generation is unlimited. Always free.' },
  { icon: '⚡', label: 'HD quality',       body: 'Upgrade for Replicate FLUX.1 at HD resolution.' },
  { icon: '🎞', label: 'Real GIF animate', body: 'Multi-frame GIF generation — not just a filter.' },
  { icon: '🎮', label: 'Game-ready',       body: 'Transparent bg, pixel-perfect, export-ready.' },
] as const;

const EXAMPLE_PROMPTS = [
  'iron sword with ornate crossguard, RPG inventory icon',
  'health potion, glowing red liquid in crystal vial',
  'leather shield with iron boss, battle-worn',
  'fire scroll with golden wax seal',
  'warrior in plate armor, front facing sprite',
  'ancient wooden staff with crystal orb',
  'dungeon entrance, pixel art tileset',
  'gem deposit, blue crystal in cave wall',
  'pixel art dragon, side view',
  'wooden chest with gold trim, treasure',
  'magic wand, sparkling tip',
  'skull key for dungeon door',
] as const;

const PLANS = [
  { id: 'free',  label: 'Free',  price: '$0',  note: 'Forever',  features: ['Unlimited standard generation', 'Pollinations AI model', 'Download originals'], highlight: false },
  { id: 'plus',  label: 'Plus',  price: '$2',  note: '/month',   features: ['100 HD credits/mo', 'Replicate FLUX.1', 'FLUX-quality output'], highlight: true },
  { id: 'pro',   label: 'Pro',   price: '$6',  note: '/month',   features: ['500 HD credits/mo', 'Priority queue', 'All Plus features'], highlight: false },
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
        transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,0.4)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      <span style={{ fontSize: '1.1rem', color: '#a78bfa', lineHeight: 1 }} aria-hidden="true">{tool.icon}</span>
      <div>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem', fontFamily: 'var(--font-heading)' }}>{tool.label}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tool.description}</p>
      </div>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontStyle: 'italic', lineHeight: 1.4, margin: 0 }}>
        e.g. &ldquo;{tool.example}&rdquo;
      </p>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 'auto' }}>Open in Studio →</span>
    </Link>
  );
}

function FeatureCallout({ f }: { f: typeof FEATURES[number] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.4rem', lineHeight: 1 }} aria-hidden="true">{f.icon}</span>
      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{f.label}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{f.body}</p>
    </div>
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
        borderColor: plan.highlight ? 'rgba(167,139,250,0.4)' : undefined,
        boxShadow: plan.highlight ? '0 0 0 1px rgba(167,139,250,.15)' : undefined,
        position: 'relative',
      }}
    >
      {plan.highlight && (
        <span className="tag tag-purple" style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.6rem' }}>
          Most popular
        </span>
      )}
      <div>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: plan.highlight ? '#a78bfa' : 'var(--text-muted)', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
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
            <span style={{ color: plan.highlight ? '#a78bfa' : 'var(--text-faint)', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={`/billing?plan=${plan.id}`}
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
  const [genCount, setGenCount] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setGenCount(d.totalGenerations)).catch(() => {});
  }, []);

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="bg-grid"
        style={{ padding: 'clamp(4rem, 10vw, 7rem) 1.5rem', borderBottom: '1px solid var(--border)' }}
      >
        <div className="orb orb-purple" style={{ top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, opacity: 0.45 }} aria-hidden="true" />

        <div style={{ maxWidth: '56rem', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.75rem' }}>

            {/* Status badge */}
            <span className="tag tag-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 2s infinite' }} aria-hidden="true" />
              Open Beta · Free to use
            </span>

            <div>
              <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 3.75rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: 'var(--text)' }}>AI pixel art,</span>
                <br />
                <span className="gradient-text">ready for your game.</span>
              </h1>
              <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '40rem' }}>
                Sign in with GitHub, type a prompt, generate. Standard quality is always free and unlimited.
                HD generation is available on any paid plan.
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {session ? (
                <Link href="/studio" className="btn-primary" style={{ minWidth: 160, fontSize: '0.9rem', padding: '0.65rem 1.5rem' }}>
                  Open Studio →
                </Link>
              ) : (
                <Link href="/login" className="btn-primary" style={{ minWidth: 160, fontSize: '0.9rem', padding: '0.65rem 1.5rem' }}>
                  Start for free →
                </Link>
              )}
              <Link href="/gallery" className="btn-ghost" style={{ fontSize: '0.9rem' }}>
                Browse Gallery
              </Link>
              <Link href="/docs" className="btn-ghost" style={{ fontSize: '0.9rem' }}>
                Documentation
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {genCount !== null && genCount > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>{genCount.toLocaleString()}</span> assets generated
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                By <a href="https://wokspec.org" style={{ color: 'var(--text-faint)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>WokSpec</a>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>Open source</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature callouts ─────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 1.5rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
          {FEATURES.map(f => <FeatureCallout key={f.label} f={f} />)}
        </div>
      </section>

      {/* ── Tools ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
              Five tools. One studio.
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Everything you need to produce game-ready pixel art assets — all in one tab.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
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
              Start free — no card required. Pay only for HD model access.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              Need bulk HD credits?{' '}
              <Link href="/billing" style={{ color: '#a78bfa', textDecoration: 'none' }}>View all plans and credit packs →</Link>
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              What is an HD credit?{' '}
              <Link href="/docs#credits" style={{ color: '#a78bfa', textDecoration: 'none' }}>Learn more →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Example prompts ─────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.3rem,3vw,1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)', color: 'var(--text)', marginBottom: '0.5rem' }}>
              What will you create?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Click any prompt to open it in the studio
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {EXAMPLE_PROMPTS.map((p) => (
              <Link
                key={p}
                href={`/studio?prompt=${encodeURIComponent(p)}`}
                style={{
                  display: 'block',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,.35)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                }}
              >
                <span style={{ color: '#a78bfa', marginRight: '0.375rem' }}>✦</span>
                {p}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

