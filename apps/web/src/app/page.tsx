import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen — AI Asset Generation Platform',
  description:
    'Every asset your project needs. 8 specialized AI studios for pixel art, brand systems, vectors, UI components, voice, and text.',
  keywords: [
    'AI asset generator', 'pixel art AI', 'brand asset generator',
    'sprite generator', 'AI logo maker', 'WokGen', 'WokSpec',
  ],
  openGraph: {
    title: 'WokGen — AI Asset Generation Platform',
    description: 'Generate game assets, brand kits, social banners, SVG icons, and UI components with AI.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const MODES = [
  {
    id: 'pixel',
    label: 'WokGen Pixel',
    accent: '#a78bfa',
    status: 'live' as const,
    tagline: 'For game developers',
    desc: 'Sprites, animations, tilesets, and game-ready assets. Pixel-perfect sizes, GIF output, game engine exports.',
    highlights: ['Sprites & Characters', 'Tilesets & Scenes', 'GIF Animations', 'Game-ready export'],
    href: '/pixel',
    studioCta: '/pixel/studio',
  },
  {
    id: 'business',
    label: 'WokGen Business',
    accent: '#60a5fa',
    status: 'live' as const,
    tagline: 'For brands and teams',
    desc: 'Logos, brand kits, slide visuals, social banners, and web hero images. Platform-smart sizing built in.',
    highlights: ['Brand Logos & Kits', 'Slide Backgrounds', 'Social Banners', 'Web Hero Images'],
    href: '/business',
    studioCta: '/business/studio',
  },
  {
    id: 'vector',
    label: 'WokGen Vector',
    accent: '#34d399',
    status: 'beta' as const,
    tagline: 'For design systems',
    desc: 'SVG icon sets, illustration libraries, and design system components. Pure vector, stroke-consistent.',
    highlights: ['SVG Icon Packs', 'Illustration Sets', 'UI Kits', 'Design Tokens'],
    href: '/vector',
    studioCta: '/vector/studio',
  },
  {
    id: 'uiux',
    label: 'WokGen UI/UX',
    accent: '#f472b6',
    status: 'live' as const,
    tagline: 'For product teams',
    desc: 'React components, Tailwind sections, landing pages, and design system tokens. Prompt → production-ready code.',
    highlights: ['React Components', 'Tailwind Sections', 'Page Templates', 'Design Tokens'],
    href: '/uiux',
    studioCta: '/uiux/studio',
  },
  {
    id: 'voice',
    label: 'WokGen Voice',
    accent: '#f59e0b',
    status: 'beta' as const,
    tagline: 'Speech & Audio Generation',
    desc: 'Generate natural speech, character voices, and audio clips with AI.',
    highlights: ['Character narration', 'Product demos', 'Podcast intros', 'Game NPC dialogue'],
    href: '/voice',
    studioCta: '/voice/studio',
  },
  {
    id: 'text',
    label: 'WokGen Text',
    accent: '#10b981',
    status: 'beta' as const,
    tagline: 'AI Copywriting Engine',
    desc: 'Headlines, blogs, product copy, social posts, and creative writing at scale.',
    highlights: ['Brand headlines', 'Blog posts', 'Ad copy', 'Email campaigns'],
    href: '/text',
    studioCta: '/text/studio',
  },
] satisfies Array<{ id: string; label: string; accent: string; status: 'live' | 'beta' | 'coming_soon'; tagline: string; desc: string; highlights: readonly string[]; href: string; studioCta: string }>;

const QUICK_PROMPTS = [
  {
    mode: 'Pixel',
    label: 'Fantasy sword item icon, RPG style, transparent bg',
    href: '/pixel/studio?tool=generate&prompt=Fantasy+sword+item+icon+RPG+style+transparent+background',
    accent: '#a78bfa',
  },
  {
    mode: 'Pixel',
    label: 'Medieval castle tileset, top-down perspective',
    href: '/pixel/studio?tool=generate&prompt=Medieval+castle+tileset+top-down+perspective+seamless',
    accent: '#a78bfa',
  },
  {
    mode: 'Business',
    label: 'Minimal tech startup logo mark, dark modern',
    href: '/business/studio?tool=logo&prompt=Minimal+tech+startup+focused+on+AI+security+dark+modern',
    accent: '#60a5fa',
  },
  {
    mode: 'Business',
    label: 'Product launch social banner, SaaS minimal flat',
    href: '/business/studio?tool=social&prompt=Product+launch+announcement+SaaS+app+minimal+flat+dark',
    accent: '#60a5fa',
  },
  {
    mode: 'Vector',
    label: 'Settings gear icon, outline style, rounded corners',
    href: '/vector/studio?preset=outline&prompt=Settings+gear+icon+outline+style+rounded+corners',
    accent: '#34d399',
  },
  {
    mode: 'UI/UX',
    label: 'SaaS pricing section, 3 tiers, dark theme',
    href: '/uiux/studio?prompt=SaaS+pricing+section+3+tiers+dark+minimal',
    accent: '#f472b6',
  },
  {
    mode: 'Pixel',
    label: 'Chibi character sprite, front-facing idle pose',
    href: '/pixel/studio?tool=generate&prompt=Cute+chibi+character+sprite+front-facing+idle+pose',
    accent: '#a78bfa',
  },
] as const;

const STATS = [
  { value: '8',  label: 'Specialized studios' },
  { value: '6+', label: 'AI providers, routed by quality' },
  { value: 'Free', label: 'Standard generation, always' },
  { value: 'Open', label: 'Source — MIT licensed' },
] as const;

export default function PlatformLanding() {
  return (
    <div className="platform-landing">

      {/* ── Platform hero ─────────────────────────────────────────────── */}
      <section className="platform-hero">
        <div className="platform-hero-inner">
          <div className="platform-hero-eyebrow">
            <span className="platform-hero-rule" />
            <span>AI asset generation platform</span>
          </div>
          <h1 className="platform-h1">
            Every asset your project needs.<br />
            <span className="platform-h1-accent">Generated from intent, not just prompts.</span>
          </h1>
          <p className="platform-desc">
            8 specialized studios. An AI director that plans entire asset packs.
            Brand kits that enforce visual consistency across every generation.
          </p>
          <div className="platform-cta-row">
            <Link href="/pixel/studio" className="btn-primary btn-lg">
              Open Pixel Studio →
            </Link>
            <Link href="/pixel" className="btn-ghost btn-lg">
              See all studios
            </Link>
          </div>
          <p className="platform-hero-note">
            No account needed. Standard generation is always free.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="landing-howitworks">
        <div className="platform-section-inner">
          <p className="platform-section-label">How it works</p>
          <div className="landing-steps">
            <div className="landing-step">
              <span className="landing-step__num">01</span>
              <h3 className="landing-step__title">Describe what you need</h3>
              <p className="landing-step__desc">Write a prompt or use Eral AI to plan an entire asset pack. WokGen understands project context, not just isolated prompts.</p>
            </div>
            <div className="landing-step__arrow">→</div>
            <div className="landing-step">
              <span className="landing-step__num">02</span>
              <h3 className="landing-step__title">Choose your engine</h3>
              <p className="landing-step__desc">8 specialized studios. Pixel sprites behave differently from brand logos. Each pipeline is tuned for its asset type.</p>
            </div>
            <div className="landing-step__arrow">→</div>
            <div className="landing-step">
              <span className="landing-step__num">03</span>
              <h3 className="landing-step__title">Export production-ready</h3>
              <p className="landing-step__desc">ZIP downloads, sprite atlases, brand kit packs. Assets organized by project, with relationships tracked across generations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Differentiator ───────────────────────────────────────────── */}
      <section className="landing-diff">
        <div className="platform-section-inner">
          <div className="landing-diff-grid">
            <div className="landing-diff-card landing-diff-card--others">
              <p className="landing-diff-card__label">Other AI generators</p>
              <ul className="landing-diff-list landing-diff-list--bad">
                <li>Every prompt is isolated — no memory</li>
                <li>One-size-fits-all image model</li>
                <li>No project organization</li>
                <li>No brand consistency enforcement</li>
                <li>Feature-gated by tier</li>
                <li>Closed source</li>
              </ul>
            </div>
            <div className="landing-diff-card landing-diff-card--wokgen">
              <p className="landing-diff-card__label">WokGen</p>
              <ul className="landing-diff-list landing-diff-list--good">
                <li>Project-aware — Eral knows your assets</li>
                <li>8 specialized engines per asset type</li>
                <li>Asset relationship graph per project</li>
                <li>Brand kit locks palette + style globally</li>
                <li>All features free — limits are quantity only</li>
                <li>Open source, MIT licensed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick-try prompts ─────────────────────────────────────────── */}
      <section className="platform-quicktry">
        <div className="platform-section-inner">
          <p className="platform-section-label">Try it now</p>
          <div className="platform-quicktry-grid">
            {QUICK_PROMPTS.map(q => (
              <Link
                key={q.label}
                href={q.href}
                className="platform-quicktry-card"
                style={{ '--qt-accent': q.accent } as React.CSSProperties}
              >
                <span className="platform-quicktry-mode">{q.mode}</span>
                <span className="platform-quicktry-label">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mode cards ────────────────────────────────────────────────── */}
      <section className="platform-modes">
        <div className="platform-modes-inner">
          <p className="platform-section-label">Choose your engine</p>
          <div className="platform-modes-grid">
            {MODES.map(mode => (
              <Link
                key={mode.id}
                href={mode.studioCta ?? mode.href}
                className={`platform-mode-card${(mode.status as string) === 'coming_soon' ? ' platform-mode-card--soon' : mode.status === 'beta' ? ' platform-mode-card--beta' : ''}`}
                style={{ '--mode-card-accent': mode.accent } as React.CSSProperties}
              >
                <div className="platform-mode-card-header">
                  <span className="platform-mode-accent-bar" />
                  <div>
                    <div className="platform-mode-label">{mode.label}</div>
                    <div className="platform-mode-tagline">{mode.tagline}</div>
                  </div>
                  {mode.status === 'beta' && (
                    <span className="platform-mode-badge platform-mode-badge--beta">Beta</span>
                  )}
                </div>
                <p className="platform-mode-desc">{mode.desc}</p>
                <ul className="platform-mode-highlights">
                  {mode.highlights.map(h => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                {mode.studioCta ? (
                  <span className="platform-mode-cta">Open Studio →</span>
                ) : (
                  <span className="platform-mode-cta platform-mode-cta--soon">Join Waitlist →</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section className="platform-stats">
        <div className="platform-stats-inner">
          {STATS.map(s => (
            <div key={s.label} className="platform-stat">
              <span className="platform-stat-value">{s.value}</span>
              <span className="platform-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── WokSpec bar ───────────────────────────────────────────────── */}
      <section className="landing-wokspec">
        <div className="landing-wokspec-inner">
          <p className="landing-wokspec-text">
            Need production-level delivery? WokSpec builds what WokGen generates.
          </p>
          <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
            WokSpec Services →
          </a>
        </div>
      </section>

    </div>
  );
}
