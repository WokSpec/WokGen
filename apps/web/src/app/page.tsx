import type { Metadata } from 'next';
import Link from 'next/link';
import { StatBar } from './_components/StatBar';

export const metadata: Metadata = {
  title: 'WokGen — AI Asset Generation Platform',
  description:
    'WokGen Studio — one platform with modes for pixel art, brand systems, vectors, UI components, voice, and text.',
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
    label: 'Pixel Art',
    accent: '#a78bfa',
    status: 'live',
    tagline: 'For game developers',
    highlights: ['Sprites & Characters', 'Tilesets & Scenes', 'GIF Animations'],
  },
  {
    id: 'business',
    label: 'Brand',
    accent: '#60a5fa',
    status: 'live',
    tagline: 'For brands and teams',
    highlights: ['Brand Logos & Kits', 'Social Banners', 'Web Hero Images'],
  },
  {
    id: 'vector',
    label: 'Vector',
    accent: '#34d399',
    status: 'live',
    tagline: 'For design systems',
    highlights: ['SVG Icon Packs', 'Illustration Sets', 'UI Kits'],
  },
  {
    id: 'uiux',
    label: 'UI/UX',
    accent: '#f472b6',
    status: 'live',
    tagline: 'For product teams',
    highlights: ['React Components', 'Tailwind Sections', 'Page Templates'],
  },
  {
    id: 'voice',
    label: 'Voice',
    accent: '#f59e0b',
    status: 'live',
    tagline: 'Speech & Audio',
    highlights: ['Character Narration', 'Game NPC Dialogue', 'Podcast Intros'],
  },
  {
    id: 'code',
    label: 'Code',
    accent: '#10b981',
    status: 'live',
    tagline: 'AI code generation',
    highlights: ['React Components', 'SQL Queries', 'Documentation'],
  },
];

const TOOL_CATEGORIES = [
  { icon: 'img', name: 'Image Tools',     count: 12, examples: ['Background Remover', 'Image Resizer', 'Format Converter'] },
  { icon: 'dev', name: 'Dev Tools',        count: 14, examples: ['JSON Toolkit', 'CSS Generator', 'Regex Tester'] },
  { icon: 'game', name: 'Game Dev',         count: 8,  examples: ['Sprite Packer', 'Tilemap Builder', 'Asset Manifest'] },
  { icon: 'design', name: 'Design',           count: 10, examples: ['Color Palette', 'Font Pairer', 'Gradient Builder'] },
  { icon: 'text', name: 'Text & Business', count: 8,  examples: ['README Generator', 'Changelog Writer', 'Word Counter'] },
  { icon: 'audio', name: 'Audio & Media',    count: 4,  examples: ['Waveform Viewer', 'Transcriber', 'Media Downloader'] },
];

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
            <span>The AI platform for builders</span>
          </div>
          <h1 className="homepage-h1">
            One studio.<br />
            <span className="gradient-text">Everything you need.</span>
          </h1>
          <p className="homepage-hero-sub">
            Generate assets, manage projects, and plan everything with Eral 7c — your AI creative director. Free to start.
          </p>
          <div className="homepage-hero-ctas">
            <Link href="/studio" className="homepage-cta-primary">
              Open Studio →
            </Link>
            <Link href="/community" className="homepage-cta-ghost">
              Browse Gallery
            </Link>
          </div>
          <StatBar />
        </div>
      </section>

      {/* ── Studio Capabilities ──────────────────────────────────────── */}
      <section className="homepage-modes">
        <div className="homepage-section-inner">
          <div className="homepage-section-head">
            <h2 className="homepage-section-title">WokGen Studio</h2>
            <p className="homepage-section-sub">One platform. Every asset type. Pixel art, brand kits, vectors, UI, voice, and code — all in one place.</p>
          </div>
          <div className="homepage-modes-grid">
            {MODES.map(mode => (
              <Link
                key={mode.id}
                href={`/studio?type=${mode.id}`}
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
                <span className="homepage-mode-cta">Open in Studio →</span>
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
              60+ free tools.<br />
              <span className="gradient-text">No signup required.</span>
            </h2>
            <p className="homepage-section-sub">Browser-native utilities. Open, use, close. No accounts, no server uploads, no paywalls.</p>
          </div>
          <div className="homepage-tools-grid">
            {TOOL_CATEGORIES.map(cat => (
              <div key={cat.name} className="homepage-tool-card">
                <div className="homepage-tool-icon">{cat.icon}</div>
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

      {/* WokAPI section */}
      <section className="homepage-wokapi">
        <div className="homepage-section-inner">
          <div className="homepage-wokapi-grid">
            <div className="homepage-wokapi-left">
              <div className="homepage-eyebrow-pill">For Developers</div>
              <h2 className="homepage-section-title">
                Build with <span className="gradient-text">WokAPI.</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: '420px' }}>
                Programmatic access to every WokGen tool. Generate assets, remove backgrounds, and chat with Eral 7c from your own app.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a className="homepage-cta-primary" href="/developers">View WokAPI docs</a>
                <a className="homepage-cta-ghost" href="/account/api-keys">Get API key</a>
              </div>
            </div>
            <div className="homepage-wokapi-right">
              <div className="homepage-code-block">
                <div className="homepage-code-header">
                  <span className="homepage-code-dot"></span>
                  <span className="homepage-code-dot"></span>
                  <span className="homepage-code-dot"></span>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>@wokspec/sdk</span>
                </div>
                <pre className="homepage-code-body"><code>{`import WokGen from '@wokspec/sdk';

const wok = new WokGen({ apiKey: 'wok_...' });

const asset = await wok.generate({
  prompt: 'pixel art wizard, 32x32',
  mode: 'pixel',
});

console.log(asset.url);
// → https://cdn.wokgen.io/...`}</code></pre>
              </div>
            </div>
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
                Meet <strong>Eral 7c</strong>, your<br />
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
                    <strong>1.</strong> A moody hero background · Pixel mode<br />
                    <strong>2.</strong> Logo mark with runic typography · Business mode<br />
                    <strong>3.</strong> UI button set in stone/metal style · UI/UX mode
                    <br /><br />
                    Want me to queue all three?
                  </div>
                  <div className="homepage-chat-msg homepage-chat-user">
                    Yes, queue them all.
                  </div>
                  <div className="homepage-chat-msg homepage-chat-eral">
                    ✓ Queued 3 generation tasks. Opening Pixel mode first…
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
          <p className="homepage-final-sub">No account. No card. Just open a mode and start.</p>
          <div className="homepage-final-btns">
            <Link href="/studio" className="homepage-cta-primary">Open WokGen Studio →</Link>
            <Link href="/tools" className="homepage-cta-ghost">Explore free tools →</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
