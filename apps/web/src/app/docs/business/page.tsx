import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Business Docs — Brand Assets, Logos & Social Banners',
  description:
    'Complete documentation for WokGen Business. Logos, brand kits, slide visuals, ' +
    'social banners, and web hero images. Prompting guide, tools, and export formats.',
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="docs-h2" style={{ scrollMarginTop: 80 }}>{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="docs-h3">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="docs-p">{children}</p>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <code className="docs-code">{children}</code>;
}
function Pre({ children }: { children: React.ReactNode }) {
  return <pre className="docs-pre">{children}</pre>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="docs-ul">{children}</ul>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="docs-li">{children}</li>;
}
function Callout({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'tip' | 'warn' }) {
  const icons = { info: 'ℹ', tip: '✦', warn: '⚠' };
  return (
    <div className={`docs-callout docs-callout--${type}`}>
      <span className="docs-callout-icon">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

const TOC = [
  { id: 'overview',   label: 'Overview' },
  { id: 'tools',      label: 'Tools' },
  { id: 'prompting',  label: 'Prompting Guide' },
  { id: 'styles',     label: 'Style Presets' },
  { id: 'platforms',  label: 'Social Platforms' },
  { id: 'brand-kit',  label: 'Brand Kit (4×)' },
  { id: 'export',     label: 'Export' },
  { id: 'limits',     label: 'Limits & Quality' },
  { id: 'faq',        label: 'FAQ' },
];

export default function BusinessDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            <span style={{ color: '#60a5fa' }}>💼</span>
            <span>WokGen Business</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/business/studio" className="btn-primary btn-sm">Open Business Studio</Link>
          </div>
        </aside>

        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#60a5fa' }} />
              WokGen Business
            </div>
            <h1 className="docs-title">Business Documentation</h1>
            <p className="docs-subtitle">
              Logos, brand kits, slide visuals, social banners, and web hero images — for brands and teams.
            </p>
          </div>

          <H2 id="overview">Overview</H2>
          <P>
            WokGen Business is a brand-focused asset generator.
            It produces professional-grade images for marketing, branding, presentations, and web — not pixel art.
          </P>
          <P>
            Every tool in WokGen Business is optimized for its output type: logo generation enforces
            isolated mark composition, social banners enforce platform-correct dimensions, and Brand Kit
            fires 4 parallel generations with a shared visual identity.
          </P>
          <Callout type="tip">
            WokGen Business uses FLUX-1.1-Pro on HD tier for photorealistic and clean professional outputs.
            Standard tier uses Pollinations for fast draft-quality generation.
          </Callout>

          <H2 id="tools">Tools</H2>

          <H3>Logo</H3>
          <P>Generate brand logo marks and symbols. Clean isolated backgrounds, scalable compositions.</P>
          <UL>
            <LI>Output: 512×512 PNG</LI>
            <LI>Best for: startups, brand redesigns, icon marks</LI>
            <LI>Add color direction to guide the palette</LI>
          </UL>

          <H3>Brand Kit (4× parallel)</H3>
          <P>
            Generate a coherent 4-image brand set in one click:
            logo mark, brand banner, profile image, and OG meta image.
            All from a single concept description.
          </P>
          <UL>
            <LI>Fires 4 parallel API calls with shared seed family</LI>
            <LI>Result: 2×2 grid of brand-consistent images</LI>
            <LI>Download each image individually</LI>
          </UL>
          <Callout type="info">
            Brand Kit takes 15–40 seconds depending on quality. All 4 images generate simultaneously.
          </Callout>

          <H3>Slide Asset</H3>
          <P>Full-bleed backgrounds for presentations, keynotes, and pitch decks.</P>
          <UL>
            <LI>Formats: 16:9 (1920×1080), 4:3 (1024×768), 1:1 (1024×1024)</LI>
            <LI>Designed with text-safe zones in mind (avoid busy center compositions)</LI>
            <LI>Best paired with Keynote, PowerPoint, Google Slides</LI>
          </UL>

          <H3>Social Banner</H3>
          <P>Platform-correct social media images. Select your platform and dimensions are set automatically.</P>
          <UL>
            <LI>Supported platforms: Twitter/X header, Twitter post, Instagram post, Instagram Story, LinkedIn banner, YouTube art, OG meta</LI>
            <LI>Dimensions are locked to platform spec — no guessing</LI>
          </UL>

          <H3>Web Hero</H3>
          <P>Full-resolution hero backgrounds for websites and landing pages.</P>
          <UL>
            <LI>Output: 1920×1080 (or custom)</LI>
            <LI>Describe the mood, texture, and any text zones to leave clear</LI>
            <LI>Best for Next.js / React sites using a hero section</LI>
          </UL>

          <H2 id="prompting">Prompting Guide</H2>
          <P>
            Business prompts differ from pixel art prompts.
            Focus on <strong>brand identity</strong>, <strong>industry context</strong>,
            and <strong>visual mood</strong> — not technical specs.
          </P>

          <H3>Basic formula</H3>
          <Pre>{`[brand concept], [industry], [style preset], [mood], [color direction]`}</Pre>

          <H3>Examples by tool</H3>
          <Pre>{`// Logo
Modern fintech startup focused on international payments,
minimal flat style, professional mood, navy and gold

// Brand Kit
Creative branding agency for digital-first companies,
bold geometric style, energetic mood, vibrant multi-color

// Slide
AI product launch keynote background, tech dark style,
professional mood, subtle blue gradient, text-safe center

// Social (Twitter Header)
Developer tools SaaS company header, minimal flat,
dark background, subtle code texture, turquoise accent

// Web Hero
Climate tech startup homepage hero, warm brand style,
optimistic mood, earth greens and ocean blue`}</Pre>

          <H3>Tips</H3>
          <UL>
            <LI><strong>Include industry context</strong> — "fintech", "healthcare", "SaaS startup" shapes the composition.</LI>
            <LI><strong>Name the mood</strong> — professional, bold, playful, luxury, minimal.</LI>
            <LI><strong>Specify colors</strong> — "navy and gold", "deep purple", "black and white".</LI>
            <LI><strong>Avoid pixel art language</strong> — never say "pixel art", "8-bit", "sprite" in Business prompts.</LI>
            <LI><strong>Negative prompt</strong> — exclude: <Code>pixel art, cartoon, anime, watermark, text overlay</Code>.</LI>
          </UL>

          <H2 id="styles">Style Presets</H2>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Preset</th><th>Description</th><th>Best For</th></tr></thead>
              <tbody>
                {[
                  ['Minimal Flat',       'Clean flat design, white space, simple geometry',         'Logos, icons, modern brands'],
                  ['Bold Geometric',     'Strong shapes, high contrast, geometric forms',            'Tech, fitness, bold identity'],
                  ['Corporate',          'Conservative, clean, trust-signaling',                     'Finance, legal, consulting'],
                  ['Photography Overlay','Photo-realistic with composited text zones',               'Social banners, web heroes'],
                  ['Monochrome',         'Black, white, and grey only',                              'Timeless logos, minimalist brands'],
                  ['Gradient Modern',    'Smooth color gradients, contemporary feel',                'SaaS, apps, startup'],
                  ['Tech Dark',          'Dark backgrounds, subtle tech texture, glow accents',      'Dev tools, cybersecurity, AI'],
                  ['Warm Brand',         'Earthy tones, friendly, approachable',                     'Food, wellness, lifestyle'],
                ].map(([name, desc, best]) => (
                  <tr key={name}><td>{name}</td><td>{desc}</td><td>{best}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="platforms">Social Platform Sizes</H2>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Platform</th><th>Dimensions</th><th>Use</th></tr></thead>
              <tbody>
                {[
                  ['OG / Meta',         '1200×630',  'Link preview, Open Graph'],
                  ['Twitter/X Header',  '1500×500',  'Profile header banner'],
                  ['Twitter/X Post',    '1080×1080', 'Square tweet image'],
                  ['Instagram Post',    '1080×1080', 'Square feed post'],
                  ['Instagram Story',   '1080×1920', 'Vertical story/reel cover'],
                  ['LinkedIn Banner',   '1584×396',  'Profile or company page banner'],
                  ['YouTube Art',       '2560×1440', 'Channel art banner'],
                ].map(([p, d, u]) => (
                  <tr key={p}><td>{p}</td><td><Code>{d}</Code></td><td>{u}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="brand-kit">Brand Kit (4× Parallel)</H2>
          <P>Brand Kit is the most powerful tool in WokGen Business. It generates 4 images simultaneously:</P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>#</th><th>Asset</th><th>Size</th><th>Use</th></tr></thead>
              <tbody>
                {[
                  ['1', 'Logo Mark',     '512×512',  'Primary brand symbol/icon'],
                  ['2', 'Brand Banner',  '1200×400', 'Website header or LinkedIn banner'],
                  ['3', 'Profile Image', '400×400',  'Twitter/Discord/LinkedIn avatar'],
                  ['4', 'OG Meta',       '1200×630', 'Link preview for social sharing'],
                ].map(([n, a, s, u]) => (
                  <tr key={n}><td>{n}</td><td>{a}</td><td><Code>{s}</Code></td><td>{u}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout type="tip">
            Brand Kit uses a shared seed family so all 4 images have visual coherence. The same color
            palette and stylistic decisions carry through all 4 outputs.
          </Callout>

          <H2 id="export">Export</H2>
          <UL>
            <LI>All outputs are PNG</LI>
            <LI>No watermarks — ever</LI>
            <LI>Brand Kit: download each image individually with labeled filenames</LI>
            <LI>Social banners: filenames include platform name</LI>
          </UL>

          <H3>Commercial use</H3>
          <P>
            Free tier: personal and small business use. HD tier: full commercial license including
            client delivery and brand distribution. See <Link href="/terms">Terms of Service</Link>.
          </P>

          <H2 id="limits">Limits &amp; Quality</H2>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Feature</th><th>Free</th><th>HD (Paid)</th></tr></thead>
              <tbody>
                {[
                  ['Generation speed',  'Fast (Pollinations)',   'Slower, higher quality (FLUX-1.1-Pro)'],
                  ['Max resolution',    '1024×1024',              '1920×1080 (web hero) / platform spec'],
                  ['Brand Kit',         'Standard quality',       'HD quality, all 4 images'],
                  ['Commercial use',    'Personal + small biz',   'Full commercial + client work'],
                ].map(([f, fr, hd]) => (
                  <tr key={f}><td>{f}</td><td>{fr}</td><td>{hd}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="faq">FAQ</H2>
          {[
            {
              q: 'Can WokGen Business generate actual text in images?',
              a: 'Not reliably. AI image models struggle with legible text. WokGen Business is best for visual assets that you\'ll add your own text/logo on top of in a design tool like Figma or Canva.',
            },
            {
              q: 'My logo has too many details — how do I get simpler?',
              a: 'Use the "Minimal Flat" or "Monochrome" style preset. Add "simple, clean, minimal, flat icon" to your prompt and "complex, detailed, ornate" to your negative prompt.',
            },
            {
              q: 'What\'s the best tool for a startup brand?',
              a: 'Start with Logo (512×512) to lock your mark. Then run Brand Kit to generate the full 4-image set. Use Social → OG Image for link previews.',
            },
            {
              q: 'Can I use these assets for client work?',
              a: 'Yes on HD tier. The HD license covers commercial delivery to clients.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="docs-faq-item">
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}

          <div className="docs-content-footer">
            <Link href="/docs/pixel" className="btn-ghost btn-sm">← Pixel Docs</Link>
            <Link href="/docs" className="btn-ghost btn-sm">Docs Hub →</Link>
          </div>

        </main>
      </div>
    </div>
  );
}
