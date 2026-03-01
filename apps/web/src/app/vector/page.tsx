import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Vector — AI SVG Icon & Illustration Generator',
  description: 'Generate scalable SVG icons, illustration libraries, and design system components with AI. Clean vectors, free forever.',
  openGraph: {
    title: 'WokGen Vector — AI SVG Generator',
    description: 'Generate scalable SVG icons and illustrations with AI.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const FEATURES = [
  { icon: '🖊️', label: 'True SVG Output', desc: 'Real scalable vectors — not rasterised PNGs. Export as .svg, .pdf, or copy inline.' },
  { icon: '📦', label: 'Icon Sets',       desc: 'Generate 24+ icon sets in one batch. Consistent stroke weight, style, and sizing.' },
  { icon: '🎨', label: 'Style Presets',   desc: '12 built-in styles: outline, filled, duotone, brutal, soft, minimal, and more.' },
  { icon: '🆓', label: 'Free to Use',     desc: 'All free-tier output is CC0 — use in commercial projects with zero attribution.' },
];

const TOOLS = [
  { id: 'icons',   label: 'Icon Set',    desc: 'Generate a cohesive icon set from a single descriptive prompt. Up to 32 icons per batch.', example: 'dashboard UI icons: home, settings, user, search, bell' },
  { id: 'logo',    label: 'Logo Mark',   desc: 'Create minimalist brand logos and symbol marks with transparent backgrounds.', example: 'geometric mountain logo mark, teal and midnight blue' },
  { id: 'illus',   label: 'Illustration', desc: 'Generate flat or editorial illustrations for landing pages, blogs, or marketing.', example: 'abstract SaaS product hero illustration, purple and orange' },
  { id: 'chart',   label: 'Diagram',     desc: 'Produce infographic-style diagrams, flowcharts, or system architecture visuals.', example: 'API authentication flow diagram, minimal style' },
  { id: 'pattern', label: 'Pattern',     desc: 'Seamless tileable vector patterns for backgrounds, textures, or fabric design.', example: 'geometric hexagon pattern, dark navy and gold' },
];

const SHOWCASE = [
  { prompt: 'E-commerce icon set: cart, payment, delivery, review, star, heart', label: 'E-commerce Icons' },
  { prompt: 'Abstract AI startup logo, circuit motif, electric blue', label: 'AI Startup Logo' },
  { prompt: 'Flat team collaboration illustration, diverse people, warm colors', label: 'Team Illustration' },
  { prompt: 'Microservices architecture diagram, clean lines, minimal color', label: 'Architecture Diagram' },
  { prompt: 'Social media icon set: Instagram, Twitter, LinkedIn, TikTok, YouTube', label: 'Social Media Set' },
  { prompt: 'Isometric tech icons: cloud, server, database, code, shield', label: 'Isometric Tech' },
];

export default function VectorLanding() {
  return (
    <div className="mode-landing mode-landing--vector">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              <span>WokGen Vector</span>
            </div>
            <h1 className="landing-h1">
              SVG icons &amp; illustrations.<br />
              <span className="landing-h1-accent">Infinitely scalable.</span>
            </h1>
            <p className="landing-desc">
              True vector output — not rasterised images. Icon sets, logo marks, illustrations,
              and diagrams generated with AI and exported as clean SVG.
            </p>
            <div className="landing-cta-row">
              <Link href="/vector/studio" className="btn-primary btn-lg">Open Vector Studio →</Link>
              <Link href="/vector/gallery" className="btn-ghost btn-lg">Browse Gallery</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map(f => (
          <div key={f.label} className="landing-feature-card">
            <span className="landing-feature-icon">{f.icon}</span>
            <div>
              <div className="landing-feature-label">{f.label}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-h2">Tools</h2>
          <p className="landing-section-desc">Five vector generation tools — from single icons to full illustration libraries.</p>
          <div className="landing-tools-grid">
            {TOOLS.map(t => (
              <div key={t.id} className="landing-tool-card">
                <div className="landing-tool-header"><span className="landing-tool-label">{t.label}</span></div>
                <p className="landing-tool-desc">{t.desc}</p>
                <Link href={`/vector/studio?tool=${t.id}&prompt=${encodeURIComponent(t.example)}`} className="landing-tool-example">
                  <span className="landing-tool-example-label">Try:</span>
                  <span className="landing-tool-example-prompt">{t.example}</span>
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <h2 className="landing-h2">What you can make</h2>
          <p className="landing-section-desc">Click any prompt to open it in Vector mode.</p>
          <div className="landing-showcase-grid">
            {SHOWCASE.map(s => (
              <Link key={s.label} href={`/vector/studio?prompt=${encodeURIComponent(s.prompt)}`} className="landing-showcase-card">
                <div className="landing-showcase-label">{s.label}</div>
                <div className="landing-showcase-prompt">{s.prompt}</div>
                <div className="landing-showcase-cta">Try this →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-wokspec">
        <div className="landing-wokspec-inner">
          <p className="landing-wokspec-text">Need production-ready icon libraries or brand systems? WokSpec delivers full pipelines.</p>
          <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">WokSpec Services →</a>
        </div>
      </section>
    </div>
  );
}
