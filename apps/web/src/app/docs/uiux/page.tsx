import Link from 'next/link';


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
    <h3 id={id} className="docs-h3" style={{ scrollMarginTop: 80 }}>
      {children}
    </h3>
  );
}

function H4({ children }: { children: React.ReactNode }) {
  return <h4 className="docs-h4">{children}</h4>;
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

function OL({ children }: { children: React.ReactNode }) {
  return (
    <ol className="docs-ul" style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}>
      {children}
    </ol>
  );
}

function LI({ children }: { children: React.ReactNode }) {
  return <li className="docs-li">{children}</li>;
}

function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'tip' | 'warn';
}) {
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
  { id: 'what-is',       label: '1. What is WokGen UI/UX' },
  { id: 'component-types', label: '2. Component Types' },
  { id: 'frameworks',    label: '3. Frameworks' },
  { id: 'style-presets', label: '4. Style Presets' },
  { id: 'prompting',     label: '5. Prompting Guide' },
  { id: 'output-modes',  label: '6. Output Modes' },
  { id: 'using-code',    label: '7. Using Generated Code' },
  { id: 'customization', label: '8. Customization' },
  { id: 'workspaces',    label: '9. Workspaces' },
  { id: 'credits',       label: '10. Credits & Plans' },
  { id: 'limitations',   label: '11. Limitations' },
  { id: 'faq',           label: '12. FAQ' },
];

export default function UIUXDocsPage() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar TOC                                                       */}
        {/* ---------------------------------------------------------------- */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            
            <span>WokGen UI/UX</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/uiux/studio" className="btn-primary btn-sm">Open UI/UX Studio</Link>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#6366f1' }} />
              WokGen UI/UX
            </div>
            <h1 className="docs-title">UI/UX Documentation</h1>
            <p className="docs-subtitle">
              Complete guide to generating production-ready front-end code — React components,
              HTML/Tailwind sections, Next.js pages, and more.
            </p>
          </div>

          {/* ============================================================== */}
          {/* 1. WHAT IS WOKGEN UI/UX                                         */}
          {/* ============================================================== */}
          <H2 id="what-is">1. What is WokGen UI/UX</H2>

          <P>
            <strong>WokGen UI/UX</strong> is a design-to-code studio that generates
            production-ready front-end code from natural language descriptions. Unlike image
            generators, it outputs <strong>real, copy-paste-ready source code</strong> — React
            JSX, HTML with Tailwind CSS, Next.js App Router components, or self-contained
            Vanilla CSS HTML.
          </P>

          <H3>What WokGen UI/UX is NOT</H3>
          <P>
            WokGen UI/UX is <strong>not</strong> an image generator. It does not produce
            screenshots, mockups, or design files. Every output is runnable source code you can
            drop straight into your project. If you need pixel art or general images, use{' '}
            <Link href="/pixel/studio">WokGen Pixel</Link> instead.
          </P>

          <H3>Who it&apos;s for</H3>
          <UL>
            <LI><strong>Product teams building MVPs</strong> — scaffold a full landing page in minutes, not days.</LI>
            <LI><strong>Indie hackers and solopreneurs</strong> — ship a polished SaaS marketing site without a dedicated designer.</LI>
            <LI><strong>Front-end developers</strong> — skip boilerplate, get a working starting point for any common UI pattern.</LI>
            <LI><strong>Designers prototyping in code</strong> — translate design direction into real components immediately.</LI>
            <LI><strong>Agencies</strong> — accelerate client work by generating a first draft of landing pages and dashboards.</LI>
          </UL>

          <H3>Use cases</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Use case</th>
                  <th>Recommended components</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['SaaS landing page',     'Hero, Features, Pricing, Testimonials, CTA, Footer, Navbar'],
                  ['Internal dashboard',    'Dashboard page, Sidebar, Data Table, Stats, Card Grid'],
                  ['Authentication flow',   'Auth/Login page, Form'],
                  ['Marketing microsite',   'Landing page, Hero, CTA, FAQ'],
                  ['Admin panel skeleton',  'Sidebar, Table, Modal, Dashboard'],
                  ['E-commerce storefront', 'Hero, Card Grid, Features, Footer'],
                ].map(([uc, comps]) => (
                  <tr key={uc}>
                    <td><strong>{uc}</strong></td>
                    <td>{comps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            Start with the <strong>Landing Page</strong> component type for a full-page
            scaffold, then use individual section types (Hero, Pricing, etc.) to iterate on
            each section separately before assembling your final page.
          </Callout>

          {/* ============================================================== */}
          {/* 2. COMPONENT TYPES                                               */}
          {/* ============================================================== */}
          <H2 id="component-types">2. Component Types</H2>

          <P>
            WokGen UI/UX supports <strong>18 component types</strong> across four categories.
            Select the type before writing your prompt — it tells the model what structure and
            conventions to follow.
          </P>

          <H3 id="sections-category">Sections</H3>
          <P>
            Page sections are the building blocks of marketing and product pages. Each generates
            a self-contained, full-width block ready to slot into any layout.
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Icon</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Hero Section',  '◈', 'Full-width headline, subtext, CTA buttons, optional background image or gradient'],
                  ['Features',      '◆', 'Grid or list of feature cards with icons, titles, and descriptions'],
                  ['Pricing',       '◉', 'Tier cards with feature lists, highlighted plan, monthly/annual toggle'],
                  ['Testimonials',  '◎', 'Customer quote cards with name, avatar, role, and star ratings'],
                  ['FAQ',           '◌', 'Accordion-style or list of questions and answers'],
                  ['CTA',           '▶', 'Conversion-focused band with headline, supporting copy, and action button'],
                  ['Footer',        '▬', 'Site footer with columns, links, copyright, and social icons'],
                ].map(([type, icon, desc]) => (
                  <tr key={type}>
                    <td><strong>{type}</strong></td>
                    <td><Code>{icon}</Code></td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3 id="navigation-category">Navigation</H3>
          <P>
            Navigation components handle wayfinding — top bars, side drawers, and persistent
            navigation rails.
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Navbar',   'Horizontal top navigation bar — logo, links, auth buttons, mobile hamburger menu'],
                  ['Sidebar',  'Vertical navigation rail — collapsible, icon+label items, section groups'],
                ].map(([type, desc]) => (
                  <tr key={type}>
                    <td><strong>{type}</strong></td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3 id="components-category">Components</H3>
          <P>
            Reusable UI components for displaying data, gathering input, and managing content.
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Card Grid',   'Grid of cards — product listings, blog posts, team members, feature highlights'],
                  ['Form',        'Input form — contact, signup, settings, multi-step wizard'],
                  ['Data Table',  'Tabular data with columns, rows, sorting indicators, and pagination controls'],
                  ['Modal',       'Dialog overlay — confirmation, detail view, image lightbox, form in overlay'],
                  ['Stats',       'Key metric blocks — KPI cards, number highlights, growth indicators'],
                ].map(([type, desc]) => (
                  <tr key={type}>
                    <td><strong>{type}</strong></td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3 id="pages-category">Pages</H3>
          <P>
            Full-page templates that generate a complete layout — including multiple sections,
            navigation, and content areas in a single output.
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Landing Page',    'Complete marketing page scaffold — hero, features, pricing, CTA, footer'],
                  ['Dashboard',       'Admin/analytics dashboard — sidebar, stat cards, charts placeholder, data table'],
                  ['Auth/Login Page', 'Authentication screen — sign in, sign up, forgot password, social OAuth buttons'],
                  ['Settings Page',   'User or app settings — profile form, preference toggles, danger zone'],
                ].map(([type, desc]) => (
                  <tr key={type}>
                    <td><strong>{type}</strong></td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="info">
            There is also a <strong>Custom</strong> type for anything that doesn&apos;t fit a
            predefined category. Use it with a detailed prompt describing exactly what you need.
          </Callout>

          {/* ============================================================== */}
          {/* 3. FRAMEWORKS                                                    */}
          {/* ============================================================== */}
          <H2 id="frameworks">3. Frameworks</H2>

          <P>
            Select your target framework <strong>before</strong> generating. The model tailors
            the output syntax, imports, and conventions to match your choice.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Framework</th>
                  <th>Extension</th>
                  <th>Best for</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['HTML + Tailwind', '.html', 'Rapid prototyping, static sites, email templates', 'Requires Tailwind CSS via CDN or build step'],
                  ['React / TSX',     '.tsx',  'React apps, component libraries, Vite projects', 'TypeScript, default exports, standard React conventions'],
                  ['Next.js / TSX',   '.tsx',  'Next.js 14+ App Router projects', 'Uses server components by default; add "use client" when needed'],
                  ['Vanilla CSS',     '.html', 'Zero-dependency use, legacy projects, email', 'Self-contained HTML + embedded <style> block, no external deps'],
                ].map(([fw, ext, best, notes]) => (
                  <tr key={fw}>
                    <td><strong>{fw}</strong></td>
                    <td><Code>{ext}</Code></td>
                    <td>{best}</td>
                    <td>{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Choosing the right framework</H3>
          <UL>
            <LI>If you&apos;re unsure, start with <strong>HTML + Tailwind</strong> — it&apos;s the easiest to preview in a browser and copy into any project.</LI>
            <LI>For <strong>React/Vite</strong> projects, use <strong>React TSX</strong>.</LI>
            <LI>For <strong>Next.js</strong> apps using the App Router, use <strong>Next.js TSX</strong> — it avoids unnecessary <Code>&apos;use client&apos;</Code> directives and follows Next.js conventions.</LI>
            <LI>For a self-contained file with no build tools, use <strong>Vanilla CSS</strong> — the output includes all styles inline.</LI>
          </UL>

          <Callout type="warn">
            The framework selection cannot be changed after generation. If you want the same
            component in a different framework, re-generate with the new selection. Prompts are
            preserved, so switching is fast.
          </Callout>

          {/* ============================================================== */}
          {/* 4. STYLE PRESETS                                                 */}
          {/* ============================================================== */}
          <H2 id="style-presets">4. Style Presets</H2>

          <P>
            Style presets give the model a strong visual direction — color palette, typography
            personality, spacing philosophy, and overall aesthetic. Select a preset that matches
            your brand or intended design language before writing your prompt.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>Palette</th>
                  <th>Description</th>
                  <th>Ideal for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['SaaS Dark',      '#0f0f10 / #6366f1', 'Dark backgrounds, indigo accents, modern SaaS aesthetic',           'B2B SaaS products, developer tools, analytics platforms'],
                  ['Minimal Light',  '#ffffff / #6366f1', 'Clean white space, light grays, understated type',                  'Content sites, documentation, personal portfolios'],
                  ['Bold Consumer',  '#fbbf24 / #ef4444', 'High-energy yellows and reds, big typography, strong contrast',     'E-commerce, gaming, lifestyle brands, consumer apps'],
                  ['Corporate Clean','#1e3a5f / #3b82f6', 'Navy blues, professional grays, enterprise trustworthiness',        'Enterprise software, financial services, consulting'],
                  ['Dev Terminal',   '#0d1117 / #22c55e', 'Black backgrounds, green monospace accents, code-editor feel',      'Developer tools, CLI interfaces, hacker-aesthetic products'],
                  ['Warm Brand',     '#fffbeb / #f59e0b', 'Warm creams and ambers, friendly rounded shapes, community feel',   'Community products, food & beverage, local businesses'],
                  ['Glassmorphism', '#667eea / rgba(255,255,255,0.1)', 'Frosted glass cards, gradient backgrounds, translucency', 'Modern apps, crypto/web3, premium consumer products'],
                  ['Brutalist',      '#000000 / #ff0000', 'Black and white with bold red, raw typography, no ornamentation', 'Art projects, editorial, unconventional brands'],
                ].map(([name, palette, desc, ideal]) => (
                  <tr key={name}>
                    <td><strong>{name}</strong></td>
                    <td><Code>{palette}</Code></td>
                    <td>{desc}</td>
                    <td>{ideal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            Mention the style in your prompt too for stronger results. Example:{' '}
            <Code>dark SaaS pricing section with indigo gradient CTA button</Code> reinforces
            the <strong>SaaS Dark</strong> preset selection.
          </Callout>

          {/* ============================================================== */}
          {/* 5. PROMPTING GUIDE                                               */}
          {/* ============================================================== */}
          <H2 id="prompting">5. Prompting Guide</H2>

          <P>
            The quality of the generated code is directly proportional to the specificity of
            your prompt. A vague prompt produces generic output; a detailed prompt produces
            something much closer to your vision.
          </P>

          <H3>Anatomy of a good UI/UX prompt</H3>
          <P>
            A strong prompt answers four questions:
          </P>
          <OL>
            <LI><strong>What is the component?</strong> — "a pricing section", "a SaaS hero", "an admin sidebar"</LI>
            <LI><strong>What is it for?</strong> — "for a project management tool", "for a food delivery app"</LI>
            <LI><strong>What content does it contain?</strong> — tier names, feature list items, navigation links, stat labels</LI>
            <LI><strong>What is the design direction?</strong> — color hints, mood, layout preference (grid vs list, centered vs left-aligned)</LI>
          </OL>

          <H3>Example prompts by type</H3>

          <H4>Pricing section</H4>
          <Pre>{`Generate a SaaS pricing section with 3 tiers: Free, Pro ($29/mo), and Enterprise
(contact us). Dark theme. Monthly/annual toggle at the top. Pro tier highlighted
with a purple border. Feature list per tier: API access, custom dashboards, team
seats, priority support.`}</Pre>

          <H4>Hero section</H4>
          <Pre>{`SaaS analytics platform called "Chartly". Headline: "Turn your data into
decisions". Subtitle: real-time dashboards for engineering teams. Two CTAs:
"Start Free" (primary, indigo) and "Watch Demo" (ghost). Dark gradient
background with a subtle grid pattern.`}</Pre>

          <H4>Navbar</H4>
          <Pre>{`Company "Nexus" — logo on the left, navigation links: Product, Pricing, Docs,
Blog — Sign In (ghost) and Get Started (primary, purple) buttons on the right.
Sticky on scroll. Mobile hamburger menu.`}</Pre>

          <H4>Dashboard page</H4>
          <Pre>{`Admin dashboard for an e-commerce platform. Left sidebar with icons and labels:
Orders, Products, Customers, Analytics, Settings. Top header with search and
user avatar. Four stat cards at the top (Total Sales, Active Orders, Customers,
Revenue). Recent orders data table below.`}</Pre>

          <H4>Auth page</H4>
          <Pre>{`Sign-in page for a developer tool called "Forge". Centered card layout on a
dark background. Email and password fields, "Remember me" checkbox, Forgot
Password link, Sign In button. OAuth row: GitHub and Google. Link to sign up.`}</Pre>

          <H3>Prompting tips</H3>
          <UL>
            <LI><strong>Specify counts</strong> — "3 pricing tiers", "6 feature cards", "5 nav links". The model defaults to 3 items if unspecified.</LI>
            <LI><strong>Name your product</strong> — using your actual product name produces labels and copy that feel real rather than generic.</LI>
            <LI><strong>Include key labels</strong> — name your CTAs, tiers, links, and section headings. Placeholder text is generic; real labels are immediately useful.</LI>
            <LI><strong>State color preferences</strong> — "indigo accent", "red warning states", "green success badges". These reinforce the style preset.</LI>
            <LI><strong>Describe layout</strong> — "two-column", "centered card", "full-width band", "grid of 3 columns on desktop, 1 on mobile".</LI>
            <LI><strong>Mention responsive behavior</strong> — "mobile hamburger menu", "stack to single column on mobile".</LI>
          </UL>

          <Callout type="warn">
            Avoid vague superlatives like "beautiful", "modern", "clean", "perfect". These
            add noise without direction. Instead, describe <em>what</em> makes it clean or
            modern in concrete terms: "lots of white space", "16px base font", "rounded-2xl
            cards with subtle shadows".
          </Callout>

          <Callout type="tip">
            If the first result misses the mark, don&apos;t start over — <strong>extend your
            prompt</strong> with one or two specific corrections: "make the CTA button full
            width", "use a grid instead of a list for the features", "add a dark overlay to
            the hero background image".
          </Callout>

          {/* ============================================================== */}
          {/* 6. OUTPUT MODES                                                  */}
          {/* ============================================================== */}
          <H2 id="output-modes">6. Output Modes</H2>

          <P>
            After generation, the studio shows two tabs in the output panel:
          </P>

          <H3>Preview tab</H3>
          <P>
            The <strong>Preview</strong> tab renders the generated code inside an{' '}
            <Code>&lt;iframe&gt;</Code> — you see a live, interactive rendering of the
            component at desktop width. You can scroll within the preview and interact with
            any interactive elements (hover states, open/close toggles, tab switches).
          </P>
          <UL>
            <LI>Preview is injected with the Tailwind CDN for HTML+Tailwind outputs so you see styles immediately.</LI>
            <LI>React/TSX and Next.js outputs are shown as static HTML in the preview (the actual JSX is in the Code tab).</LI>
            <LI>Use the preview to verify layout, spacing, and visual hierarchy before copying.</LI>
          </UL>

          <H3>Code tab</H3>
          <P>
            The <strong>Code</strong> tab shows the raw source code exactly as generated —
            syntax-highlighted and copy-paste ready. A <strong>Copy</strong> button in the
            top-right of the panel copies the entire output to your clipboard.
          </P>
          <UL>
            <LI>For React/Next.js outputs: one complete component file, ready to save as a <Code>.tsx</Code> file.</LI>
            <LI>For HTML+Tailwind: a complete <Code>.html</Code> file with Tailwind CDN included.</LI>
            <LI>For Vanilla CSS: a complete <Code>.html</Code> file with an embedded <Code>&lt;style&gt;</Code> block.</LI>
          </UL>

          <Callout type="info">
            The Code tab also shows metadata about the generation — the model used, the
            framework, component type, style preset, and generation time in milliseconds.
          </Callout>

          {/* ============================================================== */}
          {/* 7. USING GENERATED CODE                                          */}
          {/* ============================================================== */}
          <H2 id="using-code">7. Using Generated Code</H2>

          <P>
            Copy the output from the <strong>Code tab</strong> and integrate it into your
            project. Instructions differ by framework:
          </P>

          <H3>React TSX</H3>
          <OL>
            <LI>Copy the code from the Code tab.</LI>
            <LI>Create a new file in your project, e.g. <Code>src/components/HeroSection.tsx</Code>.</LI>
            <LI>Paste the code. The component uses a default export — import it as <Code>import HeroSection from &apos;./HeroSection&apos;</Code>.</LI>
            <LI>Ensure Tailwind CSS is configured in your project (<Code>tailwind.config.js</Code> and <Code>globals.css</Code>).</LI>
            <LI>Drop the component into your page: <Code>&lt;HeroSection /&gt;</Code>.</LI>
          </OL>

          <H3>Next.js TSX</H3>
          <OL>
            <LI>Copy the code from the Code tab.</LI>
            <LI>Save it as a file in <Code>app/</Code> or <Code>components/</Code>, e.g. <Code>components/PricingSection.tsx</Code>.</LI>
            <LI>If the component uses interactivity (click handlers, state), add <Code>&apos;use client&apos;</Code> to the top of the file.</LI>
            <LI>Import and render in your page: <Code>import PricingSection from &apos;@/components/PricingSection&apos;</Code>.</LI>
          </OL>

          <H3>HTML + Tailwind</H3>
          <OL>
            <LI>Copy the code from the Code tab.</LI>
            <LI>Open the file directly in a browser — the output includes the Tailwind CDN script tag, so styles work immediately with no build step.</LI>
            <LI>For a production project with a build step, remove the CDN script tag and ensure Tailwind is processing your file via your <Code>tailwind.config.js</Code> content paths.</LI>
          </OL>

          <H3>Vanilla CSS</H3>
          <OL>
            <LI>Copy the code from the Code tab.</LI>
            <LI>Save as a <Code>.html</Code> file. The output is entirely self-contained — no external dependencies, no CDN scripts.</LI>
            <LI>Open in any browser. To extract into a CSS file, move the <Code>&lt;style&gt;</Code> block content to a separate <Code>.css</Code> file and link it.</LI>
          </OL>

          <Callout type="tip">
            For React and Next.js outputs, rename the default exported function to match your
            file name convention before committing. Example: the generated{' '}
            <Code>export default function Component()</Code> should become{' '}
            <Code>export default function PricingSection()</Code>.
          </Callout>

          {/* ============================================================== */}
          {/* 8. CUSTOMIZATION                                                 */}
          {/* ============================================================== */}
          <H2 id="customization">8. Customization</H2>

          <P>
            Generated output is a <strong>starting point</strong>, not a final product.
            It is designed to be 80% of the way there — close enough to your vision that
            the remaining 20% is fast, targeted editing rather than building from scratch.
          </P>

          <H3>Changing colors</H3>
          <UL>
            <LI><strong>Tailwind classes</strong> — find color classes like <Code>bg-indigo-600</Code> or <Code>text-gray-900</Code> and replace them with your brand colors (e.g., <Code>bg-brand-500</Code> if you have a custom palette configured).</LI>
            <LI><strong>CSS variables</strong> — for Vanilla CSS outputs, colors are often defined as CSS custom properties at the top of the <Code>&lt;style&gt;</Code> block. Update the variable values to retheme the entire component at once.</LI>
            <LI><strong>Inline styles</strong> — some gradient backgrounds are defined as inline <Code>style</Code> props. These are clearly visible in the code and easy to swap.</LI>
          </UL>

          <H3>Swapping placeholder content</H3>
          <UL>
            <LI>All text content is hardcoded in the component. Search for lorem ipsum, "Placeholder", "Feature name", or "Lorem" to find and replace generated copy.</LI>
            <LI>For image placeholders, swap the <Code>src</Code> attribute of <Code>&lt;img&gt;</Code> tags or background image URLs.</LI>
            <LI>Icon placeholders (SVG inline blocks or emoji) can be replaced with your preferred icon library components (e.g., Lucide, Heroicons).</LI>
          </UL>

          <H3>Adjusting layout</H3>
          <UL>
            <LI><strong>Grid columns</strong> — change <Code>grid-cols-3</Code> to <Code>grid-cols-2</Code> or <Code>grid-cols-4</Code> to adjust item counts per row.</LI>
            <LI><strong>Max width</strong> — the outer container typically uses <Code>max-w-7xl</Code> or <Code>max-w-5xl</Code>. Adjust to control content width.</LI>
            <LI><strong>Spacing</strong> — padding and gap utilities (<Code>py-24</Code>, <Code>gap-8</Code>) are all Tailwind classes — easy to find and tune.</LI>
            <LI><strong>Responsive breakpoints</strong> — responsive prefixes (<Code>md:</Code>, <Code>lg:</Code>) are already present in most outputs. Extend them to add more breakpoints.</LI>
          </UL>

          <Callout type="info">
            If a change is structural (add a fourth pricing tier, add a new nav section,
            change the layout from two-column to three-column), it&apos;s often faster to
            regenerate with an updated prompt than to manually restructure the HTML.
          </Callout>

          {/* ============================================================== */}
          {/* 9. WORKSPACES                                                    */}
          {/* ============================================================== */}
          <H2 id="workspaces">9. Workspaces</H2>

          <P>
            Workspaces let you organize your generated components by project. Every generation
            can be saved to a workspace so your UI/UX components stay grouped, named, and
            easy to find later.
          </P>

          <H3>How workspaces work</H3>
          <UL>
            <LI>Create a workspace per product or client project — e.g., <Code>Chartly MVP</Code>, <Code>Client: Acme Corp</Code>.</LI>
            <LI>The <strong>UI/UX workspace</strong> keeps all your generated components together, separate from Pixel art assets and other generator outputs.</LI>
            <LI>Saved components retain their prompt, framework, component type, style preset, and generated code — you can view and copy them at any time without regenerating.</LI>
            <LI>Rename, duplicate, or delete saved components from the workspace panel.</LI>
          </UL>

          <H3>Saving a generation</H3>
          <OL>
            <LI>After generating a component you want to keep, click the <strong>Save</strong> button in the output panel.</LI>
            <LI>Give it a descriptive name (e.g., <Code>Pricing section — dark 3-tier</Code>).</LI>
            <LI>Select or create a workspace to save it into.</LI>
            <LI>The component is now accessible from your workspace sidebar.</LI>
          </OL>

          <Callout type="tip">
            Save intermediate versions as you refine a component — you can always go back to
            an earlier iteration if a later prompt revision takes the design in the wrong
            direction.
          </Callout>

          {/* ============================================================== */}
          {/* 10. CREDITS & PLANS                                              */}
          {/* ============================================================== */}
          <H2 id="credits">10. Credits &amp; Plans</H2>

          <P>
            UI/UX generation is powered by large language models. Here&apos;s how usage and
            credits work:
          </P>

          <H3>Models used</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Used for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Llama 3.1 70B Instruct', 'Together.ai', 'Primary generation model — fast, high-quality code output'],
                  ['DeepSeek Coder',          'DeepSeek',   'Alternative model for code-heavy or complex component requests'],
                ].map(([model, provider, use]) => (
                  <tr key={model}>
                    <td><strong>{model}</strong></td>
                    <td>{provider}</td>
                    <td>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Credit usage</H3>
          <UL>
            <LI><strong>Standard generation is free.</strong> There is no HD tier for UI/UX code generation — code generation does not have an image quality distinction.</LI>
            <LI>Each generation request consumes a small amount of API quota, managed transparently. Normal usage (a few dozen generations per day) stays within free limits.</LI>
            <LI>If you hit rate limits, a brief cooldown period applies before you can generate again.</LI>
          </UL>

          <Callout type="info">
            Unlike WokGen Pixel (which has a paid HD tier for premium image models), WokGen
            UI/UX has a single generation tier. There is no paid upgrade for code generation
            quality — the same model is available to all users.
          </Callout>

          {/* ============================================================== */}
          {/* 11. LIMITATIONS                                                  */}
          {/* ============================================================== */}
          <H2 id="limitations">11. Limitations</H2>

          <P>
            WokGen UI/UX is a powerful first-draft tool, but it has known limitations you
            should be aware of before relying on it for production:
          </P>

          <UL>
            <LI>
              <strong>Output is a starting point, not always production-perfect.</strong>{' '}
              Generated code may have minor inconsistencies — duplicate class names, slightly
              off spacing, or over-verbose markup. Review before shipping.
            </LI>
            <LI>
              <strong>Complex interactions need manual implementation.</strong>{' '}
              Animations, drag-and-drop, multi-step flows, and real-time data binding are
              beyond what a single-generation component can reliably produce. The output
              provides the static scaffold; you add the behavior.
            </LI>
            <LI>
              <strong>No animations generated yet.</strong>{' '}
              CSS keyframe animations and Framer Motion transitions are not currently included
              in generated output. Transition and hover classes are present, but full
              animation sequences require manual addition.
            </LI>
            <LI>
              <strong>No actual data binding.</strong>{' '}
              All data in generated components is hardcoded. To connect to a real API or
              database, you add <Code>useState</Code>, <Code>useEffect</Code>, or server-side
              data fetching logic yourself.
            </LI>
            <LI>
              <strong>Occasional over-engineering.</strong>{' '}
              The model sometimes generates more complex markup than needed for a simple
              component. Don&apos;t hesitate to simplify after copying.
            </LI>
            <LI>
              <strong>Long outputs may truncate.</strong>{' '}
              For very complex full-page components, the model may truncate near the token
              limit. If output looks cut off, try a more focused component type (a section
              rather than a full page) or break the page into multiple generations.
            </LI>
          </UL>

          <Callout type="tip">
            Think of WokGen UI/UX the way you&apos;d think of a senior developer writing a
            first draft. It&apos;s fast and 80% right — your job is the final 20%: polish,
            data wiring, and brand-specific tweaks.
          </Callout>

          {/* ============================================================== */}
          {/* 12. FAQ                                                          */}
          {/* ============================================================== */}
          <H2 id="faq">12. FAQ</H2>

          <H3>Is the generated code accessible?</H3>
          <P>
            Yes, to a reasonable baseline. Generated code includes semantic HTML elements
            (<Code>&lt;nav&gt;</Code>, <Code>&lt;main&gt;</Code>, <Code>&lt;section&gt;</Code>,
            <Code>&lt;button&gt;</Code>), ARIA attributes where commonly expected
            (<Code>aria-label</Code> on icon buttons, <Code>role="dialog"</Code> on modals),
            and keyboard-focusable interactive elements. However, the output is not WCAG-audited
            and should be reviewed for accessibility compliance before shipping to production,
            especially for forms and modals.
          </P>

          <H3>Can I use the generated code commercially?</H3>
          <P>
            Yes. All code generated by WokGen UI/UX is released under the{' '}
            <strong>Apache 2.0 license</strong>. You can use it in commercial projects,
            client work, products, and open-source software without restriction. Attribution
            is not required.
          </P>

          <H3>Does it generate TypeScript?</H3>
          <P>
            Yes. Both <strong>React TSX</strong> and <strong>Next.js TSX</strong> framework
            options generate TypeScript (<Code>.tsx</Code>). Props are typed where they are
            passed explicitly, and the component signature uses TypeScript function syntax.
            For JavaScript output without types, use <strong>HTML + Tailwind</strong> or
            <strong>Vanilla CSS</strong>.
          </P>

          <H3>Does it work with shadcn/ui or other component libraries?</H3>
          <P>
            Generated components use plain Tailwind CSS classes and do not import from
            shadcn/ui, Radix, or other component libraries by default. This keeps the output
            self-contained and portable. If you want to migrate to shadcn/ui components, use
            the generated output as a layout reference and swap primitive elements (buttons,
            inputs, dialogs) for their shadcn equivalents.
          </P>

          <H3>Can I regenerate just part of the output?</H3>
          <P>
            Not directly — each generation produces a complete component. To refine a specific
            part, either edit the code manually or regenerate with a prompt that describes the
            desired change. Regeneration is fast (typically 5–15 seconds), so iterating on
            prompts is usually the quickest path to the result you want.
          </P>

          <H3>What happens if I select the wrong component type?</H3>
          <P>
            The component type helps the model understand structure and conventions, but a
            mismatch just produces slightly less optimal output — it doesn&apos;t cause errors.
            If you selected <strong>Hero</strong> but your prompt describes a pricing section,
            the model will likely produce a reasonable pricing section anyway. For best results,
            match the type to your intent.
          </P>

          <H3>Is there a rate limit?</H3>
          <P>
            Yes. Generation requests are subject to per-user rate limits to ensure fair access
            for all users. If you see a rate-limit error, wait 30–60 seconds before retrying.
            For high-volume usage, contact us about team or enterprise plans.
          </P>

          <H3>Does it support dark mode?</H3>
          <P>
            Style presets like <strong>SaaS Dark</strong> and <strong>Dev Terminal</strong>{' '}
            produce components already styled in dark mode. For light-mode presets with
            automatic dark mode support, mention it in your prompt:{' '}
            <Code>with dark mode support using Tailwind dark: classes</Code>. The model will
            add <Code>dark:</Code> variants to the relevant Tailwind utility classes.
          </P>

          <div className="docs-section docs-section--cta" style={{ marginTop: '3rem' }}>
            <P>
              Ready to generate your first component?{' '}
              <Link href="/uiux/studio" className="docs-link-primary">
                Open the UI/UX Studio →
              </Link>
            </P>
          </div>

        </main>
      </div>
    </div>
  );
}
