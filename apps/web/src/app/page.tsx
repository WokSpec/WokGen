import type { Metadata } from 'next';
import Link from 'next/link';
import { MODES_LIST } from '@/lib/modes';

export const metadata: Metadata = {
  title: 'WokGen — AI Generation Studio',
  description: 'Studio for pixel art, brand assets, vectors, UI components, voice, and code. One workspace, every asset type.',
  keywords: ['AI asset generator', 'pixel art AI', 'brand asset generator', 'sprite generator', 'AI logo maker', 'WokGen', 'WokSpec'],
  openGraph: {
    title: 'WokGen — AI Generation Studio',
    description: 'Studio for pixel art, brand assets, vectors, UI components, voice, and code.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const MODE_META: Record<string, { desc: string; accent: string }> = {
  pixel:    { desc: 'Sprites, tilesets, game-ready asset packs', accent: '#a78bfa' },
  business: { desc: 'Logos, brand kits, social visuals',         accent: '#60a5fa' },
  vector:   { desc: 'SVG icon sets, illustrations, graphics',    accent: '#34d399' },
  uiux:     { desc: 'React components, Tailwind sections',        accent: '#f472b6' },
  voice:    { desc: 'TTS narration and audio assets',            accent: '#f59e0b' },
  code:     { desc: 'Components, docs, SQL, boilerplate',        accent: '#10b981' },
};

const PROVIDERS = ['FLUX', 'Stable Diffusion', 'Llama 3.3', 'Kokoro', 'Real-ESRGAN', 'MusicGen', 'BLIP', 'Groq'];

// ── Mode card icons ───────────────────────────────────────────────────────────

function PixelCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" opacity="0.65" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" opacity="0.45" />
    </svg>
  );
}

function VectorCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="2.5" cy="13.5" r="1.5" />
      <circle cx="13.5" cy="2.5" r="1.5" />
      <path d="M2.5 12C2.5 7 7 6 9 6C11 6 13.5 4 13.5 4" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BrandCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1.5 4.5h9l3 4-3 4H1.5l2.5-4-2.5-4z" strokeLinejoin="round" />
      <circle cx="6" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UiuxCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="1" y="2" width="14" height="12" rx="1.5" />
      <line x1="1" y1="6" x2="15" y2="6" />
      <rect x="2.5" y="7.5" width="4.5" height="4" rx="0.5" />
      <line x1="8.5" y1="8" x2="13" y2="8" />
      <line x1="8.5" y1="10.5" x2="11" y2="10.5" />
    </svg>
  );
}

function VoiceCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1"   y="6"   width="2" height="4"  rx="1" />
      <rect x="4.5" y="4"   width="2" height="8"  rx="1" />
      <rect x="7"   y="1.5" width="2" height="13" rx="1" />
      <rect x="9.5" y="4"   width="2" height="8"  rx="1" />
      <rect x="13"  y="6"   width="2" height="4"  rx="1" />
    </svg>
  );
}

function CodeCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 4 1 8 5 12" />
      <polyline points="11 4 15 8 11 12" />
      <line x1="9.5" y1="2.5" x2="6.5" y2="13.5" />
    </svg>
  );
}

const MODE_ICONS: Record<string, () => React.JSX.Element> = {
  pixel: PixelCardIcon,
  vector: VectorCardIcon,
  business: BrandCardIcon,
  uiux: UiuxCardIcon,
  voice: VoiceCardIcon,
  code: CodeCardIcon,
};

export default function HomePage() {
  return (
    <div className="homepage-root min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-16 sm:pt-28 pb-16 sm:pb-24 overflow-hidden">
        <div className="hero-glow" aria-hidden="true" />

        {/* Status badge */}
        <div className="relative z-10 hero-status-badge">
          <span className="hero-status-dot" />
          AI Generation Studio — Free Forever
        </div>

        {/* Wordmark */}
        <h1 className="relative z-10 hero-wordmark gradient-text">
          WokGen
        </h1>

        <p className="relative z-10 hero-desc text-center">
          Generate pixel art, vectors, UI components, voice, music, and business assets —
          powered by 10+ free AI services. No credit card, no limits.
        </p>

        <div className="relative z-10 flex gap-3 flex-wrap justify-center">
          <Link href="/pixel/studio" className="hero-btn-primary">
            Start Creating
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7h8M8 4l3 3-3 3" />
            </svg>
          </Link>
          <Link href="/tools" className="hero-btn-secondary">
            Browse Tools
          </Link>
        </div>

        {/* Quick-try prompt examples */}
        <div className="relative z-10 flex flex-wrap justify-center gap-2 mt-8">
          {[
            { label: 'RPG warrior sprite', href: '/pixel/studio?prompt=RPG+warrior+sprite%2C+64x64%2C+pixel+art' },
            { label: 'Startup logo',       href: '/business/studio?prompt=minimal+startup+logo%2C+clean+and+modern' },
            { label: 'SVG icon set',       href: '/vector/studio?prompt=dashboard+UI+icons%2C+24px%2C+outline+style' },
            { label: 'Pricing component',  href: '/uiux/studio?prompt=pricing+card+with+3+tiers%2C+Tailwind%2C+dark+theme' },
            { label: 'Voiceover',          href: '/voice/studio?prompt=Welcome+to+our+platform%2C+warm+and+professional' },
          ].map((ex) => (
            <Link key={ex.label} href={ex.href} className="hero-prompt-chip">
              {ex.label} →
            </Link>
          ))}
        </div>
      </section>

      {/* ── Studio Modes ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <span className="landing-section-label">Studios</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {MODES_LIST.map((mode) => {
            const Icon = MODE_ICONS[mode.id] ?? PixelCardIcon;
            const meta = MODE_META[mode.id];
            const accent = meta?.accent ?? mode.accentColor ?? 'var(--accent)';
            return (
              <Link
                key={mode.id}
                href={mode.routes.studio}
                className="mode-card"
                style={{ '--card-accent': accent } as React.CSSProperties}
              >
                <div className="mode-card__icon">
                  <Icon />
                </div>
                <div className="mode-card__body">
                  <span className="mode-card__name">
                    {mode.label}
                    {mode.status !== 'stable' && (
                      <span className="mode-card__badge">
                        {mode.status === 'beta' ? 'Beta' : 'Soon'}
                      </span>
                    )}
                  </span>
                  <span className="mode-card__desc">{meta?.desc ?? ''}</span>
                </div>
                <div className="mode-card__arrow">→</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <span className="landing-section-label">How it works</span>
        <div className="how-it-works">
          <div className="how-step">
            <div className="how-step__num">1</div>
            <div className="how-step__title">Write a prompt</div>
            <div className="how-step__desc">Describe what you want or use Prompt Lab to refine it with AI.</div>
          </div>
          <div className="how-step">
            <div className="how-step__num">2</div>
            <div className="how-step__title">AI generates</div>
            <div className="how-step__desc">Multi-provider routing picks the best free model for your asset type.</div>
          </div>
          <div className="how-step">
            <div className="how-step__num">3</div>
            <div className="how-step__title">Download & use</div>
            <div className="how-step__desc">Export PNG, SVG, WAV, or code — yours to use, forever, for free.</div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <span className="landing-section-label">Why WokGen</span>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </span>
            <div className="feature-card__title">Free by default</div>
            <div className="feature-card__desc">No credit card required. 10+ free AI services integrated. Generate all day without spending a cent.</div>
          </div>
          <div className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="13.5" cy="6.5" r="4.5"/><path d="M9 12L3 21h8l2-3 2 3h8l-6-9"/></svg>
            </span>
            <div className="feature-card__title">All asset types</div>
            <div className="feature-card__desc">Pixel art, vectors, UI components, voice narration, music, business assets, and generated code — one platform.</div>
          </div>
          <div className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </span>
            <div className="feature-card__title">API access</div>
            <div className="feature-card__desc">Programmatic generation via REST API. TypeScript SDK, webhook support, and full endpoint reference included.</div>
          </div>
          <div className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
            </span>
            <div className="feature-card__title">Team workspace</div>
            <div className="feature-card__desc">Projects, brand kits, shared gallery, export pipelines. Collaborate across your team on one asset library.</div>
          </div>
        </div>
      </section>

      {/* ── Free Services ────────────────────────────────────── */}
      <section className="home-free-services max-w-4xl mx-auto px-6 pb-20">
        {/* Section heading */}
        <div className="home-section-header">
          <h2 className="landing-section-h2">
            Powered by <span className="accent">10+ free AI services</span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-8">Zero API cost by default. Add your free keys to unlock more.</p>
        </div>
        <div className="home-services-grid">
          {[
            { name: 'FLUX.1-schnell', role: 'Image generation', free: true, via: 'Pollinations' },
            { name: 'Stable Diffusion', role: '30+ SD models', free: true, via: 'Prodia' },
            { name: 'Stable Horde', role: 'Federated GPU pool', free: true, via: 'Community' },
            { name: 'Llama 3.3 70B', role: 'Prompt enhancement', free: true, via: 'Groq' },
            { name: 'Llama 3.3 70B', role: 'Ultra-fast inference', free: true, via: 'Cerebras' },
            { name: 'Gemini Flash 2.0', role: 'Multimodal analysis', free: true, via: 'Google' },
            { name: 'Real-ESRGAN', role: '4× image upscaling', free: true, via: 'HuggingFace' },
            { name: 'BLIP', role: 'Image interrogation', free: true, via: 'Salesforce' },
            { name: 'MusicGen', role: 'Music generation', free: true, via: 'Meta' },
            { name: 'Freesound + Pixabay', role: 'CC0 media library', free: true, via: 'Community' },
          ].map((s) => (
            <div key={s.name + s.role} className="home-service-card">
              <span className="home-service-badge">FREE</span>
              <strong>{s.name}</strong>
              <span>{s.role}</span>
              <small>via {s.via}</small>
            </div>
          ))}
        </div>
      </section>

      {/* ── Eral ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <span className="landing-section-label">AI Director</span>
            <h2 className="landing-section-h2 landing-section-h2--mb">Eral</h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-6 max-w-xs text-sm">
              Describe what you&apos;re building. Eral plans your asset pipeline, routes tasks to the right studio, and maintains context across your project.
            </p>
            <Link href="/eral" className="btn btn-primary btn-sm">
              Open Eral
            </Link>
          </div>
          <div className="landing-demo-card">
            <div className="landing-demo-card__header">
              <div className="landing-demo-card__dot" />
              <span className="text-xs font-semibold text-[var(--text-muted)]">Eral</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="landing-demo-msg landing-demo-msg--user">
                I need assets for a dark fantasy RPG main menu.
              </div>
              <div className="landing-demo-msg landing-demo-msg--ai">
                Here&apos;s what I&apos;d queue:<br /><br />
                <strong>1.</strong> Hero background — Pixel mode<br />
                <strong>2.</strong> Logo with runic type — Brand mode<br />
                <strong>3.</strong> UI button set — UI/UX mode<br /><br />
                Queue all three?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── API ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <span className="landing-section-label">Programmatic</span>
            <h2 className="landing-section-h2 landing-section-h2--mb">API</h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-6 max-w-xs text-sm">
              Programmatic access to every studio. Integrate generation into your own tools, pipelines, and workflows.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="/developers" className="btn btn-primary btn-sm">
                Docs
              </a>
              <a href="/account/api-keys" className="btn btn-secondary btn-sm">
                API Keys
              </a>
            </div>
          </div>
          <div className="landing-demo-card">
            <div className="landing-demo-card__header">
              <div className="landing-demo-card__dots">
                <div className="landing-demo-card__dot landing-demo-card__dot--red" />
                <div className="landing-demo-card__dot landing-demo-card__dot--amber" />
                <div className="landing-demo-card__dot landing-demo-card__dot--green" />
              </div>
              <span className="ml-2 text-xs text-[var(--text-faint)]">@wokspec/sdk</span>
            </div>
            <pre
              className="p-4 text-xs leading-relaxed overflow-x-auto text-[var(--text-secondary)] landing-code-block"
            >
              <code>{`import WokGen from '@wokspec/sdk';

const wok = new WokGen({ apiKey: 'wok_...' });

const asset = await wok.generate({
  prompt: 'pixel art wizard, 32x32',
  mode: 'pixel',
});

console.log(asset.url);`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="landing-cta-box">
          <div className="landing-cta-box__glow" aria-hidden="true" />
          <h2 className="landing-cta-h2 gradient-text">
            Start generating for free
          </h2>
          <p className="relative text-[var(--text-muted)] text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            No account required for basic generation. 10+ free AI services, all asset types, no watermarks.
          </p>
          <div className="relative flex gap-3 justify-center flex-wrap">
            <Link href="/pixel/studio" className="hero-btn-primary">
              Open Pixel Studio
            </Link>
            <Link href="/prompt-lab" className="hero-btn-secondary">
              ✦ Prompt Lab
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer strip ─────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-sm">
            <span className="footer-version-badge">v0.1</span>
            <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">GitHub</a>
            <a href="/gallery" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Gallery</a>
            <a href="/changelog" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Changelog</a>
            <a href="/docs" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {PROVIDERS.map((p) => (
              <span key={p} className="provider-chip">{p}</span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
