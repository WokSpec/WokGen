import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Business Docs — Brand Assets, Logos & Social Banners',
  description:
    'Complete documentation for WokGen Business. Logos, brand kits, slide visuals, ' +
    'social banners, and web hero images. Prompting guide, tools, styles, and export formats.',
};

// ---------------------------------------------------------------------------
// Simple MDX-free docs component helpers
// ---------------------------------------------------------------------------

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="docs-h2" style={{ scrollMarginTop: 80 }}>
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="docs-h3" style={id ? { scrollMarginTop: 80 } : undefined}>
      {children}
    </h3>
  );
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

function OL({ children }: { children: React.ReactNode }) {
  return <ol className="docs-ul" style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}>{children}</ol>;
}

function Callout({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'tip' | 'warn' }) {
  const icons = { info: 'i', tip: '→', warn: '!' };
  return (
    <div className={`docs-callout docs-callout--${type}`}>
      <span className="docs-callout-icon">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TOC
// ---------------------------------------------------------------------------

const TOC = [
  { id: 'overview',    label: 'Overview' },
  { id: 'quickstart',  label: 'Quick Start' },
  { id: 'tools',       label: 'Tools Reference' },
  { id: 'style-guide', label: 'Style Guide' },
  { id: 'prompting',   label: 'Prompting Guide' },
  { id: 'platforms',   label: 'Platform Dimensions' },
  { id: 'export',      label: 'Export Guide' },
  { id: 'credits',     label: 'Credits & Limits' },
  { id: 'faq',         label: 'FAQ' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BusinessDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar                                                           */}
        {/* ---------------------------------------------------------------- */}

        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            
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

        {/* ---------------------------------------------------------------- */}
        {/* Main content                                                      */}
        {/* ---------------------------------------------------------------- */}

        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#60a5fa' }} />
              WokGen Business
            </div>
            <h1 className="docs-title">Business Documentation</h1>
            <p className="docs-subtitle">
              AI-powered brand and marketing asset generator — logos, brand kits, slide visuals,
              social banners, and web hero images. For founders, designers, and marketing teams.
            </p>
          </div>

          {/* ============================================================ */}
          {/* 1. OVERVIEW                                                    */}
          {/* ============================================================ */}

          <H2 id="overview">Overview</H2>

          <P>
            WokGen Business is an AI brand and marketing asset generator. It produces professional-grade
            visual assets for branding, marketing, presentations, and the web — not illustrations,
            not pixel art, not UI mockups. Every tool is purpose-built for its output format: the Logo
            Mark tool enforces isolated icon composition; Social Banner enforces exact platform dimensions;
            Brand Kit generates four coordinated assets in a single run.
          </P>

          <H3>Who it&#39;s for</H3>
          <UL>
            <LI><strong>Startup founders</strong> — get a brand identity (logo mark, OG image, social header) in under 10 minutes without hiring a designer.</LI>
            <LI><strong>Indie hackers</strong> — ship a launch with a complete visual package: logo, hero background, and social assets.</LI>
            <LI><strong>Designers</strong> — generate multiple concept directions fast, then refine the winner in Figma or Illustrator.</LI>
            <LI><strong>Marketing teams</strong> — produce platform-sized social assets without resizing images manually.</LI>
            <LI><strong>Freelancers</strong> — deliver brand starter kits to clients quickly and iterate on feedback without per-revision time costs.</LI>
          </UL>

          <H3>What WokGen Business is NOT</H3>
          <UL>
            <LI><strong>Not a layered design tool</strong> — it does not have layers, objects, or vector editing. Use Figma or Illustrator for that.</LI>
            <LI><strong>Not a presentation maker</strong> — it generates slide backgrounds, not full decks with text slides. Build your deck in Google Slides, Keynote, or PowerPoint, then import the background.</LI>
            <LI><strong>Not a UI/UX design tool</strong> — it generates hero backgrounds and brand images, not screens, wireframes, or components.</LI>
            <LI><strong>Not a reliable text-in-image tool</strong> — AI image models cannot consistently render legible brand names or body copy inside images. Generate the visual background, then add your own text in a design tool.</LI>
          </UL>

          <H3>Output types</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Output type</th><th>Tool</th><th>Typical use</th></tr>
              </thead>
              <tbody>
                {[
                  ['Logo Mark',          'Logo',         'App icon, favicon, brand symbol, letterhead mark'],
                  ['Brand Kit (4 assets)','Brand Kit',   'Full brand starter: mark + banner + avatar + OG image'],
                  ['Slide Background',   'Slide Visual', 'Pitch deck, keynote, conference talk, course slides'],
                  ['Social Banner',      'Social Banner','Twitter/X, Instagram, LinkedIn, YouTube, OG meta'],
                  ['Hero Image',         'Hero Image',   'Website hero section, landing page full-bleed background'],
                ].map(([output, tool, use]) => (
                  <tr key={output}><td>{output}</td><td>{tool}</td><td>{use}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Use case examples</H3>
          <UL>
            <LI>
              <strong>Startup brand kit in 5 minutes</strong> — describe your product, pick Corporate Clean +
              Professional mood, run Brand Kit. Download all four assets: logo mark (512×512), header banner
              (1200×400), profile image (400×400), OG meta (1200×630). Drop straight into your website.
            </LI>
            <LI>
              <strong>Pitch deck visuals</strong> — use Slide Visual with Tech Dark or Gradient Modern style.
              Generate three or four background variations, import into Google Slides, add your copy on top.
              Investors see a polished deck without you hiring a deck designer.
            </LI>
            <LI>
              <strong>Product launch social assets</strong> — run Social Banner once for each platform:
              Twitter/X Header (1500×500), Instagram Post (1080×1080), LinkedIn Banner (1584×396),
              OG Image (1200×630). All share a visual language because you use the same prompt and style preset.
            </LI>
          </UL>

          {/* ============================================================ */}
          {/* 2. QUICK START                                                 */}
          {/* ============================================================ */}

          <H2 id="quickstart">Quick Start</H2>

          <P>
            Generating your first business asset takes about two minutes. Here is the five-step process,
            followed by a full walkthrough.
          </P>

          <H3>Five steps</H3>
          <OL>
            <LI><strong>Pick a tool</strong> — open Business Studio and choose Logo Mark, Brand Kit, Slide Visual, Social Banner, or Hero Image from the tool selector.</LI>
            <LI><strong>Describe your concept</strong> — write a short brand description: what the product does, who it is for, what feeling it should convey. One to three sentences is ideal.</LI>
            <LI><strong>Set the industry</strong> — select your industry from the dropdown (SaaS, Fintech, Healthcare, E-commerce, Agency, etc.). This shapes the composition and color instincts of the model.</LI>
            <LI><strong>Choose style and mood</strong> — pick one of the eight style presets and one mood tag (Professional, Bold, Playful, Minimal, Luxury). See the Style Guide section for details.</LI>
            <LI><strong>Generate</strong> — click Generate. Standard tier returns in 3–10 seconds. HD tier returns in 20–40 seconds for large dimensions.</LI>
          </OL>

          <H3>Walkthrough: SaaS analytics platform logo</H3>
          <P>
            Goal: a clean logo mark for a B2B SaaS analytics platform. We want it to feel trustworthy and
            modern, not playful.
          </P>
          <Pre>{`Tool:        Logo Mark
Concept:     Analytics platform for e-commerce businesses.
             Helps teams track revenue, churn, and LTV.
Industry:    SaaS / B2B Software
Style:       Corporate Clean
Mood:        Professional
Color dir:   Deep blue and white, with a subtle teal accent
Bg toggle:   Transparent (for use on dark and light sites)`}</Pre>
          <P>
            Click Generate. The model produces a 512×512 PNG: an isolated geometric mark in deep blue
            and teal, clean and symmetrical, suitable as a favicon, app icon, or letterhead mark. If
            the result is too complex, add <Code>simple, minimal, single shape</Code> to the concept
            field and regenerate.
          </P>
          <Callout type="tip">
            Start with Logo Mark before running Brand Kit. Once you find a direction you like in a
            quick single-image generation, use the same concept and style settings in Brand Kit to
            produce the full four-asset set.
          </Callout>

          {/* ============================================================ */}
          {/* 3. TOOLS REFERENCE                                             */}
          {/* ============================================================ */}

          <H2 id="tools">Tools Reference</H2>

          {/* ---- 3a. LOGO MARK ---- */}

          <H3 id="logo">Logo Mark</H3>

          <P>
            Logo Mark generates a brand symbol or icon mark. It is designed to produce isolated, clean
            compositions suitable for use as app icons, favicons, letterhead marks, and geometric brand
            symbols. It is <strong>not</strong> a full logotype generator — it does not reliably render
            your brand name as legible text inside the image. AI image models struggle with consistent
            typography. Generate the mark, then add your brand name in Figma, Canva, or any design tool.
          </P>

          <UL>
            <LI><strong>Output size:</strong> 512×512 PNG</LI>
            <LI><strong>Background toggle:</strong> White / Dark / Transparent (transparent requires HD tier)</LI>
            <LI><strong>Best for:</strong> app icons, favicon marks, geometric brand symbols, letterhead icons, profile avatars</LI>
            <LI><strong>Not for:</strong> full logotypes with wordmark text, badges with company name, realistic illustration logos</LI>
          </UL>

          <H3>Style recommendations for Logo Mark by industry</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Industry</th><th>Recommended style</th><th>Notes</th></tr></thead>
              <tbody>
                {[
                  ['Fintech / Finance',    'Corporate Clean or Minimal Flat',  'Avoid overly decorative; trust signals matter'],
                  ['SaaS / Dev Tools',     'Minimal Flat or Tech Dark',        'Clean geometry; single-color or two-color'],
                  ['Healthcare',           'Corporate Clean or Minimal Flat',  'Calm blues and greens; avoid busy patterns'],
                  ['E-commerce / Retail',  'Bold Geometric or Gradient Modern','High contrast; energetic marks work well'],
                  ['Creative / Agency',    'Bold Geometric or Warm Brand',     'More expressive; abstract marks encouraged'],
                  ['Food / Wellness',      'Warm Brand or Minimal Flat',       'Organic shapes; earthy or soft color palettes'],
                  ['Cybersecurity / AI',   'Tech Dark or Monochrome',          'Dark bg with glow; angular geometric marks'],
                  ['Nonprofit / Community','Warm Brand or Gradient Modern',    'Approachable; softer forms work well'],
                ].map(([industry, style, notes]) => (
                  <tr key={industry}><td>{industry}</td><td>{style}</td><td>{notes}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Example prompts — Logo Mark</H3>
          <Pre>{`// 1. B2B SaaS data platform
Analytics SaaS for e-commerce revenue tracking,
minimal flat style, professional mood,
deep blue and white, simple geometric mark, isolated

// 2. Fintech payments startup
International payments startup, corporate clean style,
trustworthy mood, navy and gold, hexagon or shield motif,
clean isolated icon on white background

// 3. Developer tools company
CLI developer toolchain for cloud deployments,
tech dark style, bold mood, electric blue and charcoal,
geometric abstract mark, circuit or node motif

// 4. Health and wellness app
Mindfulness and sleep tracking app,
warm brand style, calm mood, sage green and soft cream,
organic circular mark, leaf or wave element

// 5. Creative design agency
Brand design agency for digital startups,
bold geometric style, confident mood, vibrant coral and black,
angular abstract letterform or stacked shapes`}</Pre>

          <Callout type="info">
            After downloading your logo mark PNG, you can remove the background at remove.bg or
            use Figma&#39;s background removal to get a transparent PNG for use on any surface.
            Transparent background export is also available natively on HD tier via the bg toggle.
          </Callout>

          {/* ---- 3b. BRAND KIT ---- */}

          <H3 id="brand-kit">Brand Kit (4×)</H3>

          <P>
            Brand Kit is the most efficient tool in WokGen Business. One generation produces four
            coordinated brand assets simultaneously, all sharing the same visual language — color palette,
            style, and compositional mood. This is the fastest way to go from zero to a complete brand
            visual identity.
          </P>

          <H3>The four assets Brand Kit generates</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>#</th><th>Asset</th><th>Size</th><th>Use</th></tr></thead>
              <tbody>
                {[
                  ['1', 'Logo Mark',     '512×512',   'App icon, favicon, letterhead symbol'],
                  ['2', 'Header Banner', '1200×400',  'Website header, email header, LinkedIn company banner'],
                  ['3', 'Profile Image', '400×400',   'Twitter/X avatar, Discord icon, LinkedIn profile picture'],
                  ['4', 'OG Meta Image', '1200×630',  'Open Graph link preview for social sharing'],
                ].map(([n, a, s, u]) => (
                  <tr key={n}><td>{n}</td><td>{a}</td><td><Code>{s}</Code></td><td>{u}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <P>
            Color consistency is achieved through your style and mood selection. The model uses the same
            color family across all four images. If you specify <Code>blue and white, minimal</Code> in
            your prompt, all four assets will pull from that palette. You do not need to specify the same
            colors four times — one shared concept drives all four generations.
          </P>

          <Callout type="warn">
            Brand Kit consumes <strong>4 credits</strong> per generation — one credit per image. If you
            are on a credits-based plan, a single Brand Kit run costs 4 credits. HD Brand Kit takes 20–40
            seconds as all four images generate in parallel at full resolution.
          </Callout>

          <H3>Brand Kit walkthrough — B2B invoicing startup</H3>
          <Pre>{`Concept:  B2B invoicing and payment automation startup.
          Helps small businesses get paid faster.
Industry: Fintech / B2B SaaS
Style:    Corporate Clean
Mood:     Professional
Colors:   Minimal, blue and white palette

Expected outputs:
  1. Logo Mark (512×512)   — clean geometric mark, blue on white,
                             simple angular or circular form
  2. Header Banner (1200×400) — wide horizontal brand banner, company
                                mark left-aligned, blue gradient bg
  3. Profile Image (400×400)  — square avatar crop of the mark,
                                suitable for social profile pictures
  4. OG Meta (1200×630)       — horizontal link preview card,
                                subtle blue tone, space for overlay text`}</Pre>

          <Callout type="tip">
            All four Brand Kit downloads have labeled filenames:
            <Code>brandkit-logo.png</Code>, <Code>brandkit-banner.png</Code>,
            <Code>brandkit-profile.png</Code>, <Code>brandkit-og.png</Code>.
            Drop them directly into your website, Notion workspace, or Canva project.
          </Callout>

          {/* ---- 3c. SLIDE VISUAL ---- */}

          <H3 id="slide">Slide Visual</H3>

          <P>
            Slide Visual generates full-bleed 16:9 backgrounds for presentations, pitch decks, keynotes,
            and online courses. It is <strong>not</strong> a presentation maker — it does not create
            slides with text, bullet points, or layouts. It generates the background image that you
            import into Google Slides, Keynote, or PowerPoint and add your own copy on top.
          </P>

          <UL>
            <LI><strong>Output:</strong> 1920×1080 PNG (16:9, full HD)</LI>
            <LI><strong>Best styles for slides:</strong> Minimal Flat, Tech Dark, Gradient Modern, Corporate Clean</LI>
            <LI><strong>Text zone:</strong> select Left, Right, or Center to leave a clear area for your slide text</LI>
            <LI><strong>Not for:</strong> slides with readable text content, chart backgrounds requiring grid lines, animated transitions</LI>
          </UL>

          <H3>Importing into presentation tools</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Tool</th><th>How to set as slide background</th></tr></thead>
              <tbody>
                {[
                  ['Google Slides',  'Slide → Change background → Image → Upload from computer'],
                  ['Keynote',        'Format panel → Background → Image Fill → Choose image'],
                  ['PowerPoint',     'Design → Format Background → Picture or texture fill → File'],
                  ['Canva',          'Background remover or drag PNG onto slide canvas as background layer'],
                ].map(([tool, how]) => (
                  <tr key={tool}><td>{tool}</td><td>{how}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            When generating slide backgrounds, specify a text zone direction in your prompt:
            <Code>leave the left third of the image dark and clear for text</Code> or
            <Code>bright abstract background, text-safe bottom strip</Code>.
            This ensures your slide copy is readable when overlaid.
          </Callout>

          <H3>Example prompts — Slide Visual</H3>
          <Pre>{`// 1. AI product launch keynote
AI product launch keynote background, tech dark style,
professional mood, subtle electric blue gradient,
abstract particle field, text-safe left zone

// 2. Investor pitch deck — fintech
Fintech investor pitch deck background, corporate clean style,
trustworthy mood, navy blue with subtle grid lines,
minimal and elegant, clear center text zone

// 3. Developer conference talk
Open source developer conference talk background,
tech dark style, bold mood, matrix-inspired green on black,
minimal code texture, text-safe upper left

// 4. Product design team workshop
Design systems workshop slide background,
gradient modern style, calm mood, soft purple to blue gradient,
clean and airy, text-safe top strip

// 5. Sales enablement deck
B2B SaaS sales deck background, corporate clean style,
professional mood, light grey and white with teal accent line,
clean minimal gradient, lower-left text zone`}</Pre>

          {/* ---- 3d. SOCIAL BANNER ---- */}

          <H3 id="social">Social Banner</H3>

          <P>
            Social Banner generates platform-sized images for social media and web sharing. Select your
            target platform and the output dimensions are set automatically — no manual resizing. Each
            platform has specific compositional requirements; the text zone selection is especially
            critical here because many platforms crop or overlay UI chrome on parts of the image.
          </P>

          <H3>Supported platforms</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Platform</th><th>Dimensions</th><th>Aspect ratio</th><th>Notes</th></tr></thead>
              <tbody>
                {[
                  ['Twitter/X Post',    '1080×1080', '1:1',       'Square post image; key content center'],
                  ['Twitter/X Header',  '1500×500',  '3:1',       'Profile header; avatar overlaps bottom-left'],
                  ['Instagram Post',    '1080×1080', '1:1',       'Square feed post; safe zone center'],
                  ['Instagram Story',   '1080×1920', '9:16',      'Vertical; UI chrome top and bottom 250px'],
                  ['LinkedIn Banner',   '1584×396',  '4:1',       'Very wide; profile picture overlaps bottom-left'],
                  ['OG Image',          '1200×630',  '1.91:1',    'Open Graph link preview; used by Twitter, Slack, iMessage, etc.'],
                  ['YouTube Art',       '2560×1440', '16:9',      'Channel art; safe zone 1546×423 centered'],
                ].map(([p, d, a, n]) => (
                  <tr key={p}><td>{p}</td><td><Code>{d}</Code></td><td>{a}</td><td>{n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>OG Image explained</H3>
          <P>
            The OG (Open Graph) image is the link preview image shown when you share a URL on Twitter/X,
            LinkedIn, Slack, Discord, iMessage, WhatsApp, and most chat tools. It is defined in your
            HTML <Code>&lt;head&gt;</Code> via the <Code>og:image</Code> meta tag. The recommended size
            is <Code>1200×630</Code>. Generate it in WokGen Business, host it as a static asset or in
            your CDN, then point the meta tag at its URL.
          </P>
          <Pre>{`<!-- Next.js App Router metadata -->
export const metadata = {
  openGraph: {
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};`}</Pre>

          <H3>Text zone and platform chrome</H3>
          <Callout type="warn">
            Twitter/X Header, LinkedIn Banner, and Instagram Story all have platform UI (avatar, buttons,
            text) overlaid on parts of the image. Always select the text zone that keeps your key visual
            away from these areas. For Twitter/X Header, keep key content in the center-right; your profile
            avatar covers the bottom-left corner. For Instagram Story, keep key content in the center
            vertical strip, 250px clear at top and bottom.
          </Callout>

          <H3>Example prompts — Social Banner</H3>
          <Pre>{`// Twitter/X Header — dev tools SaaS
Developer tools SaaS company header banner,
minimal flat style, dark background with subtle code grid texture,
turquoise accent line, text-safe center-right zone

// LinkedIn Banner — consulting firm
B2B strategy consulting firm LinkedIn banner,
corporate clean style, navy blue with light gold accent,
wide horizontal composition, abstract geometric forms,
professional and authoritative mood

// Instagram Post — product launch
SaaS product launch announcement post,
gradient modern style, bold mood, vibrant purple to pink gradient,
abstract burst shape, centered composition

// Instagram Story — online course launch
Online course launch story, warm brand style,
energetic mood, orange and yellow palette,
vertical composition with central focal element

// OG Image — open source project
Open source developer library website link preview,
tech dark style, bold mood, dark background,
neon green and white, abstract node graph texture`}</Pre>

          {/* ---- 3e. HERO IMAGE ---- */}

          <H3 id="web-hero">Hero Image</H3>

          <P>
            Hero Image generates full-bleed backgrounds for website hero sections and landing pages.
            It is <strong>not</strong> a UI component generator — it generates the background image
            layer, not buttons, navigation bars, or layout components. You overlay your headline,
            subheading, and CTA on top in your website builder or code.
          </P>

          <UL>
            <LI><strong>Output:</strong> 1920×1080 PNG (full HD, suitable for retina with CSS sizing)</LI>
            <LI><strong>Text zone:</strong> always select a text zone — most hero sections have a headline in the left half or center</LI>
            <LI><strong>CSS usage:</strong> set as <Code>background-image</Code> with <Code>background-size: cover</Code></LI>
            <LI><strong>Not for:</strong> above-the-fold illustrations with characters, product screenshots, or UI components</LI>
          </UL>

          <H3>CSS integration</H3>
          <Pre>{`/* Tailwind CSS */
<div className="relative w-full h-screen bg-cover bg-center"
     style={{ backgroundImage: "url('/hero.png')" }}>
  <div className="absolute inset-0 bg-black/40" />  {/* optional overlay */}
  <div className="relative z-10 ...">
    <h1>Your headline here</h1>
  </div>
</div>

/* Vanilla CSS */
.hero {
  background-image: url('/hero.png');
  background-size: cover;
  background-position: center;
  min-height: 100vh;
}`}</Pre>

          <H3>Style suggestions for Hero Image</H3>
          <UL>
            <LI><strong>Photography Overlay</strong> — photorealistic atmosphere; good for lifestyle, travel, food, and consumer brands</LI>
            <LI><strong>Tech Dark</strong> — dark with subtle texture; perfect for dev tools, AI products, and B2B SaaS</LI>
            <LI><strong>Gradient Modern</strong> — clean colorful gradients; works for any modern startup landing page</LI>
            <LI><strong>Warm Brand</strong> — earthy and inviting; food, wellness, community, and creator economy</LI>
            <LI><strong>Minimal Flat</strong> — very clean with white or off-white base; works well if your brand colors are the main statement</LI>
          </UL>

          <H3>Example prompts — Hero Image</H3>
          <Pre>{`// 1. Climate tech startup
Climate technology startup homepage hero background,
warm brand style, optimistic mood,
earth greens and ocean blues, abstract topographic lines,
text-safe left half, bright and inspiring atmosphere

// 2. Developer tools SaaS
Developer tools SaaS landing page hero,
tech dark style, bold mood,
dark charcoal background with subtle circuit grid texture,
electric blue glow accent, text-safe left two-thirds

// 3. B2B fintech platform
Fintech payment infrastructure platform hero background,
gradient modern style, professional mood,
deep navy to midnight blue gradient with abstract flow lines,
clean minimal, center text zone

// 4. Creator economy platform
Creator economy platform for independent writers,
warm brand style, friendly mood,
warm cream and terracotta palette, soft light bokeh,
airy and open, text-safe center

// 5. Cybersecurity company
Cybersecurity startup landing page background,
tech dark style, serious mood,
black background with glowing green hexagonal mesh,
subtle scanline texture, top-center text zone`}</Pre>

          {/* ============================================================ */}
          {/* 4. STYLE GUIDE                                                 */}
          {/* ============================================================ */}

          <H2 id="style-guide">Style Guide</H2>

          <P>
            WokGen Business has eight style presets. Choosing the right style is the single biggest
            lever you have over the output. Here is a full breakdown of each: when to use it, what
            mood it creates, which industries it suits, what to avoid it for, and example color directions.
          </P>

          {/* --- Minimal Flat --- */}
          <H3>Minimal Flat</H3>
          <P>
            Clean, flat design with generous white space, simple geometric shapes, and a limited color
            palette. Inspired by Swiss design and modern app iconography. Figures and forms are
            simplified to their essence — no gradients, no textures, no drop shadows.
          </P>
          <UL>
            <LI><strong>When to use:</strong> logo marks, icons, modern brand identities, SaaS product assets</LI>
            <LI><strong>Mood:</strong> clean, modern, trustworthy, approachable</LI>
            <LI><strong>Industries:</strong> SaaS, productivity tools, fintech, healthcare, legal tech</LI>
            <LI><strong>Do NOT use for:</strong> brands that need warmth or personality, luxury brands, bold athletic brands</LI>
            <LI><strong>Color directions that work:</strong> navy + white, black + single accent, coral + off-white, teal + light grey</LI>
          </UL>

          {/* --- Bold Geometric --- */}
          <H3>Bold Geometric</H3>
          <P>
            Strong geometric shapes — triangles, hexagons, grids — with high contrast and decisive color
            blocks. Compositions are assertive and energetic. Often uses thick outlines, bold negative
            space, and two or three high-contrast colors.
          </P>
          <UL>
            <LI><strong>When to use:</strong> brand marks for confident, disruptive companies; social banners needing impact</LI>
            <LI><strong>Mood:</strong> bold, energetic, confident, disruptive</LI>
            <LI><strong>Industries:</strong> tech, fitness, gaming, e-sports, creative agencies, direct-to-consumer brands</LI>
            <LI><strong>Do NOT use for:</strong> healthcare (too aggressive), finance (too informal), luxury (too rough)</LI>
            <LI><strong>Color directions that work:</strong> black + electric yellow, deep red + white, vibrant multi-color with black</LI>
          </UL>

          {/* --- Corporate Clean --- */}
          <H3>Corporate Clean</H3>
          <P>
            Conservative, polished, and trust-signaling. Clean lines, structured layouts, restrained
            color use. This is the &#34;business suit&#34; of the style presets — it communicates reliability,
            expertise, and professionalism over creativity or personality.
          </P>
          <UL>
            <LI><strong>When to use:</strong> logos for consulting firms, financial products, law firms, B2B enterprise SaaS</LI>
            <LI><strong>Mood:</strong> professional, trustworthy, authoritative, stable</LI>
            <LI><strong>Industries:</strong> finance, legal, consulting, insurance, healthcare, HR tech, enterprise software</LI>
            <LI><strong>Do NOT use for:</strong> consumer apps, creative agencies, youth-oriented brands, anything that needs to feel fun</LI>
            <LI><strong>Color directions that work:</strong> navy + gold, deep blue + white, charcoal + light blue, forest green + cream</LI>
          </UL>

          {/* --- Photography Overlay --- */}
          <H3>Photography Overlay</H3>
          <P>
            Photorealistic atmospheric backgrounds with depth, light, and texture. Looks like a
            high-quality stock photograph rather than a graphic. Best used for hero images and social
            banners where a real-world visual feel adds emotion and context.
          </P>
          <UL>
            <LI><strong>When to use:</strong> website hero backgrounds, social banners for lifestyle/consumer brands, OG images with atmosphere</LI>
            <LI><strong>Mood:</strong> cinematic, aspirational, warm, real, emotional</LI>
            <LI><strong>Industries:</strong> travel, hospitality, food, wellness, consumer goods, e-commerce, education</LI>
            <LI><strong>Do NOT use for:</strong> logo marks (too complex to isolate), slide backgrounds (text will be unreadable), monochromatic brands</LI>
            <LI><strong>Color directions that work:</strong> golden hour warm tones, misty morning blues, deep ocean teal, forest greens</LI>
          </UL>

          {/* --- Monochrome --- */}
          <H3>Monochrome</H3>
          <P>
            Black, white, and shades of grey only. No color. Timeless, versatile, and works at any
            size. A monochrome logo mark can be placed on any background color. Compositions rely on
            form, contrast, and proportion rather than color to communicate.
          </P>
          <UL>
            <LI><strong>When to use:</strong> logo marks destined for single-color or two-color brand systems; minimalist brand identities</LI>
            <LI><strong>Mood:</strong> timeless, sophisticated, minimal, versatile, editorial</LI>
            <LI><strong>Industries:</strong> fashion, luxury, architecture, publishing, art, high-end consulting</LI>
            <LI><strong>Do NOT use for:</strong> social banners (needs color to stand out in feed), slide backgrounds (too flat), warm consumer brands</LI>
            <LI><strong>Color directions that work:</strong> pure black + white, charcoal + light grey, near-black + off-white</LI>
          </UL>

          {/* --- Gradient Modern --- */}
          <H3>Gradient Modern</H3>
          <P>
            Smooth, multi-step color gradients in a contemporary style. Associated with the current
            wave of SaaS and app brand design. Gradients can be linear, radial, or mesh-style.
            Often incorporates subtle glows and soft color transitions.
          </P>
          <UL>
            <LI><strong>When to use:</strong> startup brand assets, hero backgrounds, social banners for modern digital products</LI>
            <LI><strong>Mood:</strong> modern, dynamic, digital, optimistic, forward-looking</LI>
            <LI><strong>Industries:</strong> SaaS, mobile apps, consumer tech, creator tools, AI products, edtech</LI>
            <LI><strong>Do NOT use for:</strong> conservative B2B (too trendy), physical goods brands, brands that need longevity over trend</LI>
            <LI><strong>Color directions that work:</strong> purple to pink, blue to teal, orange to yellow, deep indigo to electric blue</LI>
          </UL>

          {/* --- Tech Dark --- */}
          <H3>Tech Dark</H3>
          <P>
            Dark or near-black backgrounds with subtle technical textures — grids, circuit patterns,
            node graphs, scanlines — and colored glow accents. Strongly associated with developer tools,
            AI products, cybersecurity, and gaming. High contrast between background and accent colors.
          </P>
          <UL>
            <LI><strong>When to use:</strong> dev tools, AI products, cybersecurity companies, gaming, slide backgrounds for technical talks</LI>
            <LI><strong>Mood:</strong> powerful, technical, focused, cutting-edge, serious</LI>
            <LI><strong>Industries:</strong> developer tools, cybersecurity, AI/ML, blockchain, game studios, infrastructure SaaS</LI>
            <LI><strong>Do NOT use for:</strong> consumer lifestyle brands, healthcare (too cold), food and wellness, any brand that needs warmth</LI>
            <LI><strong>Color directions that work:</strong> black + electric blue, charcoal + neon green, dark navy + cyan glow, near-black + purple</LI>
          </UL>

          {/* --- Warm Brand --- */}
          <H3>Warm Brand</H3>
          <P>
            Earthy, friendly, and approachable. Uses warm tones — terracotta, amber, sage, cream,
            burnt orange — and organic shapes. Feels handcrafted and personal rather than corporate
            or technical. Often incorporates natural textures, rounded forms, and soft light.
          </P>
          <UL>
            <LI><strong>When to use:</strong> food brands, wellness products, community platforms, creator economy, local businesses</LI>
            <LI><strong>Mood:</strong> friendly, warm, authentic, community-oriented, grounded</LI>
            <LI><strong>Industries:</strong> food and beverage, wellness, fitness, education, non-profit, local business, lifestyle brands</LI>
            <LI><strong>Do NOT use for:</strong> enterprise B2B (too casual), fintech (too informal), cybersecurity (too soft)</LI>
            <LI><strong>Color directions that work:</strong> terracotta + cream, sage green + off-white, amber + warm brown, dusty rose + sand</LI>
          </UL>

          {/* ============================================================ */}
          {/* 5. PROMPTING GUIDE                                             */}
          {/* ============================================================ */}

          <H2 id="prompting">Prompting Guide</H2>

          <P>
            Business prompts are different from generative art prompts. You are not describing a scene
            or a painting — you are describing a brand identity, a marketing asset, a visual direction.
            The most effective prompts are specific about concept and mood, and leave the compositional
            decisions to the model.
          </P>

          <H3>Core prompt structure</H3>
          <Pre>{`[brand concept or product description]
[industry or sector]
[color direction]

Examples:
"B2B invoicing platform for freelancers, SaaS, blue and white"
"Outdoor adventure gear brand, e-commerce, earthy greens and orange"
"AI writing assistant, productivity SaaS, deep purple and cream"`}</Pre>

          <P>
            The style preset and mood tag are set in the UI — you do not need to repeat them in the
            prompt text. The concept field should focus on <em>what the brand is</em> and
            <em>what colors it should use</em>. Industry context shapes the model&#39;s instincts for
            composition, form, and visual vocabulary.
          </P>

          <H3>What NOT to include in your prompt</H3>
          <UL>
            <LI>
              <strong>Brand references</strong> — do not write &#34;make it look like Apple&#34; or &#34;similar to Stripe&#34;.
              These references are ignored or produce inconsistent results. Describe the qualities directly:
              &#34;clean, minimal, white background, single geometric mark&#34; instead of &#34;like Apple&#34;.
            </LI>
            <LI>
              <strong>Layout instructions</strong> — do not write &#34;put the logo in the top left&#34; or
              &#34;text on the right side&#34;. Use the text zone selector in the UI for positional control.
            </LI>
            <LI>
              <strong>Text content</strong> — do not write your company name and expect it to appear
              legibly in the output. AI image models cannot reliably render text. Generate the visual
              asset, then add your text in Figma, Canva, or your website.
            </LI>
            <LI>
              <strong>Technical specs</strong> — do not include dimensions, DPI, file format, or color
              mode (RGB/CMYK) in the prompt. These are handled by the tool settings, not the prompt.
            </LI>
            <LI>
              <strong>Negative prompts via the main field</strong> — if you want to exclude something
              (e.g., &#34;no text&#34;, &#34;no faces&#34;), there is a dedicated negative prompt field.
              Mixing negative instructions into the main concept field reduces prompt clarity.
            </LI>
          </UL>

          <H3>Mood guide</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Mood tag</th><th>What it does</th><th>Best combined with</th></tr></thead>
              <tbody>
                {[
                  ['Professional', 'Restrained, polished, business-appropriate compositions',    'Corporate Clean, Minimal Flat'],
                  ['Bold',         'High contrast, assertive forms, strong color decisions',     'Bold Geometric, Tech Dark'],
                  ['Playful',      'Rounded shapes, lighter palette, energetic compositions',    'Warm Brand, Gradient Modern'],
                  ['Minimal',      'Maximum white space, single-color or two-color, very simple','Minimal Flat, Monochrome'],
                  ['Luxury',       'Rich tones, refined forms, high negative space ratio',       'Monochrome, Corporate Clean'],
                  ['Energetic',    'Dynamic compositions, bright accent colors, movement',       'Bold Geometric, Gradient Modern'],
                  ['Calm',         'Soft palette, balanced compositions, lower contrast',        'Warm Brand, Minimal Flat'],
                  ['Technical',    'Structured, grid-aligned, data-influenced visual language',  'Tech Dark, Corporate Clean'],
                ].map(([mood, what, best]) => (
                  <tr key={mood}><td>{mood}</td><td>{what}</td><td>{best}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Iteration strategy</H3>
          <P>
            When refining results, change one variable at a time. If the composition is right but the
            colors are wrong, update only the color direction in the prompt and keep everything else
            the same. If the style feels right but the mood is off, change only the mood selector.
            Changing everything at once makes it impossible to know what produced the improvement.
          </P>
          <UL>
            <LI><strong>Colors wrong:</strong> update the color direction in the prompt — be more specific (&#34;deep cobalt blue, not light blue&#34;)</LI>
            <LI><strong>Too complex:</strong> add <Code>simple, minimal, clean, single shape</Code> to the prompt; switch to Minimal Flat or Monochrome style</LI>
            <LI><strong>Too generic:</strong> add industry-specific vocabulary (&#34;circuit node&#34;, &#34;leaf mark&#34;, &#34;shield emblem&#34;, &#34;abstract wave&#34;)</LI>
            <LI><strong>Wrong feel:</strong> change the mood tag first, then the style preset if mood alone does not fix it</LI>
            <LI><strong>Good composition, wrong colors:</strong> duplicate the generation settings, update only the color direction, and compare side by side</LI>
          </UL>

          <Callout type="tip">
            The best prompts are short and specific. Two to four lines covering concept, industry, and
            color direction usually outperform long detailed paragraphs. The style and mood UI controls
            do heavy lifting — let them.
          </Callout>

          {/* ============================================================ */}
          {/* 6. PLATFORM DIMENSIONS REFERENCE                              */}
          {/* ============================================================ */}

          <H2 id="platforms">Platform Dimensions Reference</H2>

          <P>
            All dimensions below are the exact pixel sizes WokGen Business outputs for each platform.
            These match the recommended size from each platform&#39;s official guidelines as of the current
            version of this documentation.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Output dimensions</th>
                  <th>Aspect ratio</th>
                  <th>Safe zone notes</th>
                  <th>Recommended use</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'Twitter/X Post',
                    '1080×1080',
                    '1:1',
                    'Full area is visible; key content center',
                    'Inline tweet image, product announcement',
                  ],
                  [
                    'Twitter/X Header',
                    '1500×500',
                    '3:1',
                    'Avatar (400×400 circle) overlaps bottom-left; keep key content center-right',
                    'Profile banner, brand header',
                  ],
                  [
                    'Instagram Post',
                    '1080×1080',
                    '1:1',
                    'Full area visible in feed; UI chrome at bottom on Story',
                    'Square feed post, product card',
                  ],
                  [
                    'Instagram Story',
                    '1080×1920',
                    '9:16',
                    'Top ~250px: time/status bar. Bottom ~250px: reply bar. Keep key content in center band',
                    'Story frame, reel cover, vertical ad',
                  ],
                  [
                    'LinkedIn Banner',
                    '1584×396',
                    '4:1',
                    'Profile picture overlaps bottom-left; keep key content in right two-thirds',
                    'Personal profile banner, company page header',
                  ],
                  [
                    'OG Image',
                    '1200×630',
                    '1.91:1',
                    'Twitter crops to center on some clients; keep key content center',
                    'Open Graph link preview — used by Twitter, Slack, Discord, iMessage',
                  ],
                  [
                    'YouTube Art',
                    '2560×1440',
                    '16:9',
                    'Safe zone: 1546×423 centered. Content outside this zone may be cropped on TV/mobile',
                    'Channel art, banner shown on channel page and TV apps',
                  ],
                ].map(([p, d, a, s, u]) => (
                  <tr key={p}>
                    <td>{p}</td>
                    <td><Code>{d}</Code></td>
                    <td>{a}</td>
                    <td>{s}</td>
                    <td>{u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="info">
            Dimensions are locked in the tool UI — you select the platform and the output size is set
            automatically. You do not need to manually enter pixel values.
          </Callout>

          {/* ============================================================ */}
          {/* 7. EXPORT GUIDE                                                */}
          {/* ============================================================ */}

          <H2 id="export">Export Guide</H2>

          <H3>Download filenames</H3>
          <P>
            Every downloaded asset has a structured filename so you can identify it without opening it:
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Tool</th><th>Example filename</th></tr></thead>
              <tbody>
                {[
                  ['Logo Mark',          'wokgen-logo-[timestamp].png'],
                  ['Brand Kit — Logo',   'brandkit-logo-[timestamp].png'],
                  ['Brand Kit — Banner', 'brandkit-banner-[timestamp].png'],
                  ['Brand Kit — Profile','brandkit-profile-[timestamp].png'],
                  ['Brand Kit — OG',     'brandkit-og-[timestamp].png'],
                  ['Slide Visual',       'wokgen-slide-[timestamp].png'],
                  ['Social Banner',      'wokgen-social-[platform]-[timestamp].png'],
                  ['Hero Image',         'wokgen-hero-[timestamp].png'],
                ].map(([tool, fn]) => (
                  <tr key={tool}><td>{tool}</td><td><Code>{fn}</Code></td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Using outputs in design tools</H3>
          <UL>
            <LI>
              <strong>Canva</strong> — upload the PNG via Uploads → Add new → Upload files. Drag onto
              canvas. For logos: use as-is or remove background with Canva&#39;s background remover (Pro feature).
              For slide backgrounds: drag to back layer, right-click → Set as background.
            </LI>
            <LI>
              <strong>Figma</strong> — drag the PNG directly onto the canvas. For logo refinement:
              import as a reference image, then retrace with vector shapes on top. For brand kit
              assets: import all four, create a frame for each, and build your brand guidelines page.
            </LI>
            <LI>
              <strong>Google Slides</strong> — Slide → Change background → Image → Upload from computer.
              Select the slide visual PNG. Apply to one slide or all slides.
            </LI>
            <LI>
              <strong>Webflow</strong> — Assets panel → Upload the PNG. Set as background image on the
              hero section with fit: Cover, position: Center. Add an overlay div with low opacity for
              text contrast if needed.
            </LI>
            <LI>
              <strong>Next.js / React</strong> — place the PNG in <Code>/public</Code> and reference
              it as <Code>/filename.png</Code>, or upload to a CDN (Vercel Blob, Cloudflare R2, S3)
              and use the CDN URL. Use CSS <Code>background-image: url(...)</Code> with
              <Code>background-size: cover</Code> for hero sections.
            </LI>
          </UL>

          <H3>Background removal for logos</H3>
          <P>
            Logo Mark outputs have a white, dark, or transparent background depending on your bg toggle
            selection. If you need a transparent PNG after the fact:
          </P>
          <UL>
            <LI><strong>remove.bg</strong> — upload the PNG; free tier gives lower resolution, paid gives full resolution</LI>
            <LI><strong>Figma background removal</strong> — select the image, right-click → Remove background (uses Figma&#39;s built-in AI)</LI>
            <LI><strong>Canva background remover</strong> — available on Canva Pro; select element → Edit image → Background remover</LI>
            <LI><strong>PhotoShop / GIMP</strong> — use Select → Subject then Delete background for manual control</LI>
          </UL>

          <H3>Format note: PNG only, no SVG</H3>
          <P>
            All WokGen Business outputs are PNG raster images. SVG (vector) export is not available
            because AI image models generate raster images — they cannot output vector paths.
          </P>
          <P>
            If you need an SVG version of your logo mark, use a PNG-to-SVG vectorization tool after
            downloading:
          </P>
          <UL>
            <LI><strong>Adobe Express Image to SVG</strong> — free web tool, good for simple logo marks</LI>
            <LI><strong>Vectorizer.io</strong> — AI-powered, handles more complex shapes</LI>
            <LI><strong>Inkscape (desktop)</strong> — free, open source; Path → Trace Bitmap for full control</LI>
            <LI><strong>Illustrator Live Trace</strong> — Object → Image Trace → Expand for professional vector output</LI>
          </UL>

          <Callout type="tip">
            For best vectorization results, use the Monochrome or Minimal Flat style when generating
            your logo mark. Simple, high-contrast shapes trace much more cleanly than detailed or
            gradient-heavy images.
          </Callout>

          {/* ============================================================ */}
          {/* 8. CREDITS & LIMITS                                            */}
          {/* ============================================================ */}

          <H2 id="credits">Credits &amp; Limits</H2>

          <H3>Credit system</H3>
          <P>
            WokGen Business uses the same credit system as WokGen Pixel. Each image generation
            consumes one credit. Brand Kit consumes four credits per run (one per image).
            Credits are shared across both Pixel and Business tools — your credit balance is unified.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Action</th><th>Credits consumed</th></tr></thead>
              <tbody>
                {[
                  ['Logo Mark generation',           '1 credit'],
                  ['Slide Visual generation',         '1 credit'],
                  ['Social Banner generation',        '1 credit'],
                  ['Hero Image generation',           '1 credit'],
                  ['Brand Kit generation (4 images)', '4 credits'],
                ].map(([action, credits]) => (
                  <tr key={action}><td>{action}</td><td>{credits}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Generation time</H3>
          <P>
            Generation time depends on the quality tier and the output dimensions:
          </P>
          <UL>
            <LI><strong>Standard tier:</strong> 3–8 seconds for all tools. Lower resolution, fast draft quality.</LI>
            <LI><strong>HD tier — Logo Mark (512×512):</strong> 8–15 seconds</LI>
            <LI><strong>HD tier — Slide Visual / Hero Image (1920×1080):</strong> 20–40 seconds — large canvas at full resolution</LI>
            <LI><strong>HD tier — Social Banner (platform dimensions):</strong> 10–25 seconds depending on aspect ratio</LI>
            <LI><strong>HD tier — Brand Kit (4× parallel):</strong> 20–40 seconds — all four images generate simultaneously, not sequentially</LI>
          </UL>

          <Callout type="info">
            Brand Kit HD may feel slow compared to a single-image generation but it is generating four
            full-resolution images in parallel. Wall-clock time is roughly the same as a single HD
            generation, not four times longer.
          </Callout>

          <H3>Rate limits</H3>
          <P>
            Rate limits are the same across Pixel and Business tools — they are account-level, not
            tool-level. Refer to the{' '}
            <Link href="/docs/pixel#limits" className="docs-link">Pixel docs limits section</Link>{' '}
            for the current rate limit table, as limits may change with plan updates.
          </P>

          <H3>Quality tiers comparison</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Feature</th><th>Standard</th><th>HD</th></tr></thead>
              <tbody>
                {[
                  ['Generation model',   'Pollinations (fast)',        'FLUX-1.1-Pro (high quality)'],
                  ['Max resolution',     '1024×1024 effective',        'Full platform spec (up to 2560×1440)'],
                  ['Generation speed',   '3–8 seconds',                '10–40 seconds depending on dimensions'],
                  ['Logo bg toggle',     'White / Dark only',          'White / Dark / Transparent'],
                  ['Brand Kit',          'Standard quality, 4 images', 'HD quality, 4 images, full resolution'],
                  ['Commercial license', 'Personal + small business',  'Full commercial including client delivery'],
                ].map(([f, s, h]) => (
                  <tr key={f}><td>{f}</td><td>{s}</td><td>{h}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* 9. FAQ                                                         */}
          {/* ============================================================ */}

          <H2 id="faq">FAQ</H2>

          {[
            {
              q: 'Can I use WokGen Business assets commercially?',
              a: 'Yes. Standard tier covers personal use and small business use. HD tier includes a full commercial license, including client delivery and brand distribution. Check the Terms of Service for the precise license language.',
            },
            {
              q: 'Why doesn\'t my company name appear on the logo?',
              a: 'AI image models cannot reliably render legible text, especially brand names and short strings. The Logo Mark tool generates the visual mark/symbol only. Add your brand name as a text layer on top using Figma, Canva, or your website\'s CSS. This is also the correct professional practice — most brand systems keep the mark and wordmark as separate elements.',
            },
            {
              q: 'How do I add text to slide backgrounds?',
              a: 'Download the slide background PNG from WokGen Business, then import it into Google Slides (Slide → Change background → Image), Keynote (Format → Background → Image Fill), or PowerPoint (Design → Format Background → Picture fill). Add your text as normal text boxes on top of the background image. The background is a separate layer from your slide text.',
            },
            {
              q: 'Can I generate multiple variations to compare?',
              a: 'Yes. Each generation produces one image (Brand Kit produces four). To compare variations, run multiple generations with small changes — try different styles, different mood tags, or slightly different color directions. Your generation history is saved in the studio so you can scroll back and compare previous outputs.',
            },
            {
              q: 'Can I get my exact brand colors (specific hex codes) in the output?',
              a: 'Not precisely. AI image generation works with color descriptions, not exact hex values. Describe your colors in words: "deep cobalt blue, around #0047AB" or "warm terracotta, brick red family". The output will approximate the direction but will not match a specific hex code exactly. For pixel-precise color matching, refine the result in Figma or Illustrator after downloading.',
            },
            {
              q: 'Why does Brand Kit take longer than a single generation?',
              a: 'Brand Kit generates four images simultaneously at full resolution. Even though they run in parallel, the HD model still needs 20–40 seconds to produce four high-quality outputs. The wall-clock time is similar to a single HD generation — you are getting four images for roughly the same wait time as one.',
            },
            {
              q: 'Can I export as SVG?',
              a: 'No. WokGen Business outputs PNG raster images. AI image models generate raster pixels, not vector paths. To get an SVG from a logo mark, download the PNG and run it through a vectorization tool: Vectorizer.io, Adobe Express Image to SVG, Inkscape\'s Trace Bitmap, or Illustrator\'s Image Trace. For best results, generate with Minimal Flat or Monochrome style — simpler shapes vectorize cleanly.',
            },
            {
              q: 'How is WokGen Business different from Canva or Figma?',
              a: 'Canva and Figma are design tools — they give you a canvas with layers, objects, text boxes, and templates that you assemble manually. WokGen Business is a generative tool — you describe what you want in words and the AI generates the image from scratch. WokGen Business is faster for creating initial visual concepts and brand directions. Canva or Figma is better for refining, combining, and adding text to those outputs.',
            },
            {
              q: 'How do I use the OG Image with Next.js or Vercel?',
              a: 'Download the OG Image (1200×630 PNG) from Social Banner. Upload it to /public/og.png in your Next.js project, or to a CDN. Then add it to your metadata in the App Router: export const metadata = { openGraph: { images: [{ url: \'/og.png\', width: 1200, height: 630 }] } }. For dynamic OG images (per-page), use the Next.js ImageResponse API (next/og) to generate programmatically — WokGen Business is best for your static global OG image.',
            },
            {
              q: 'Can I use WokGen Business for client branding projects?',
              a: 'Yes, on HD tier. The HD commercial license covers generating assets for delivery to clients. You own the outputs and may include them in client deliverables, brand guidelines, and production websites. Credit the generation source in your internal process notes if needed, but there is no attribution requirement in client-facing work.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="docs-faq-item">
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}

          {/* ---------------------------------------------------------------- */}
          {/* Footer navigation                                                */}
          {/* ---------------------------------------------------------------- */}

          <div className="docs-content-footer">
            <Link href="/docs/pixel" className="btn-ghost btn-sm">← Pixel Docs</Link>
            <Link href="/docs" className="btn-ghost btn-sm">Docs Hub →</Link>
          </div>

        </main>
      </div>
    </div>
  );
}
