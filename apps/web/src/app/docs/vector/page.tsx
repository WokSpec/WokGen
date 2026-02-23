import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Vector Docs — SVG Icons, Illustrations & Design Systems',
  description:
    'Complete user documentation for WokGen Vector. Learn to generate scalable icon sets, ' +
    'spot illustrations, and design system components. Covers style presets, prompting guide, ' +
    'HD mode, sizes, export, workspaces, credits, and FAQ.',
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
  { id: 'overview',   label: '1. What is WokGen Vector' },
  { id: 'tools',      label: '2. Tools Reference' },
  { id: 'presets',    label: '3. Style Presets' },
  { id: 'sizes',      label: '4. Size Guide' },
  { id: 'prompting',  label: '5. Prompting Guide' },
  { id: 'hd-mode',    label: '6. HD Mode' },
  { id: 'batch',      label: '7. Batch & Variants' },
  { id: 'export',     label: '8. Export Guide' },
  { id: 'workspace',  label: '9. Workspaces' },
  { id: 'gallery',    label: '10. Community Gallery' },
  { id: 'credits',    label: '11. Credits & Plans' },
  { id: 'faq',        label: '12. FAQ' },
];

export default function VectorDocsPage() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar TOC                                                       */}
        {/* ---------------------------------------------------------------- */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            
            <span>WokGen Vector</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/vector/studio" className="btn-primary btn-sm">Open Vector Studio</Link>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#34d399' }} />
              WokGen Vector
            </div>
            <h1 className="docs-title">Vector Documentation</h1>
            <p className="docs-subtitle">
              Complete guide to generating scalable icons, spot illustrations, and
              design system assets — clean vector-art output with consistent style.
            </p>
          </div>

          {/* ============================================================== */}
          {/* 1. OVERVIEW                                                      */}
          {/* ============================================================== */}
          <H2 id="overview">1. What is WokGen Vector</H2>

          <P>
            <strong>WokGen Vector</strong> is a specialized icon and illustration generator
            built for designers. It produces clean, vector-art styled assets at precise
            dimensions — scalable icon sets, editorial spot illustrations, and design system
            components, all with consistent line weight and visual language.
          </P>

          <H3>Who it&apos;s for</H3>
          <UL>
            <LI><strong>UI/UX designers</strong> — build cohesive icon libraries for web and mobile products without inconsistent stock icons.</LI>
            <LI><strong>Design system maintainers</strong> — generate a full set of icons in a single style preset to keep visual language consistent across a product.</LI>
            <LI><strong>Illustration teams</strong> — rapidly produce spot illustrations for landing pages, onboarding flows, and editorial layouts.</LI>
            <LI><strong>Frontend developers</strong> — generate placeholder icons and illustrations during prototyping to iterate on layout before final design.</LI>
          </UL>

          <H3>What WokGen Vector produces</H3>
          <P>
            All outputs are <strong>PNG by default</strong> with vector-art styling — clean
            geometric shapes, consistent stroke weights, and flat or outlined aesthetics.
            <strong> HD mode</strong> uses the Recraft V3 SVG model via Replicate to produce
            true vector-quality output at the highest fidelity. See{' '}
            <a href="#hd-mode">HD Mode</a> for details.
          </P>

          <H3>What WokGen Vector is NOT</H3>
          <P>
            WokGen Vector is <strong>not</strong> a general-purpose image or photo generator.
            It does not produce realistic photos, pixel art, or raster textures. Every output
            is constrained to vector-art aesthetics: clean geometry, flat or outlined shapes,
            and icon/illustration categories. For game sprites, use{' '}
            <Link href="/docs/pixel">WokGen Pixel</Link> instead.
          </P>

          <Callout type="tip">
            Use Standard mode to iterate quickly on your icon concept for free, then switch to
            HD mode for the final export. You&apos;ll save credits and get cleaner results.
          </Callout>

          {/* ============================================================== */}
          {/* 2. TOOLS REFERENCE                                               */}
          {/* ============================================================== */}
          <H2 id="tools">2. Tools Reference</H2>

          <P>
            WokGen Vector has two tools accessible from the top tab bar in the studio.
            Each tool is optimized for a different asset scale and use case.
          </P>

          {/* --- Icon ------------------------------------------------------ */}
          <H3 id="tool-icon">Icon</H3>
          <P>
            The <strong>Icon</strong> tool generates scalable single-concept icons designed
            on a <strong>24 px grid baseline</strong>. Icons are output at sizes from 24 px
            to 256 px. The rendering is optimized for clarity at small sizes — clean shapes,
            consistent stroke weight, minimal interior detail.
          </P>

          <P><strong>Best for:</strong></P>
          <UL>
            <LI>Navigation and UI icons — menu, search, settings, user, bell, home</LI>
            <LI>Action icons — add, delete, edit, share, download, upload</LI>
            <LI>Category icons — finance, health, travel, food, education</LI>
            <LI>Status indicators — success, warning, error, info</LI>
            <LI>Social and brand glyphs — email, phone, location, calendar</LI>
            <LI>Design system icon sets — consistent families of 20–200+ icons</LI>
          </UL>

          <P><strong>Output:</strong> PNG with transparent background. File size is minimal
          at 24 px (1–3 KB) and moderate at 256 px (10–40 KB).</P>

          <P><strong>Grid baseline:</strong> All icons are designed on a 24 px optical grid,
          matching the convention used by Material Icons, Phosphor Icons, and Heroicons.
          This means icons generated at any size share the same proportional geometry and
          align naturally in icon grids.</P>

          <P><strong>Example prompts:</strong></P>
          <Pre>{`settings gear, minimal, 2px stroke
shopping cart, filled, rounded corners
bell notification, outlined, badge dot
user profile circle, filled
arrow up-right, sharp corners, navigation
wifi signal bars, three levels, outlined`}</Pre>

          {/* --- Illustration ---------------------------------------------- */}
          <H3 id="tool-illustration">Illustration</H3>
          <P>
            The <strong>Illustration</strong> tool generates larger spot illustrations in an
            editorial or product-marketing style. Illustrations are output at 256–768 px and
            are designed for use in empty-state screens, onboarding flows, landing pages,
            and editorial content.
          </P>

          <P><strong>Best for:</strong></P>
          <UL>
            <LI>Empty state illustrations — &quot;no results&quot;, &quot;inbox zero&quot;, &quot;404 page&quot;</LI>
            <LI>Onboarding step visuals — feature introduction, walkthrough screens</LI>
            <LI>Landing page hero supplements — supporting visuals alongside headlines</LI>
            <LI>Blog and editorial spot art — article header supplements, pull quotes</LI>
            <LI>Email and notification imagery — transactional email illustrations</LI>
          </UL>

          <P><strong>Output:</strong> PNG with transparent or solid background. At 512 px,
          file sizes are typically 30–120 KB Standard, 60–200 KB HD.</P>

          <P><strong>Example prompts:</strong></P>
          <Pre>{`person celebrating with confetti, success state, flat illustration
empty inbox, no mail, calm and minimal, blue tones
rocket launching, onboarding step 1, bold flat style
team collaborating at whiteboard, editorial, warm colors
magnifying glass over documents, search empty state`}</Pre>

          <Callout type="info">
            Illustrations benefit from style hints more than icons do. Adding color directions
            like &quot;warm tones&quot;, &quot;blue palette&quot;, or &quot;monochrome&quot;
            significantly improves result consistency.
          </Callout>

          {/* ============================================================== */}
          {/* 3. STYLE PRESETS                                                 */}
          {/* ============================================================== */}
          <H2 id="presets">3. Style Presets</H2>

          <P>
            Style presets define the visual language applied to all outputs. Choosing the
            right preset is the single most impactful decision for visual consistency across
            an icon set or illustration library.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>Description</th>
                  <th>Best for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Outline',  'Stroke-only, no fill, consistent line weight throughout', 'Developer tools, SaaS UI, minimal products'],
                  ['Filled',   'Solid shapes, flat color fills, no gradients or shadows', 'Mobile apps, marketing sites, bold UI'],
                  ['Rounded',  'Soft corners, friendly geometry, slightly increased stroke weight', 'Consumer apps, health, education, lifestyle'],
                  ['Sharp',    'Angular corners, technical geometry, precise optical alignment', 'Finance, engineering, data tools, B2B SaaS'],
                ].map(([preset, desc, use]) => (
                  <tr key={preset}>
                    <td><strong>{preset}</strong></td>
                    <td>{desc}</td>
                    <td>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3 id="preset-outline">Outline</H3>
          <P>
            Stroke-only rendering with no fill. Every shape is defined purely by its outline
            at a consistent stroke weight (approximately 1.5–2 px at 24 px base, scaled
            proportionally). This is the most versatile preset and the best default choice
            for developer tools, SaaS products, and neutral UI systems.
          </P>
          <Callout type="tip">
            Outline icons can be tinted with CSS <Code>color</Code> and{' '}
            <Code>stroke</Code> properties at render time, making them ideal for themed design
            systems with dark/light mode support.
          </Callout>

          <H3 id="preset-filled">Filled</H3>
          <P>
            Solid flat shapes with no outline stroke. Fills are solid colors — no gradients,
            no shadows, no effects. This preset produces bold, high-contrast icons that are
            immediately recognizable at very small sizes (16–24 px) and work well in
            navigation bars and mobile UIs where clarity at small scale is critical.
          </P>

          <H3 id="preset-rounded">Rounded</H3>
          <P>
            Soft rounded corners applied to all geometric elements — rectangles, paths, and
            angles all receive a consistent corner radius. This preset gives icons and
            illustrations a friendly, approachable character suitable for consumer-facing
            products in health, education, and lifestyle categories.
          </P>

          <H3 id="preset-sharp">Sharp</H3>
          <P>
            Angular, precise corners with no rounding. Shapes are strictly geometric —
            squares, triangles, and angles are rendered at exact pixel boundaries. This
            preset produces a technical, rigorous aesthetic suited to finance applications,
            engineering tools, data dashboards, and B2B enterprise products.
          </P>

          {/* ============================================================== */}
          {/* 4. SIZE GUIDE                                                    */}
          {/* ============================================================== */}
          <H2 id="sizes">4. Size Guide</H2>

          <P>
            Sizes are selected per-generation and can be changed freely between runs.
            The two tools (Icon and Illustration) have different size ranges reflecting
            their different use cases.
          </P>

          <H3>Icon sizes</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Use case</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['24 px',  'Inline UI icons, nav bars, dense interfaces', 'Minimum size — keeps shapes simple and readable'],
                  ['32 px',  'List icons, button icons, toolbar items',      'Good balance of detail and clarity'],
                  ['48 px',  'Feature icons, card headers, menu items',      'Most common icon export size for web'],
                  ['64 px',  'Section headers, hero callouts, larger CTAs', 'Enough detail for minor stylistic variation'],
                  ['128 px', 'App icons, large feature callouts',            'HD recommended for final production assets'],
                  ['256 px', 'Icon showcase, documentation, print usage',   'Always use HD for this size'],
                ].map(([size, use, note]) => (
                  <tr key={size}>
                    <td><Code>{size}</Code></td>
                    <td>{use}</td>
                    <td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Illustration sizes</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Use case</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['256 px', 'Small spot illustrations, compact empty states',       'Fast generation, good for prototyping'],
                  ['512 px', 'Standard editorial illustrations, onboarding screens', 'Best default for most illustration needs'],
                  ['768 px', 'Large hero illustrations, print-ready editorial art',  'HD strongly recommended at this size'],
                ].map(([size, use, note]) => (
                  <tr key={size}>
                    <td><Code>{size}</Code></td>
                    <td>{use}</td>
                    <td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>HD mode and size</H3>
          <P>
            HD mode (Recraft V3) provides higher fidelity at any size, but becomes especially
            important at 128 px and above for icons, and at 512 px and above for illustrations.
            Below 64 px, Standard and HD results are visually similar — save your credits for
            larger outputs.
          </P>

          <Callout type="tip">
            Generate at your target export size rather than scaling down later. Recraft V3
            renders geometry natively at each resolution — scaling down a 256 px icon to
            24 px will not produce the same optical quality as generating at 24 px directly.
          </Callout>

          {/* ============================================================== */}
          {/* 5. PROMPTING GUIDE                                               */}
          {/* ============================================================== */}
          <H2 id="prompting">5. Prompting Guide</H2>

          <P>
            Prompting for vector icons and illustrations is different from prompting for
            pixel art or photos. Vector generation responds best to <strong>concept-first,
            noun-led descriptions</strong> with precise visual modifiers.
          </P>

          <H3>Core principle</H3>
          <P>
            Describe <strong>what the icon represents</strong>, not what you want the
            generation process to do. Lead with the subject, then add modifiers for shape,
            style, and context. Keep prompts concise — under 120 characters is ideal.
          </P>

          <H3>Good prompts vs bad prompts</H3>

          <H4>Icons</H4>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Good</th><th>Bad</th><th>Why</th></tr>
              </thead>
              <tbody>
                {[
                  [
                    'Settings gear, rounded corners, minimal detail',
                    'Make me a cool settings icon',
                    'Bad prompt is vague — no shape, no style information',
                  ],
                  [
                    'Shopping cart, outlined, two wheels visible',
                    'Shopping cart icon please',
                    'Bad prompt lacks the specific visual details needed for consistent output',
                  ],
                  [
                    'Bell with notification dot, filled, top-right badge',
                    'A notification bell that looks good',
                    '"Looks good" gives no visual direction',
                  ],
                  [
                    'Blue filled cloud with upload arrow, minimal',
                    'Upload to cloud, make it modern',
                    '"Modern" is subjective; specify color and fill instead',
                  ],
                ].map(([good, bad, why]) => (
                  <tr key={good}>
                    <td><Code>{good}</Code></td>
                    <td><Code>{bad}</Code></td>
                    <td>{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H4>Illustrations</H4>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Good</th><th>Bad</th></tr>
              </thead>
              <tbody>
                {[
                  [
                    'Person at laptop celebrating, confetti, success state, flat illustration, warm tones',
                    'Make a happy illustration',
                  ],
                  [
                    'Empty inbox, envelope with checkmark, calm and minimal, blue and white palette',
                    'Something for when there are no emails',
                  ],
                  [
                    'Rocket launching from planet, onboarding hero, bold shapes, purple gradient background',
                    'Cool rocket thing for an app',
                  ],
                ].map(([good, bad]) => (
                  <tr key={good}>
                    <td><Code>{good}</Code></td>
                    <td><Code>{bad}</Code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Useful prompt modifiers</H3>

          <H4>Color hints</H4>
          <UL>
            <LI><Code>blue fill</Code> — requests a specific fill color for a filled-style icon</LI>
            <LI><Code>monochrome</Code> — single-color output, good for icon sets that will be tinted in CSS</LI>
            <LI><Code>warm tones</Code>, <Code>cool palette</Code> — broad color direction for illustrations</LI>
            <LI><Code>black stroke on white</Code> — explicit contrast specification</LI>
          </UL>

          <H4>Style overrides</H4>
          <UL>
            <LI><Code>thick stroke</Code> — heavier line weight for bold, chunky icons</LI>
            <LI><Code>thin stroke</Code> — lighter, more refined line weight</LI>
            <LI><Code>no fill</Code> — forces outline-only even in Filled preset</LI>
            <LI><Code>flat illustration</Code> — reinforces flat style for illustrations</LI>
            <LI><Code>geometric shapes only</Code> — forces strict geometric construction, no organic curves</LI>
          </UL>

          <H4>Category and context hints</H4>
          <UL>
            <LI><Code>finance app icon set</Code> — primes the model for financial category visual language</LI>
            <LI><Code>health & wellness</Code> — warmer, softer icon aesthetics</LI>
            <LI><Code>developer tools</Code> — sharper, more technical icon treatment</LI>
            <LI><Code>editorial illustration</Code> — more complex, narrative-driven compositions for illustrations</LI>
          </UL>

          <H3>Consistency across a set</H3>
          <P>
            When building an icon set, use the same style prefix on every prompt. For example,
            if your set uses &quot;outlined, 2px stroke, rounded&quot;, include that phrase
            at the start or end of every prompt. This keeps the visual language coherent
            even across varied concepts.
          </P>
          <Pre>{`outlined, 2px stroke, rounded — settings gear
outlined, 2px stroke, rounded — user profile
outlined, 2px stroke, rounded — notification bell
outlined, 2px stroke, rounded — shopping cart`}</Pre>

          <Callout type="tip">
            Save your style prefix as a prompt prefix in your workspace description so you
            can copy it quickly between generations.
          </Callout>

          {/* ============================================================== */}
          {/* 6. HD MODE                                                       */}
          {/* ============================================================== */}
          <H2 id="hd-mode">6. HD Mode</H2>

          <P>
            HD mode routes your generation through <strong>Recraft V3</strong> — a dedicated
            vector-art model available via Replicate — instead of the standard Pollinations
            pipeline. It produces true vector-quality output with significantly higher fidelity,
            sharper geometry, and more accurate style adherence.
          </P>

          <H3>How HD mode works</H3>
          <OL>
            <LI>You select <strong>HD</strong> in the quality toggle before generating.</LI>
            <LI>Your prompt and settings are sent to Recraft V3 via Replicate&apos;s API.</LI>
            <LI>Recraft V3 generates a native SVG-based output at the requested dimensions.</LI>
            <LI>The result is delivered as a high-fidelity PNG to your gallery.</LI>
          </OL>

          <H3>HD vs Standard comparison</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Standard</th>
                  <th>HD (Recraft V3)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Model',            'Pollinations (free)',        'Recraft V3 via Replicate'],
                  ['Cost',             'Free',                       '2 HD credits per generation'],
                  ['Generation time',  '2–6 seconds',                '8–20 seconds'],
                  ['Output quality',   'Good — fast prototyping',    'Excellent — production-ready'],
                  ['Geometry quality', 'Approximate',                'Precise vector geometry'],
                  ['Style adherence',  'Good',                       'Very high — tight preset fidelity'],
                  ['Best for',         'Iteration, exploration',     'Final exports, design systems'],
                ].map(([feat, std, hd]) => (
                  <tr key={feat}>
                    <td><strong>{feat}</strong></td>
                    <td>{std}</td>
                    <td>{hd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>When to use HD mode</H3>
          <UL>
            <LI>Final production exports for a live product</LI>
            <LI>Design system icon sets where visual consistency is critical</LI>
            <LI>Any icon at 128 px or larger</LI>
            <LI>Illustrations at 512 px or larger</LI>
            <LI>When presenting assets to stakeholders or clients</LI>
          </UL>

          <H3>When Standard is sufficient</H3>
          <UL>
            <LI>Early-stage prompt iteration (refining concept and wording)</LI>
            <LI>Placeholder icons during wireframing or prototyping</LI>
            <LI>Icons at 24–64 px where the difference is minimal</LI>
            <LI>Internal team previews and design reviews</LI>
          </UL>

          <Callout type="info">
            HD credits are per-generation, not per-output. A ×4 batch in HD mode costs
            2 credits total (not 8) — you get 4 high-quality variants for the price of
            one HD generation. See <a href="#batch">Batch &amp; Variants</a>.
          </Callout>

          {/* ============================================================== */}
          {/* 7. BATCH & VARIANTS                                              */}
          {/* ============================================================== */}
          <H2 id="batch">7. Batch &amp; Variants</H2>

          <P>
            Batch mode generates multiple results from a single prompt in one click.
            Each result in a batch is a <strong>variant</strong> — the same concept rendered
            with a different seed, producing slight variations in angle, weight, framing,
            or detail emphasis.
          </P>

          <H3>Batch sizes</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Results</th>
                  <th>Best for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['×1', '1 result',  'Single best-effort generation when you have a clear concept'],
                  ['×2', '2 results', 'Quick A/B — pick the better result from two variants'],
                  ['×4', '4 results', 'Best for icon sets — choose the most consistent style across four options'],
                ].map(([batch, results, use]) => (
                  <tr key={batch}>
                    <td><strong>{batch}</strong></td>
                    <td>{results}</td>
                    <td>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>What varies between batch results</H3>
          <P>
            Each variant in a batch uses a different random seed. The concept and prompt
            remain identical, but the model explores different interpretations:
          </P>
          <UL>
            <LI><strong>Angle / perspective</strong> — slight rotation or viewing angle variation</LI>
            <LI><strong>Stroke weight</strong> — minor variation in line thickness relative to canvas</LI>
            <LI><strong>Framing</strong> — how tightly the subject is cropped within the canvas</LI>
            <LI><strong>Detail emphasis</strong> — which secondary details are included or simplified</LI>
          </UL>

          <H3>Batch and credits</H3>
          <P>
            In <strong>Standard mode</strong>, batches are always free regardless of size.
            In <strong>HD mode</strong>, a batch costs <strong>2 credits per generation</strong>
            regardless of batch size — a ×4 HD batch costs 2 credits and returns 4 variants.
          </P>

          <Callout type="tip">
            Use ×4 batch in HD mode to get the best value from your credits. Four production-ready
            icon variants for 2 credits gives you real design choices.
          </Callout>

          {/* ============================================================== */}
          {/* 8. EXPORT GUIDE                                                  */}
          {/* ============================================================== */}
          <H2 id="export">8. Export Guide</H2>

          <P>
            All generated assets are available for download from the gallery and studio.
            Multiple export formats and packaging options are supported.
          </P>

          <H3>Single PNG download</H3>
          <P>
            Every generated asset can be downloaded as a PNG directly from the gallery card
            or the studio result panel. Click the download button on any result to save it
            at full generation resolution with a transparent background.
          </P>

          <H3>ZIP pack export</H3>
          <P>
            Select multiple results in your gallery and use the <strong>Pack &amp; Export</strong>
            option to download all selected icons or illustrations as a single ZIP archive.
            The ZIP contains individual PNG files named by prompt and generation ID for easy
            organization.
          </P>
          <UL>
            <LI>Select assets using the checkbox on each gallery card</LI>
            <LI>Click <strong>Export Pack</strong> in the toolbar</LI>
            <LI>Choose file naming format (prompt-based or ID-based)</LI>
            <LI>Download the ZIP — files are ready for import into Figma, Sketch, or your asset pipeline</LI>
          </UL>

          <H3>Future: SVG direct export</H3>
          <P>
            Direct SVG export (providing the raw SVG source from Recraft V3 HD generations)
            is planned for a future release. When available, SVG export will be accessible
            for all HD-generated assets and will include clean, optimized SVG markup suitable
            for inline use in HTML and React components.
          </P>

          <Callout type="info">
            In the current release, PNG is the primary export format. HD mode (Recraft V3)
            produces vector-quality PNG output that can be cleanly auto-traced to SVG using
            tools like Inkscape, Adobe Illustrator, or Vectorizer.ai if needed.
          </Callout>

          <H3>Importing into Figma</H3>
          <OL>
            <LI>Export your icon set as a ZIP from the gallery.</LI>
            <LI>Unzip the archive to a local folder.</LI>
            <LI>In Figma, use <strong>File → Import</strong> or drag the PNG files onto the canvas.</LI>
            <LI>Select all imported icons and use <strong>Plugins → Batch Rename</strong> to organize by name.</LI>
            <LI>For icon components, convert each PNG to a component (<Code>⌥⌘K</Code>) and organize into a component set.</LI>
          </OL>

          {/* ============================================================== */}
          {/* 9. WORKSPACES                                                    */}
          {/* ============================================================== */}
          <H2 id="workspace">9. Workspaces</H2>

          <P>
            Workspaces let you organize your generated assets by project. Each workspace
            is dedicated to a single mode — a Vector workspace contains only Vector
            generations, keeping icon sets and illustration libraries cleanly separated
            from other mode outputs.
          </P>

          <H3>Creating a workspace</H3>
          <OL>
            <LI>Open Vector Studio at <Link href="/vector/studio">/vector/studio</Link>.</LI>
            <LI>Click the workspace selector in the top bar.</LI>
            <LI>Select <strong>New Workspace</strong> and give it a project name.</LI>
            <LI>All generations in this session will be saved to that workspace automatically.</LI>
          </OL>

          <H3>Workspace best practices</H3>
          <UL>
            <LI><strong>One workspace per product or client</strong> — keep a &quot;Acme App Icons&quot; workspace separate from &quot;Personal Project Illustrations&quot;.</LI>
            <LI><strong>Name by style preset</strong> — if you maintain multiple icon families with different presets, name workspaces by preset: &quot;ProductName — Outline&quot;, &quot;ProductName — Filled&quot;.</LI>
            <LI><strong>Use workspace notes</strong> — add a description to your workspace with your style prefix so you can reference it quickly during generation sessions.</LI>
          </UL>

          <H3>Workspace and gallery</H3>
          <P>
            Workspaces are private by default. Assets within a workspace can be selectively
            shared to the Community Gallery (see <a href="#gallery">Community Gallery</a>).
            Deleting a workspace does not immediately delete the assets — they move to your
            Unsorted gallery and can be reassigned.
          </P>

          {/* ============================================================== */}
          {/* 10. COMMUNITY GALLERY                                            */}
          {/* ============================================================== */}
          <H2 id="gallery">10. Community Gallery</H2>

          <P>
            The Community Gallery is an opt-in public showcase of Vector generations shared
            by WokGen users. You can browse it for inspiration, discover prompt patterns,
            and share your own work.
          </P>

          <H3>Sharing to the gallery</H3>
          <P>
            Sharing is always opt-in. To share a result:
          </P>
          <OL>
            <LI>Open the asset in your gallery or studio result panel.</LI>
            <LI>Click <strong>Share to Community</strong>.</LI>
            <LI>The asset becomes visible at <Link href="/vector/gallery">/vector/gallery</Link>
            {' '}filtered by your style preset and tool type.</LI>
          </OL>

          <H3>Browsing the gallery</H3>
          <P>
            The Vector gallery at <Link href="/vector/gallery">/vector/gallery</Link> can be
            filtered by:
          </P>
          <UL>
            <LI><strong>Style preset</strong> — Outline, Filled, Rounded, Sharp</LI>
            <LI><strong>Tool</strong> — Icon or Illustration</LI>
            <LI><strong>Size</strong> — filter by output dimensions</LI>
            <LI><strong>HD / Standard</strong> — filter by quality tier</LI>
          </UL>

          <Callout type="info">
            Community gallery assets are shared under the same Apache-2.0 license as all
            WokGen outputs. See <a href="#faq">FAQ</a> for commercial use details.
          </Callout>

          {/* ============================================================== */}
          {/* 11. CREDITS & PLANS                                              */}
          {/* ============================================================== */}
          <H2 id="credits">11. Credits &amp; Plans</H2>

          <H3>Standard (free)</H3>
          <P>
            Standard mode is always free and uses the Pollinations provider. There are no
            generation limits on Standard — generate as many icons and illustrations as you
            need without consuming any credits. Standard is the right tier for all
            iteration, prototyping, and non-production use.
          </P>

          <H3>HD (credit-based)</H3>
          <P>
            HD mode uses Recraft V3 via Replicate and costs <strong>2 HD credits per
            generation</strong>. Credits apply per generation request, not per individual
            image in a batch — a ×4 HD batch returns 4 images for 2 credits.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Credit cost</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Standard generation (any size, any batch)', 'Free — 0 credits'],
                  ['HD generation (×1 batch)',                   '2 HD credits'],
                  ['HD generation (×2 batch)',                   '2 HD credits'],
                  ['HD generation (×4 batch)',                   '2 HD credits'],
                ].map(([action, cost]) => (
                  <tr key={action}>
                    <td>{action}</td>
                    <td><strong>{cost}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Acquiring credits</H3>
          <P>
            HD credits can be purchased as bundles from the{' '}
            <Link href="/docs/platform/billing">Billing &amp; Plans</Link> page.
            Some subscription plans include a monthly HD credit allocation. See the billing
            docs for current bundle pricing and plan details.
          </P>

          <Callout type="tip">
            Free Standard generations never expire or run out. Use Standard to explore,
            experiment, and iterate — switch to HD only when you&apos;re ready to export
            production-quality assets.
          </Callout>

          {/* ============================================================== */}
          {/* 12. FAQ                                                          */}
          {/* ============================================================== */}
          <H2 id="faq">12. FAQ</H2>

          <H3>Can I use WokGen Vector outputs commercially?</H3>
          <P>
            Yes. All outputs generated by WokGen Vector are released under the{' '}
            <strong>Apache-2.0 license</strong>. You can use them in commercial products,
            client work, SaaS applications, and marketing materials without restriction or
            attribution requirement.
          </P>

          <H3>Can I get true SVG files?</H3>
          <P>
            HD mode uses the Recraft V3 SVG model, which generates native SVG internally.
            Currently, outputs are delivered as high-fidelity PNGs. Direct SVG export (raw
            SVG source) is planned for a future release. For now, HD PNGs can be auto-traced
            to clean SVG using Inkscape, Adobe Illustrator, or Vectorizer.ai with very good
            results given the vector-art aesthetic of Recraft V3 outputs.
          </P>

          <H3>What&apos;s the difference between Icon and Illustration?</H3>
          <P>
            The difference is <strong>scale and complexity</strong>. Icon is optimized for
            single-concept symbols at small sizes (24–256 px), designed on a 24 px grid for
            UI clarity. Illustration is optimized for larger, narrative or scene-based
            compositions (256–768 px) with more visual complexity and editorial character.
            Use Icon for UI elements and design systems. Use Illustration for empty states,
            onboarding screens, and editorial layouts.
          </P>

          <H3>How do I keep an icon set visually consistent?</H3>
          <P>
            Use the same style preset for every icon in the set, and include a consistent
            style prefix in every prompt (e.g. <Code>outlined, 2px stroke, rounded —</Code>).
            Keep icons in the same workspace, generate at the same size, and use ×4 batch to
            pick the most consistent variant from each generation. See the{' '}
            <a href="#prompting">Prompting Guide</a> for more detail.
          </P>

          <H3>Does batch mode produce the same icon multiple times?</H3>
          <P>
            No. Each result in a batch uses a different random seed, producing genuine
            variants of the concept with differences in angle, weight, framing, and detail.
            You are not paying for duplicates — you are getting multiple valid interpretations
            to choose from.
          </P>

          <H3>What happens to my assets if I delete a workspace?</H3>
          <P>
            Deleting a workspace does not delete your assets. All assets from the deleted
            workspace are moved to your Unsorted gallery and remain accessible. You can
            reassign them to a new workspace at any time.
          </P>

          <H3>Is there a bulk generation API?</H3>
          <P>
            Yes — the WokGen API supports programmatic Vector generation. See the{' '}
            <Link href="/docs/platform/api">API Reference</Link> for endpoint documentation,
            authentication setup, and response format details.
          </P>

        </main>
      </div>
    </div>
  );
}
