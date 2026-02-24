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
    label: 'Pixel',
    accent: '#a78bfa',
    status: 'live' as const,
    tagline: 'For game developers',
    highlights: ['Sprites & Characters', 'Tilesets & Scenes', 'GIF Animations'],
    studioCta: '/pixel/studio',
  },
  {
    id: 'business',
    label: 'Business',
    accent: '#60a5fa',
    status: 'live' as const,
    tagline: 'For brands and teams',
    highlights: ['Brand Logos & Kits', 'Social Banners', 'Web Hero Images'],
    studioCta: '/business/studio',
  },
  {
    id: 'vector',
    label: 'Vector',
    accent: '#34d399',
    status: 'beta' as const,
    tagline: 'For design systems',
    highlights: ['SVG Icon Packs', 'Illustration Sets', 'UI Kits'],
    studioCta: '/vector/studio',
  },
  {
    id: 'uiux',
    label: 'UI/UX',
    accent: '#f472b6',
    status: 'live' as const,
    tagline: 'For product teams',
    highlights: ['React Components', 'Tailwind Sections', 'Page Templates'],
    studioCta: '/uiux/studio',
  },
  {
    id: 'voice',
    label: 'Voice',
    accent: '#f59e0b',
    status: 'beta' as const,
    tagline: 'Speech & Audio Generation',
    highlights: ['Character Narration', 'Game NPC Dialogue', 'Podcast Intros'],
    studioCta: '/voice/studio',
  },
  {
    id: 'text',
    label: 'Text',
    accent: '#10b981',
    status: 'beta' as const,
    tagline: 'AI Copywriting Engine',
    highlights: ['Brand Headlines', 'Blog Posts', 'Ad Copy'],
    studioCta: '/text/studio',
  },
] as const;

const TOOL_CATEGORIES = [
  { emoji: '🖼️', name: 'Image Tools',   count: 8, examples: ['Background Remover', 'Image Resizer', 'Format Converter'] },
  { emoji: '💻', name: 'Dev Tools',      count: 6, examples: ['JSON Toolkit', 'CSS Generator', 'Color Palette'] },
  { emoji: '🎮', name: 'Game Dev',       count: 5, examples: ['Sprite Packer', 'Tileset Slicer', 'Pixel Upscaler'] },
  { emoji: '🎨', name: 'Design',         count: 5, examples: ['SVG Editor', 'Font Pairer', 'Gradient Builder'] },
  { emoji: '🔗', name: 'Crypto / Web3',  count: 4, examples: ['NFT Metadata', 'QR Generator', 'Contract ABI'] },
  { emoji: '🎵', name: 'Audio',          count: 3, examples: ['Waveform Viewer', 'BPM Detector', 'Audio Trimmer'] },
] as const;

export default function HomePage() {
  return (
    <div className="homepage-root">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="homepage-hero">
        <div className="bg-grid" />
        <div className="homepage-hero-orbs">
          <div className="orb orb-purple homepage-orb-1" />
          <div className="orb orb-violet homepage-orb-2" />
          <div className="orb orb-grey homepage-orb-3" />
        </div>
        <div className="homepage-hero-inner">
          <div className="homepage-hero-eyebrow">
            <span className="homepage-eyebrow-dot" />
            <span>AI asset generation platform</span>
          </div>
          <h1 className="homepage-h1">
            Build anything.<br />
            <span className="gradient-text">Free forever.</span>
          </h1>
          <p className="homepage-hero-sub">
            AI studios for game devs, brand teams, and creators.<br />
            30+ free browser tools. No paywalls.
          </p>
          <div className="homepage-hero-ctas">
            <Link href="/pixel/studio" className="homepage-cta-primary">
              Start Creating →
            </Link>
            <Link href="/community" className="homepage-cta-ghost">
              Browse Gallery
            </Link>
          </div>
          <div className="homepage-stat-bar">
            <span>12,400+ assets generated</span>
            <span className="homepage-stat-sep">·</span>
            <span>30+ free tools</span>
            <span className="homepage-stat-sep">·</span>
            <span>8 AI studios</span>
            <span className="homepage-stat-sep">·</span>
            <span>Open source</span>
          </div>
        </div>
      </section>

      {/* ── Modes Showcase ───────────────────────────────────────────── */}
      <section className="homepage-modes">
        <div className="homepage-section-inner">
          <div className="homepage-section-head">
            <h2 className="homepage-section-title">8 specialized AI studios</h2>
            <p className="homepage-section-sub">Each studio is purpose-built for a creative discipline. Pick yours and start generating.</p>
          </div>
          <div className="homepage-modes-grid">
            {MODES.map(mode => (
              <Link
                key={mode.id}
                href={mode.studioCta}
                className="homepage-mode-card"
                style={{ '--mode-accent': mode.accent } as React.CSSProperties}
              >
                <div className="homepage-mode-top-border" />
                <div className="homepage-mode-header">
                  <span className="homepage-mode-dot" />
                  <span className="homepage-mode-name">{mode.label}</span>
                  {mode.status === 'beta' && <span className="homepage-mode-badge">Beta</span>}
                </div>
                <div className="homepage-mode-tagline">{mode.tagline}</div>
                <ul className="homepage-mode-bullets">
                  {mode.highlights.map(h => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <span className="homepage-mode-cta">Open Studio →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Spotlight ──────────────────────────────────────────── */}
      <section className="homepage-tools">
        <div className="homepage-section-inner">
          <div className="homepage-section-head">
            <h2 className="homepage-section-title">
              30+ free tools.<br />
              <span className="gradient-text">No signup required.</span>
            </h2>
            <p className="homepage-section-sub">Browser-native utilities. Open, use, close. No accounts, no server uploads, no paywalls.</p>
          </div>
          <div className="homepage-tools-grid">
            {TOOL_CATEGORIES.map(cat => (
              <div key={cat.name} className="homepage-tool-card">
                <div className="homepage-tool-icon">{cat.emoji}</div>
                <div className="homepage-tool-name">{cat.name}</div>
                <div className="homepage-tool-count">{cat.count} tools</div>
                <ul className="homepage-tool-list">
                  {cat.examples.map(ex => <li key={ex}>{ex}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="homepage-tools-footer">
            <Link href="/tools" className="homepage-cta-ghost">Explore all tools →</Link>
          </div>
        </div>
      </section>

      {/* ── Eral Spotlight ───────────────────────────────────────────── */}
      <section className="homepage-eral">
        <div className="homepage-section-inner">
          <div className="homepage-eral-grid">
            <div className="homepage-eral-left">
              <div className="homepage-eyebrow-pill">AI Creative Director</div>
              <h2 className="homepage-section-title">
                Meet Eral, your<br />
                <span className="gradient-text">AI creative director.</span>
              </h2>
              <ul className="homepage-eral-bullets">
                <li>
                  <span className="homepage-eral-bullet-icon">◆</span>
                  <div>
                    <strong>Plans your project assets</strong>
                    <p>Describe your project, Eral builds a full asset plan.</p>
                  </div>
                </li>
                <li>
                  <span className="homepage-eral-bullet-icon">◆</span>
                  <div>
                    <strong>Understands context</strong>
                    <p>Genre, tone, platform — Eral adapts its suggestions.</p>
                  </div>
                </li>
                <li>
                  <span className="homepage-eral-bullet-icon">◆</span>
                  <div>
                    <strong>Directs generation</strong>
                    <p>Routes tasks to the right studio automatically.</p>
                  </div>
                </li>
              </ul>
              <Link href="/eral" className="homepage-cta-primary">Chat with Eral →</Link>
            </div>
            <div className="homepage-eral-right">
              <div className="homepage-chat-preview">
                <div className="homepage-chat-header">
                  <span className="homepage-chat-dot" />
                  <span>Eral</span>
                </div>
                <div className="homepage-chat-messages">
                  <div className="homepage-chat-msg homepage-chat-user">
                    I&apos;m building a dark fantasy RPG. I need assets for the main menu.
                  </div>
                  <div className="homepage-chat-msg homepage-chat-eral">
                    Got it — dark fantasy RPG main menu. I&apos;d suggest starting with:
                    <br /><br />
                    <strong>1.</strong> A moody hero background (Pixel Studio)<br />
                    <strong>2.</strong> Logo mark with runic typography (Business Studio)<br />
                    <strong>3.</strong> UI button set in stone/metal style (UI/UX Studio)
                    <br /><br />
                    Want me to queue all three?
                  </div>
                  <div className="homepage-chat-msg homepage-chat-user">
                    Yes, queue them all.
                  </div>
                  <div className="homepage-chat-msg homepage-chat-eral">
                    ✓ Queued 3 generation tasks. Opening Pixel Studio first…
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OSS Strip ────────────────────────────────────────────────── */}
      <section className="homepage-oss">
        <div className="homepage-oss-inner">
          <p className="homepage-oss-headline">Free forever, open source, community-driven.</p>
          <div className="homepage-oss-row">
            <div className="homepage-oss-links">
              <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" className="homepage-oss-link">
                ★ GitHub
              </a>
              <span className="homepage-oss-pill">MIT License</span>
              <span className="homepage-oss-pill">No account required</span>
            </div>
            <div className="homepage-oss-providers">
              <span className="homepage-provider-badge">FLUX</span>
              <span className="homepage-provider-badge">Stable Diffusion</span>
              <span className="homepage-provider-badge">Llama 3.3</span>
              <span className="homepage-provider-badge">Kokoro</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="homepage-final-cta">
        <div className="homepage-final-cta-card">
          <div className="orb orb-purple homepage-final-orb" />
          <h2 className="homepage-final-title">Ready to create?</h2>
          <p className="homepage-final-sub">No account. No card. Just open a studio and start.</p>
          <div className="homepage-final-btns">
            <Link href="/pixel/studio" className="homepage-cta-primary">Start with Pixel Studio →</Link>
            <Link href="/tools" className="homepage-cta-ghost">Explore free tools →</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
