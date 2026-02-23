import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen — Multi-Vertical AI Asset Generation Platform',
  description:
    'WokGen is a multi-engine AI asset factory — specialized pipelines for pixel art, brand systems, vectors, UI components, and more.',
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
    icon: '👾',
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
    icon: '💼',
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
    icon: '✦',
    highlights: ['SVG Icon Packs', 'Illustration Sets', 'UI Kits', 'Design Tokens'],
    href: '/vector',
    studioCta: '/vector/studio',
  },
  {
    id: 'emoji',
    label: 'WokGen Emoji',
    accent: '#fb923c',
    status: 'beta' as const,
    tagline: 'For platforms and apps',
    desc: 'Custom emoji packs, reaction sets, Discord/Slack icons, and app icon sets. Platform-correct sizing.',
    icon: '😄',
    highlights: ['Emoji Packs', 'Reaction Sets', 'Sticker Packs', 'App Icons'],
    href: '/emoji',
    studioCta: '/emoji/studio',
  },
  {
    id: 'uiux',
    label: 'WokGen UI/UX',
    accent: '#f472b6',
    status: 'live' as const,
    tagline: 'For product teams',
    desc: 'React components, Tailwind sections, landing pages, and design system tokens. Prompt → production-ready code.',
    icon: '⌨',
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
    icon: '🎙️',
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
    icon: '✍️',
    highlights: ['Brand headlines', 'Blog posts', 'Ad copy', 'Email campaigns'],
    href: '/text',
    studioCta: '/text/studio',
  },
] satisfies Array<{ id: string; label: string; accent: string; status: 'live' | 'beta' | 'coming_soon'; tagline: string; desc: string; icon: string; highlights: readonly string[]; href: string; studioCta: string }>;

const QUICK_PROMPTS = [
  {
    mode: 'Pixel',
    icon: '🗡',
    label: 'Fantasy sword item icon, RPG style, transparent bg',
    href: '/pixel/studio?tool=generate&prompt=Fantasy+sword+item+icon+RPG+style+transparent+background',
    accent: '#a78bfa',
  },
  {
    mode: 'Pixel',
    icon: '🏰',
    label: 'Medieval castle tileset, top-down perspective',
    href: '/pixel/studio?tool=generate&prompt=Medieval+castle+tileset+top-down+perspective+seamless',
    accent: '#a78bfa',
  },
  {
    mode: 'Business',
    icon: '⬛',
    label: 'Minimal tech startup logo mark, dark modern',
    href: '/business/studio?tool=logo&prompt=Minimal+tech+startup+focused+on+AI+security+dark+modern',
    accent: '#60a5fa',
  },
  {
    mode: 'Business',
    icon: '📱',
    label: 'Product launch social banner, SaaS minimal flat',
    href: '/business/studio?tool=social&prompt=Product+launch+announcement+SaaS+app+minimal+flat+dark',
    accent: '#60a5fa',
  },
  {
    mode: 'Vector',
    icon: '✦',
    label: 'Settings gear icon, outline style, rounded corners',
    href: '/vector/studio?preset=outline&prompt=Settings+gear+icon+outline+style+rounded+corners',
    accent: '#34d399',
  },
  {
    mode: 'Emoji',
    icon: '😄',
    label: 'Happy blob emoji, Discord-style, expressive',
    href: '/emoji/studio?preset=blob&prompt=Happy+laughing+blob+emoji+expressive',
    accent: '#fb923c',
  },
  {
    mode: 'UI/UX',
    icon: '⌨',
    label: 'SaaS pricing section, 3 tiers, dark theme',
    href: '/uiux/studio?prompt=SaaS+pricing+section+3+tiers+dark+minimal',
    accent: '#f472b6',
  },
  {
    mode: 'Pixel',
    icon: '👾',
    label: 'Chibi character sprite, front-facing idle pose',
    href: '/pixel/studio?tool=generate&prompt=Cute+chibi+character+sprite+front-facing+idle+pose',
    accent: '#a78bfa',
  },
] as const;

const STATS = [
  { value: '7',  label: 'Product Modes' },
  { value: '6+', label: 'AI Providers' },
  { value: '∞',  label: 'Standard Generations' },
  { value: '0',  label: 'Setup Required' },
] as const;

export default function PlatformLanding() {
  return (
    <div className="platform-landing">

      {/* ── Platform hero ─────────────────────────────────────────────── */}
      <section className="platform-hero">
        <div className="platform-hero-inner">
          <div className="platform-hero-eyebrow">
            <span className="platform-hero-dot platform-hero-dot--pixel" />
            <span className="platform-hero-dot platform-hero-dot--business" />
            <span className="platform-hero-dot platform-hero-dot--vector" />
            <span>Multi-vertical AI generation</span>
          </div>
          <h1 className="platform-h1">
            One platform.<br />
            <span className="platform-h1-accent">Multiple asset engines.</span>
          </h1>
          <p className="platform-desc">
            WokGen is a multi-engine AI asset factory — specialized pipelines for every kind of digital asset. Pixel sprites, brand systems, UI components, vectors, and beyond.
            Game sprites, brand kits, social banners, icon sets, and code components —
            each with its own professional pipeline.
          </p>
          <div className="platform-cta-row">
            <Link href="/pixel/studio" className="btn-primary btn-lg">
              Start Free — Pixel Studio →
            </Link>
            <Link href="/business/studio" className="btn-ghost btn-lg">
              Business Studio →
            </Link>
          </div>
          <p className="platform-hero-note">
            No account needed to start. Standard generation is always free.
          </p>
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
                <span className="platform-quicktry-icon">{q.icon}</span>
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
                href={mode.href}
                className={`platform-mode-card${(mode.status as string) === 'coming_soon' ? ' platform-mode-card--soon' : mode.status === 'beta' ? ' platform-mode-card--beta' : ''}`}
                style={{ '--mode-card-accent': mode.accent } as React.CSSProperties}
              >
                <div className="platform-mode-card-header">
                  <span className="platform-mode-icon">{mode.icon}</span>
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
