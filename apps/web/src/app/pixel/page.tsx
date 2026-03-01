import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Pixel — AI Pixel Art Generator for Game Developers',
  description:
    'Generate pixel art sprites, animations, tilesets, and game-ready assets with AI. ' +
    'Free standard generation. HD quality with Replicate.',
  keywords: [
    'pixel art generator', 'AI game assets', 'sprite generator',
    'tileset generator', 'RPG icons', 'pixel art AI', 'FLUX pixel art',
    'game asset generator', 'pixel art sprites',
  ],
  openGraph: {
    title: 'WokGen Pixel — AI Pixel Art Generator',
    description: 'Generate sprites, animations, tilesets, and game-ready assets with AI.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const FEATURES = [
  { label: 'Free Forever', desc: 'Unlimited standard generation, no account required for basic use.' },
  { label: 'HD Quality',   desc: 'Replicate FLUX for crisp, high-detail pixel art on paid plans.' },
  { label: 'GIF Animation', desc: 'Generate multi-frame sprite animations as looping GIFs.' },
  { label: 'Game-Ready',   desc: 'Pixel-perfect sizes: 32px, 64px, 128px, 256px, 512px.' },
];

const TOOLS = [
  { id: 'generate', label: 'Generate', desc: 'Create a single pixel art asset from a prompt. 18 style presets, category and era controls.', example: 'warrior RPG sprite, front-facing, 64x64' },
  { id: 'animate',  label: 'Animate',  desc: 'Generate animated sprite sequences as GIFs. Idle, walk, run, attack, and effect presets.', example: 'fire mage character, idle animation, 8 frames' },
  { id: 'scene',    label: 'Scene',    desc: 'Generate cohesive tilesets and environmental scenes with consistent palette.', example: 'dungeon stone floor tileset, dark atmosphere' },
  { id: 'rotate',   label: 'Rotate',   desc: 'Generate multi-directional character views: front, back, left, right.', example: 'knight character, all 4 directions, consistent style' },
  { id: 'inpaint',  label: 'Inpaint',  desc: 'Edit or extend an existing pixel art image with a brush mask.', example: 'add a glowing sword to the existing warrior sprite' },
];

const SHOWCASE = [
  { prompt: 'RPG warrior with shield, pixel art, 64x64, NES style', label: 'RPG Warrior' },
  { prompt: 'Dungeon stone tileset, seamless, dark atmosphere', label: 'Dungeon Tiles' },
  { prompt: 'Magic fireball effect, bright orange, looping animation', label: 'Fire Effect' },
  { prompt: 'Pixel art chest item, wooden, golden lock, inventory icon', label: 'Chest Item' },
  { prompt: 'Side-scroll platformer character, idle pose, pixel art', label: 'Platformer Char' },
  { prompt: 'Green slime monster, RPG enemy, cute pixel art, 32x32', label: 'Slime Monster' },
];

export default function PixelLanding() {
  return (
    <div className="mode-landing mode-landing--pixel">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: 'var(--accent)' }} />
              <span>WokGen Pixel</span>
            </div>
            <h1 className="landing-h1">
              Game asset generation.<br />
              <span style={{ color: 'var(--accent)' }}>Pixel-perfect.</span>
            </h1>
            <p className="landing-desc">
              Sprites, animations, tilesets, and game-ready assets — generated with AI.
              Free standard quality. HD for serious projects.
            </p>
            <div className="landing-cta-row">
              <Link href="/pixel/studio" className="btn-primary btn-lg">
                Open Pixel Studio →
              </Link>
              <Link href="/pixel/gallery" className="btn-ghost btn-lg">
                Browse Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature callouts ──────────────────────────────────────────── */}
      <section className="landing-features">
        {FEATURES.map(f => (
          <div key={f.label} className="landing-feature-card">
            <span className="landing-feature-icon"></span>
            <div>
              <div className="landing-feature-label">{f.label}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Tools ─────────────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-h2">Tools</h2>
          <p className="landing-section-desc">Five specialized generation tools, each tuned for a different game art workflow.</p>
          <div className="landing-tools-grid">
            {TOOLS.map(t => (
              <div key={t.id} className="landing-tool-card">
                <div className="landing-tool-header">
                                    <span className="landing-tool-label">{t.label}</span>
                </div>
                <p className="landing-tool-desc">{t.desc}</p>
                <Link
                  href={`/pixel/studio?tool=${t.id}&prompt=${encodeURIComponent(t.example)}`}
                  className="landing-tool-example"
                >
                  <span className="landing-tool-example-label">Try:</span>
                  <span className="landing-tool-example-prompt">{t.example}</span>
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase prompts ──────────────────────────────────────────── */}
      <section className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <h2 className="landing-h2">What you can make</h2>
          <p className="landing-section-desc">Click any prompt to open it in Pixel mode.</p>
          <div className="landing-showcase-grid">
            {SHOWCASE.map(s => (
              <Link
                key={s.label}
                href={`/pixel/studio?prompt=${encodeURIComponent(s.prompt)}`}
                className="landing-showcase-card"
              >
                <div className="landing-showcase-label">{s.label}</div>
                <div className="landing-showcase-prompt">{s.prompt}</div>
                <div className="landing-showcase-cta">Try this →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WokSpec CTA ───────────────────────────────────────────────── */}
      <section className="landing-wokspec">
        <div className="landing-wokspec-inner">
          <p className="landing-wokspec-text">
            Need production-ready game asset packs? WokSpec delivers full pipelines.
          </p>
          <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
            WokSpec Services →
          </a>
        </div>
      </section>

    </div>
  );
}
