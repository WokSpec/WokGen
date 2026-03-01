import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen UI/UX — AI Component & Design System Generator',
  description: 'Generate React components, design system tokens, wireframes, and UI mockups with AI. Ship faster.',
  openGraph: {
    title: 'WokGen UI/UX — AI Component Generator',
    description: 'Generate React components, design tokens, and UI mockups with AI.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const FEATURES = [
  { icon: '⚛️',  label: 'React Output',    desc: 'Copy-paste ready JSX with Tailwind or CSS modules — no framework lock-in.' },
  { icon: '🎛️', label: 'Design Tokens',   desc: 'Export color, typography, spacing, and shadow tokens as CSS variables or JSON.' },
  { icon: '🖼️', label: 'Wireframes',      desc: 'Generate low-fidelity wireframes to validate layout before coding.' },
  { icon: '⚡',  label: 'Instant Preview', desc: 'Live rendered component preview in the studio — see it before you copy it.' },
];

const TOOLS = [
  { id: 'component', label: 'Component',    desc: 'Generate a single React component from a description. Tailwind or vanilla CSS output.', example: 'pricing card with tier comparison table, dark theme' },
  { id: 'system',    label: 'Design System', desc: 'Generate a full design system: color palette, typography, spacing scale, and component set.', example: 'minimal SaaS design system, slate neutrals, violet accent' },
  { id: 'wireframe', label: 'Wireframe',    desc: 'Create low-fi wireframe layouts for web pages or mobile screens.', example: 'SaaS dashboard wireframe with sidebar nav and chart area' },
  { id: 'tokens',    label: 'Tokens',       desc: 'Export design tokens as CSS custom properties, Tailwind config, or JSON.', example: 'dark mode token set, contrast-checked, WCAG AA' },
  { id: 'mockup',    label: 'Mockup',       desc: 'Generate high-fidelity UI mockups for landing pages or feature screens.', example: 'mobile onboarding screen, friendly and modern' },
];

const SHOWCASE = [
  { prompt: 'Auth modal with email/password fields and Google OAuth button, minimal dark', label: 'Auth Modal' },
  { prompt: 'SaaS pricing table, 3 tiers, annual/monthly toggle, highlight middle tier', label: 'Pricing Table' },
  { prompt: 'Dashboard sidebar nav with icons, collapsible sections, dark theme', label: 'Sidebar Nav' },
  { prompt: 'Toast notification system, 4 variants: success, error, warning, info', label: 'Toast System' },
  { prompt: 'Data table with sorting, filtering, pagination, and row selection', label: 'Data Table' },
  { prompt: 'File upload dropzone with progress bar and file type validation UI', label: 'Upload Zone' },
];

export default function UIUXLanding() {
  return (
    <div className="mode-landing mode-landing--uiux">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              <span>WokGen UI/UX</span>
            </div>
            <h1 className="landing-h1">
              Components &amp; design systems.<br />
              <span className="landing-h1-accent">Ship faster.</span>
            </h1>
            <p className="landing-desc">
              Generate React components, wireframes, design tokens, and full design systems
              with AI. Copy-paste ready code. Ship in minutes, not days.
            </p>
            <div className="landing-cta-row">
              <Link href="/uiux/studio" className="btn-primary btn-lg">Open UI/UX Studio →</Link>
              <Link href="/uiux/gallery" className="btn-ghost btn-lg">Browse Gallery</Link>
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
          <p className="landing-section-desc">Five UI tools for every stage of the design-to-code pipeline.</p>
          <div className="landing-tools-grid">
            {TOOLS.map(t => (
              <div key={t.id} className="landing-tool-card">
                <div className="landing-tool-header"><span className="landing-tool-label">{t.label}</span></div>
                <p className="landing-tool-desc">{t.desc}</p>
                <Link href={`/uiux/studio?tool=${t.id}&prompt=${encodeURIComponent(t.example)}`} className="landing-tool-example">
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
          <p className="landing-section-desc">Click any prompt to open it in UI/UX mode.</p>
          <div className="landing-showcase-grid">
            {SHOWCASE.map(s => (
              <Link key={s.label} href={`/uiux/studio?prompt=${encodeURIComponent(s.prompt)}`} className="landing-showcase-card">
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
          <p className="landing-wokspec-text">Need a complete frontend build or design handoff? WokSpec delivers full pipelines.</p>
          <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">WokSpec Services →</a>
        </div>
      </section>
    </div>
  );
}

