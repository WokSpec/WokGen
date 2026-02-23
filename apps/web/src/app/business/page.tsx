import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Business — AI Brand Asset Generator',
  description:
    'Generate logos, brand kits, slide visuals, social banners, and web hero images with AI. ' +
    'Professional-quality business assets in seconds.',
  keywords: [
    'brand asset generator', 'AI logo maker', 'social banner generator',
    'AI brand kit', 'slide background AI', 'web hero image AI',
    'business asset generator', 'FLUX brand assets',
  ],
  openGraph: {
    title: 'WokGen Business — AI Brand Asset Generator',
    description: 'Generate logos, brand kits, slide visuals, social banners with AI.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const FEATURES = [
  { label: 'Logo Generation',  desc: 'Minimal brand marks and symbol icons, clean isolated backgrounds.' },
  { label: 'Brand Kit (4×)',   desc: 'Generate a coherent 4-image brand set in one click.' },
  { label: 'Slide Visuals',    desc: '16:9, 4:3, and square backgrounds for decks and keynotes.' },
  { label: 'Social Banners',   desc: 'Platform-correct sizes: Twitter, Instagram, LinkedIn, YouTube, OG.' },
];

const TOOLS = [
  {
    id: 'logo', label: 'Logo',
    desc: 'Symbol-first logo generation. Isolated on clean backgrounds, scalable to any size. 8 style presets from minimal flat to bold geometric.',
    example: 'FinTech startup focused on international payments, minimal, trustworthy',
  },
  {
    id: 'brand-kit', label: 'Brand Kit',
    desc: 'Fire 4 parallel generations: logo mark, brand banner, profile image, OG meta. All from one concept, consistent visual language.',
    example: 'Creative agency specializing in branding and digital design, bold and modern',
  },
  {
    id: 'slide', label: 'Slide Asset',
    desc: 'Full-bleed presentation backgrounds with text-safe zones. 16:9 widescreen, 4:3 standard, 1:1 square formats.',
    example: 'SaaS product launch keynote, dark tech style, subtle circuit board texture',
  },
  {
    id: 'social', label: 'Social Banner',
    desc: 'Platform-smart sizing. Select your target platform and get pixel-perfect dimensions automatically.',
    example: 'New feature announcement for a productivity app, clean minimal flat design',
  },
  {
    id: 'web-hero', label: 'Web Hero',
    desc: 'Full-resolution hero backgrounds with configurable text zones. 1920×1080 by default, designed for web.',
    example: 'Developer tools company, dark atmospheric background, subtle code texture',
  },
];

const USE_CASES = [
  {
    title: 'Brand Identity',
    items: ['Startup logos', 'Brand kits', 'Icon marks', 'Visual identity'],
    prompt: 'fast-growing climate tech startup, minimal, clean, trustworthy',
  },
  {
    title: 'Marketing & Social',
    items: ['Twitter / X headers', 'Instagram posts', 'LinkedIn banners', 'OG / meta images'],
    prompt: 'product launch announcement, bold geometric style, high contrast',
  },
  {
    title: 'Presentations & Web',
    items: ['Pitch deck backgrounds', 'Keynote slide art', 'Hero images', 'Blog header art'],
    prompt: 'SaaS pitch deck background, gradient modern, professional blue tones',
  },
];

export default function BusinessLanding() {
  return (
    <div className="mode-landing mode-landing--business">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#60a5fa' }} />
              <span>WokGen Business</span>
            </div>
            <h1 className="landing-h1">
              Professional assets.<br />
              <span style={{ color: '#60a5fa' }}>Generated in seconds.</span>
            </h1>
            <p className="landing-desc">
              Logos, brand kits, slide visuals, social banners, and web heroes — all with AI.
              HD quality for serious work.
            </p>
            <div className="landing-cta-row">
              <Link href="/business/studio" className="btn-primary btn-lg">
                Open Business Studio →
              </Link>
              <Link href="/business/gallery" className="btn-ghost btn-lg">
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
          <h2 className="landing-h2">Five business tools</h2>
          <p className="landing-section-desc">
            Each tool is tuned for a specific output type, with the right dimensions, prompt logic, and quality settings baked in.
          </p>
          <div className="landing-tools-grid">
            {TOOLS.map(t => (
              <div key={t.id} className="landing-tool-card">
                <div className="landing-tool-header">
                                    <span className="landing-tool-label">{t.label}</span>
                </div>
                <p className="landing-tool-desc">{t.desc}</p>
                <Link
                  href={`/business/studio?tool=${t.id}&prompt=${encodeURIComponent(t.example)}`}
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

      {/* ── Use cases ─────────────────────────────────────────────────── */}
      <section className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <h2 className="landing-h2">Use cases</h2>
          <div className="landing-usecases-grid">
            {USE_CASES.map(uc => (
              <div key={uc.title} className="landing-usecase-card">
                <h3 className="landing-usecase-title">{uc.title}</h3>
                <ul className="landing-usecase-list">
                  {uc.items.map(item => <li key={item}>{item}</li>)}
                </ul>
                <Link
                  href={`/business/studio?prompt=${encodeURIComponent(uc.prompt)}`}
                  className="landing-usecase-link"
                >
                  Try an example →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WokSpec CTA ───────────────────────────────────────────────── */}
      <section className="landing-wokspec">
        <div className="landing-wokspec-inner">
          <p className="landing-wokspec-text">
            Need a complete brand system built by professionals? WokSpec delivers.
          </p>
          <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
            WokSpec Brand Services →
          </a>
        </div>
      </section>

    </div>
  );
}
