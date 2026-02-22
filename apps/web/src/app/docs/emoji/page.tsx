import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Emoji Docs — Custom Emoji Packs, Reactions & App Icons',
  description:
    'Complete user documentation for WokGen Emoji. Learn to generate single emoji, ' +
    'themed packs, stickers, and app icons. Covers all 4 style presets, platform targeting, ' +
    'prompting guide, HD mode, Pack Builder, export, credits, and FAQ.',
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
  return (
    <h4 className="docs-h4" style={{ scrollMarginTop: 80 }}>
      {children}
    </h4>
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
  const icons = { info: 'ℹ', tip: '✦', warn: '⚠' };
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
  { id: 'overview',        label: '1. What is WokGen Emoji' },
  { id: 'tools',           label: '2. Tools' },
  { id: 'presets',         label: '3. Style Presets' },
  { id: 'sizes',           label: '4. Sizes' },
  { id: 'platforms',       label: '5. Platform Targeting' },
  { id: 'prompting',       label: '6. Prompting Guide' },
  { id: 'pack-builder',    label: '7. Pack Builder' },
  { id: 'hd-mode',         label: '8. HD Mode' },
  { id: 'gallery',         label: '9. Community Gallery' },
  { id: 'export',          label: '10. Export' },
  { id: 'credits',         label: '11. Credits & Plans' },
  { id: 'platform-export', label: '12. Platform Export Guide' },
  { id: 'faq',             label: '13. FAQ' },
];

export default function EmojiDocsPage() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar TOC                                                       */}
        {/* ---------------------------------------------------------------- */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            <span style={{ color: '#fbbf24' }}>😄</span>
            <span>WokGen Emoji</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/emoji/studio" className="btn-primary btn-sm">Open Emoji Studio</Link>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#fbbf24' }} />
              WokGen Emoji
            </div>
            <h1 className="docs-title">Emoji Documentation</h1>
            <p className="docs-subtitle">
              Complete guide to generating custom emoji, reactions, stickers, and app icons —
              individually or as cohesive themed packs.
            </p>
          </div>

          {/* ============================================================== */}
          {/* 1. WHAT IS WOKGEN EMOJI                                         */}
          {/* ============================================================== */}
          <H2 id="overview">1. What is WokGen Emoji</H2>

          <P>
            <strong>WokGen Emoji</strong> is a specialized emoji and reaction generator built for
            communities, developers, and creators. It produces individual emoji, reactions,
            stickers, and app icons — or themed packs of four — in styles ranging from expressive
            cartoon to minimal flat to pixel art.
          </P>

          <H3>Who it&apos;s for</H3>
          <UL>
            <LI>
              <strong>Discord communities</strong> — create custom server emoji and reaction packs
              that match your community&apos;s identity and tone.
            </LI>
            <LI>
              <strong>App developers</strong> — generate app icons, in-app stickers, and reaction
              sets in multiple sizes without a dedicated designer.
            </LI>
            <LI>
              <strong>Content creators</strong> — produce branded emoji and stickers for Twitch,
              YouTube, Telegram, or merchandise.
            </LI>
            <LI>
              <strong>Brand teams</strong> — rapidly prototype emoji packs in brand-consistent
              styles to evaluate directions before engaging an illustrator.
            </LI>
          </UL>

          <H3>What WokGen Emoji produces</H3>
          <P>
            WokGen Emoji outputs individual emoji or themed packs of four. Every output is a
            square PNG with a transparent background at your chosen size. Emoji are designed to
            read at small sizes with clear silhouettes and high contrast.
          </P>

          <Callout type="info">
            WokGen Emoji is purpose-built for emoji-scale assets. It is not a general image
            generator — every output is optimised for readability at 32–256 px square.
          </Callout>

          {/* ============================================================== */}
          {/* 2. TOOLS                                                         */}
          {/* ============================================================== */}
          <H2 id="tools">2. Tools</H2>

          <P>
            WokGen Emoji provides two tools accessible from the studio tab bar. Choose based on
            whether you need a single asset or a cohesive multi-emoji pack.
          </P>

          <H3 id="tool-single">Single Emoji</H3>
          <P>
            The <strong>Single Emoji</strong> tool generates one emoji, reaction, or sticker per
            run. Use it when you need a specific expression, a one-off icon, or want to iterate
            quickly on a concept.
          </P>
          <UL>
            <LI>One generation = one PNG output</LI>
            <LI>Full control over style preset, size, and platform target</LI>
            <LI>Best for: reactions, single app icons, testing a concept before building a pack</LI>
          </UL>
          <P><strong>Example use cases:</strong></P>
          <UL>
            <LI>A &quot;GG&quot; celebration emoji for your Discord server</LI>
            <LI>A fire sticker for Telegram</LI>
            <LI>A 1024 px app icon for iOS App Store submission</LI>
            <LI>A thumbs-up reaction in your brand colour style</LI>
          </UL>

          <H3 id="tool-pack">Pack Builder</H3>
          <P>
            The <strong>Pack Builder</strong> fires four parallel emoji generations simultaneously
            around a shared theme, producing a visually cohesive pack in a single click. All four
            emoji share the same style preset and platform target, ensuring a unified look.
          </P>
          <UL>
            <LI>One generation = four PNG outputs displayed in a 2×2 grid</LI>
            <LI>All four share the same style, platform, and size settings</LI>
            <LI>Describe a theme — the engine creates four thematic variants automatically</LI>
            <LI>Download each emoji individually or grab all four as a ZIP</LI>
          </UL>

          <Callout type="tip">
            Pack Builder is ideal for server owners who want a matching set of reactions (e.g.
            agree / disagree / love / hype) or developers building a complete in-app reaction set.
          </Callout>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Outputs</th>
                  <th>Best for</th>
                  <th>Standard cost</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Single Emoji',  '1 PNG',       'One-off emoji, iteration, app icons', 'Free'],
                  ['Pack Builder',  '4 PNG + ZIP', 'Themed packs, reaction sets',         'Free (4× generation)'],
                ].map(([tool, out, best, cost]) => (
                  <tr key={tool}>
                    <td><strong>{tool}</strong></td>
                    <td>{out}</td>
                    <td>{best}</td>
                    <td>{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================== */}
          {/* 3. STYLE PRESETS                                                 */}
          {/* ============================================================== */}
          <H2 id="presets">3. Style Presets</H2>

          <P>
            Style presets control the visual language of your emoji. Each preset applies a
            distinct aesthetic constraint to the generation model. Choose the preset that matches
            the context where your emoji will be used.
          </P>

          <H3 id="preset-expressive">Expressive</H3>
          <P>
            Bold features, vivid saturated colours, and highly emotive designs. This is the
            closest to classic emoji style (think Apple or Google emoji) — faces have exaggerated
            expressions, objects have strong outlines and depth, and emotion reads at a glance.
          </P>
          <UL>
            <LI>High contrast, punchy colours</LI>
            <LI>Thick outlines and rounded shapes</LI>
            <LI>Strong emotional readability at small sizes</LI>
            <LI>Best for: Discord reactions, Slack emoji, general-purpose communication</LI>
          </UL>

          <H3 id="preset-minimal">Minimal</H3>
          <P>
            Simple, clean geometric shapes with flat colour fills and no gradients or shadows.
            Inspired by icon design systems and flat UI aesthetics. Works well when you need emoji
            that integrate cleanly into a polished app UI without visual noise.
          </P>
          <UL>
            <LI>Flat colour, no gradients or drop shadows</LI>
            <LI>Simplified forms — fewer details, geometric outlines</LI>
            <LI>Neutral, professional feel</LI>
            <LI>Best for: app icons, in-app reactions, brand-system emoji</LI>
          </UL>

          <H3 id="preset-blob">Blob</H3>
          <P>
            Amorphous rounded body forms with soft edges and organic silhouettes — inspired by the
            Google Blob emoji era. Characters and objects take on an irregular, blobby shape that
            feels playful and approachable. Faces stretch and squash across the form.
          </P>
          <UL>
            <LI>Organic, asymmetric rounded shapes</LI>
            <LI>Soft edges and smooth fills</LI>
            <LI>Playful, whimsical personality</LI>
            <LI>Best for: Telegram stickers, casual communities, creator branding</LI>
          </UL>

          <H3 id="preset-pixel">Pixel</H3>
          <P>
            8-bit pixel art style with hard-edged pixels, a restricted palette, and pixelated
            rendering. The output uses true pixel-art aesthetics — not a photo filter — with
            intentional dithering and palette choices that evoke retro game graphics.
          </P>
          <UL>
            <LI>Pixelated rendering with hard pixel edges</LI>
            <LI>Restricted colour palette</LI>
            <LI>Authentic retro game feel</LI>
            <LI>Best for: gaming communities, retro-themed Discord servers, game-adjacent apps</LI>
          </UL>

          <Callout type="info">
            The Pixel style in Emoji Studio uses pixelated rendering optimised for emoji scale.
            For full game-asset pixel art (sprites, tilesets, animations), use{' '}
            <Link href="/pixel/studio">WokGen Pixel Studio</Link>.
          </Callout>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>Visual style</th>
                  <th>Palette</th>
                  <th>Best platform</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Expressive', 'Bold, vivid, emotive',          'Full colour',      'Discord, Slack'],
                  ['Minimal',    'Clean flat shapes',              'Flat, limited',    'App icons, in-app UI'],
                  ['Blob',       'Amorphous rounded body',         'Soft, pastel-ish', 'Telegram, creator use'],
                  ['Pixel',      '8-bit pixel art, pixelated',     'Restricted 8-bit', 'Gaming, retro servers'],
                ].map(([preset, style, palette, platform]) => (
                  <tr key={preset}>
                    <td><strong>{preset}</strong></td>
                    <td>{style}</td>
                    <td>{palette}</td>
                    <td>{platform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================== */}
          {/* 4. SIZES                                                         */}
          {/* ============================================================== */}
          <H2 id="sizes">4. Sizes</H2>

          <P>
            WokGen Emoji supports four output sizes. All outputs are square PNGs with transparent
            backgrounds. Choose your size based on the target platform&apos;s requirements — you
            can always scale down a larger asset, but scaling up loses quality.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Dimensions</th>
                  <th>Recommended for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['32px',  '32 × 32 px',   'Inline reactions, low-bandwidth use, retro pixel style'],
                  ['64px',  '64 × 64 px',   'Discord emoji, Slack emoji, standard reactions'],
                  ['128px', '128 × 128 px', 'High-DPI Discord/Slack, Telegram stickers, in-app emoji'],
                  ['256px', '256 × 256 px', 'Large stickers, app icons (non-Store), high-res export'],
                ].map(([size, dims, reco]) => (
                  <tr key={size}>
                    <td><strong>{size}</strong></td>
                    <td><Code>{dims}</Code></td>
                    <td>{reco}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Platform size recommendations</H3>
          <UL>
            <LI>
              <strong>Discord / Slack:</strong> 64–128 px. Both platforms display emoji at
              ~22 px in chat but store up to 128 × 128. Use 128 px for the sharpest result on
              high-DPI screens.
            </LI>
            <LI>
              <strong>App icons (in-app):</strong> 128–256 px. Gives you enough resolution to
              scale down to any in-app display size cleanly.
            </LI>
            <LI>
              <strong>Stickers (Telegram / WhatsApp):</strong> 256 px minimum. Stickers are
              displayed larger than emoji and need the extra detail.
            </LI>
            <LI>
              <strong>iOS App Store icon:</strong> Use HD mode and 256 px, then upscale to
              1024 × 1024 with a lossless tool (or use the platform export workflow in{' '}
              <a href="#platform-export">Section 12</a>).
            </LI>
          </UL>

          <Callout type="tip">
            When in doubt, generate at 128 px. It gives you enough detail for most platforms
            and can be scaled down without quality loss.
          </Callout>

          {/* ============================================================== */}
          {/* 5. PLATFORM TARGETING                                            */}
          {/* ============================================================== */}
          <H2 id="platforms">5. Platform Targeting</H2>

          <P>
            The platform selector tells the generation engine which context the emoji will be used
            in. Selecting a platform adjusts the vocabulary and constraints in the underlying
            prompt — for example, Discord targeting biases toward reaction-style designs, while
            iOS targeting biases toward app icon composition conventions.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Prompt bias</th>
                  <th>Typical use</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Universal',  'Neutral — no platform constraint',            'Cross-platform packs, generic use'],
                  ['Discord',    'Reaction-focused, chat-readable at small size','Server emoji, reactions, role icons'],
                  ['Slack',      'Professional tone, readable in dense UI',     'Workspace emoji, status reactions'],
                  ['Apple iOS',  'App Store icon conventions, depth, gloss',    'iOS app icons, iMessage stickers'],
                  ['Android',    'Material-adjacent, flat with subtle depth',   'Android app icons, in-app emoji'],
                  ['Web',        'Favicon/icon conventions, simple silhouette', 'Favicons, web app icons, badges'],
                  ['Telegram',   'Sticker-scale detail, expressive characters', 'Telegram sticker packs, reactions'],
                ].map(([platform, bias, use]) => (
                  <tr key={platform}>
                    <td><strong>{platform}</strong></td>
                    <td>{bias}</td>
                    <td>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="info">
            Platform targeting is a soft constraint — it shapes the vocabulary of the prompt, not
            the output format. You still choose the size and preset independently. A Discord emoji
            at Expressive preset and 128 px will always look like an expressive 128 px PNG,
            regardless of platform selection.
          </Callout>

          {/* ============================================================== */}
          {/* 6. PROMPTING GUIDE                                               */}
          {/* ============================================================== */}
          <H2 id="prompting">6. Prompting Guide</H2>

          <P>
            WokGen Emoji is designed to work with short, concept-focused prompts. Unlike general
            image generators, it works best when you describe what the emoji <em>is</em> rather
            than how it should look — the style preset handles the aesthetic.
          </P>

          <H3>Core principle: keep it simple</H3>
          <P>
            <strong>Emoji are small, simple things.</strong> A prompt like{' '}
            <Code>happy laughing face</Code> is better than a paragraph describing lighting,
            perspective, and texture. The generation engine is optimised for simple concepts —
            overloading it with detail causes inconsistent results.
          </P>

          <Callout type="warn">
            ❌ <strong>Too complex:</strong> &quot;A brightly coloured happy face emoji with a
            wide open smile showing teeth, tears of joy streaming down both cheeks, and sparkling
            star-shaped glints in the eyes, with a yellow gradient background and soft shadow&quot;
            <br /><br />
            ✅ <strong>Just right:</strong> <Code>happy laughing face, tears of joy, big smile</Code>
          </Callout>

          <H3>Use emotion words</H3>
          <P>
            Emotion vocabulary translates directly into emoji design cues. The engine understands
            emotional states and maps them to expression conventions.
          </P>
          <Pre>{`joy, laughing, tears of joy
sad, crying, devastated
angry, furious, steam
cool, sunglasses, confident
love, heart eyes, adoration
think, pondering, hmm
surprised, shocked, mind blown
sleepy, tired, zzz
fire, hyped, lit
party, celebrate, confetti`}</Pre>

          <H3>Style overrides in the prompt</H3>
          <P>
            You can supplement the style preset with specific appearance cues. These are additive
            — they work alongside the preset, not instead of it.
          </P>
          <UL>
            <LI><strong>Skin / colour:</strong> <Code>yellow skin</Code>, <Code>blue body</Code>, <Code>orange fur</Code></LI>
            <LI><strong>Eyes:</strong> <Code>round eyes</Code>, <Code>cat eyes</Code>, <Code>star eyes</Code></LI>
            <LI><strong>Props:</strong> <Code>party hat</Code>, <Code>sunglasses</Code>, <Code>crown</Code></LI>
            <LI><strong>Special effects:</strong> <Code>glowing</Code>, <Code>sparkles</Code>, <Code>neon outline</Code></LI>
          </UL>

          <H3>Object and non-face emoji</H3>
          <P>
            WokGen Emoji works equally well for objects, symbols, and abstract concepts — not
            just faces. Describe the object simply.
          </P>
          <Pre>{`pizza slice, melting cheese
rainbow, pastel colours
lightning bolt, electric blue
trophy, golden, shiny
calendar, red circle, important
coffee cup, steam rising
rocket, launch, space
skull, crossbones, spooky`}</Pre>

          <H3>Pack prompts</H3>
          <P>
            When using Pack Builder, describe the <em>theme</em> of the pack rather than four
            individual emoji. The engine generates four thematic variants automatically.
          </P>
          <UL>
            <LI><Code>Space themed reactions</Code> → four space-related emoji (rocket, planet, alien, star)</LI>
            <LI><Code>Gaming hype pack</Code> → controller, GG, rage, victory</LI>
            <LI><Code>Cosy café vibes</Code> → coffee, pastry, book, warm light</LI>
            <LI><Code>Spooky Halloween reactions</Code> → ghost, pumpkin, skull, bat</LI>
          </UL>

          <Callout type="tip">
            For Pack Builder, one sentence is ideal. If you write individual descriptions for
            four emoji, you may get inconsistent results — the pack coherence comes from
            letting the engine interpret the theme.
          </Callout>

          {/* ============================================================== */}
          {/* 7. PACK BUILDER                                                  */}
          {/* ============================================================== */}
          <H2 id="pack-builder">7. Pack Builder</H2>

          <P>
            Pack Builder generates four themed emoji in a single click. It is the fastest way
            to build a coherent reaction set or emoji pack without individually prompting each
            emoji.
          </P>

          <H3>How it works</H3>
          <OL>
            <LI>Select the <strong>Pack Builder</strong> tab in the studio.</LI>
            <LI>Choose your style preset, platform target, and size — these apply to all four.</LI>
            <LI>Enter a theme prompt (one sentence describing the pack concept).</LI>
            <LI>Click <strong>Generate Pack</strong>.</LI>
            <LI>Four parallel generations run simultaneously and populate the 2×2 grid.</LI>
            <LI>Download individual emoji or click <strong>Download ZIP</strong> for all four.</LI>
          </OL>

          <H3>2×2 grid layout</H3>
          <P>
            Results are displayed in a 2×2 grid — two emoji on top, two on the bottom. Each cell
            is independently downloadable. The layout is designed to give you a quick visual
            assessment of pack cohesion before downloading.
          </P>

          <H3>ZIP download</H3>
          <P>
            The ZIP download includes all four PNG files named by theme and index
            (e.g. <Code>space-pack-1.png</Code> through <Code>space-pack-4.png</Code>). The ZIP
            is ready to upload directly to Discord or extract for app use.
          </P>

          <Callout type="info">
            Pack Builder always generates exactly four emoji per run. There is no option for
            two or six — four is the optimised pack size for coherence and generation speed.
          </Callout>

          {/* ============================================================== */}
          {/* 8. HD MODE                                                       */}
          {/* ============================================================== */}
          <H2 id="hd-mode">8. HD Mode</H2>

          <P>
            HD Mode uses <strong>FLUX.1 HD via Replicate</strong> for higher fidelity output.
            Where Standard mode is fast and great for iteration, HD produces noticeably sharper
            edges, more accurate colours, and cleaner detail — particularly visible at 128 px
            and above.
          </P>

          <H3>When to use HD</H3>
          <UL>
            <LI>Final export for production use (Discord server, app release, published sticker pack)</LI>
            <LI>App icons where edge quality and colour accuracy matter</LI>
            <LI>Stickers displayed at large sizes (256 px)</LI>
            <LI>Pack Builder runs for packs you intend to publish or sell</LI>
          </UL>

          <H3>HD cost</H3>
          <P>
            HD Mode costs <strong>1 credit per emoji</strong>. For Pack Builder in HD, that is
            4 credits per run (one per emoji). Standard mode is always free.
          </P>

          <H4>Quality comparison</H4>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Standard</th>
                  <th>HD (FLUX.1)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Speed',        '2–5 seconds',  '8–20 seconds'],
                  ['Edge quality', 'Good',         'Crisp, anti-aliased'],
                  ['Colour fidelity', 'Accurate',  'True, vibrant'],
                  ['Detail at 128px', 'Clear',     'High fidelity'],
                  ['Cost',         'Free',         '1 credit per emoji'],
                ].map(([dim, std, hd]) => (
                  <tr key={dim}>
                    <td><strong>{dim}</strong></td>
                    <td>{std}</td>
                    <td>{hd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            Iterate freely with Standard to perfect your prompt, then switch to HD for the final
            generation. You&apos;ll save credits and always get a clean result.
          </Callout>

          {/* ============================================================== */}
          {/* 9. COMMUNITY GALLERY                                             */}
          {/* ============================================================== */}
          <H2 id="gallery">9. Community Gallery</H2>

          <P>
            The <strong>Community Gallery</strong> is an opt-in showcase of emoji and packs
            created by WokGen users. Browse at{' '}
            <Link href="/emoji/gallery">/emoji/gallery</Link>.
          </P>

          <H3>Browsing the gallery</H3>
          <P>
            The gallery is filterable by style preset and by tool (Single Emoji vs Pack Builder).
            Use the filter bar at the top of the page to narrow results. Each entry shows the
            prompt, style preset, platform target, and size used.
          </P>
          <UL>
            <LI><strong>Filter by style:</strong> Expressive, Minimal, Blob, Pixel</LI>
            <LI><strong>Filter by tool:</strong> Single Emoji, Pack Builder</LI>
          </UL>

          <H3>Opting in</H3>
          <P>
            Gallery submission is opt-in. After generating an emoji or pack, toggle{' '}
            <strong>&quot;Share to Gallery&quot;</strong> before downloading. Your prompt and
            settings will be visible alongside the image. You can remove your submissions at any
            time from your account settings.
          </P>

          <Callout type="warn">
            Only share emoji you&apos;re comfortable making public. Do not share emoji containing
            personal information or content that violates the{' '}
            <Link href="/terms">Terms of Service</Link>.
          </Callout>

          {/* ============================================================== */}
          {/* 10. EXPORT                                                       */}
          {/* ============================================================== */}
          <H2 id="export">10. Export</H2>

          <H3>Single Emoji export</H3>
          <P>
            Every emoji is exported as a square <strong>PNG</strong> with a transparent
            background. Click <strong>Download</strong> in the studio to save to your device.
            The filename includes the prompt slug and size (e.g. <Code>happy-laughing-face-128.png</Code>).
          </P>

          <H3>Pack ZIP export</H3>
          <P>
            Pack Builder provides a <strong>Download ZIP</strong> button that bundles all four
            PNG files into a single archive. Files inside the ZIP are named by pack theme and
            index. The ZIP is ready to extract and upload directly to platforms like Discord
            (which accepts batch emoji uploads via the server settings).
          </P>

          <H3>Format notes</H3>
          <UL>
            <LI><strong>Format:</strong> PNG (lossless, supports transparency)</LI>
            <LI><strong>Background:</strong> Transparent (alpha channel)</LI>
            <LI><strong>Colour space:</strong> sRGB</LI>
            <LI><strong>No watermark</strong> on any export (Standard or HD)</LI>
          </UL>

          {/* ============================================================== */}
          {/* 11. CREDITS & PLANS                                              */}
          {/* ============================================================== */}
          <H2 id="credits">11. Credits &amp; Plans</H2>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Standard</th>
                  <th>HD</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Single Emoji generation',   'Free',           '1 credit'],
                  ['Pack Builder (4 emoji)',     'Free',           '4 credits'],
                  ['Gallery opt-in',             'Free',           'Free'],
                  ['ZIP download',               'Free',           'Free'],
                  ['PNG download',               'Free',           'Free'],
                  ['Generation speed',           '2–5 sec',        '8–20 sec'],
                ].map(([feature, std, hd]) => (
                  <tr key={feature}>
                    <td><strong>{feature}</strong></td>
                    <td>{std}</td>
                    <td>{hd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <P>
            Credits can be purchased from your{' '}
            <Link href="/account">account dashboard</Link>. Credits do not expire.
            Standard mode has no usage limits — generate as many emoji as you need at no cost.
          </P>

          <Callout type="info">
            HD credits are per-emoji, not per-pack. A Pack Builder HD run costs 4 credits
            (one per emoji), not 1.
          </Callout>

          {/* ============================================================== */}
          {/* 12. PLATFORM EXPORT GUIDE                                        */}
          {/* ============================================================== */}
          <H2 id="platform-export">12. Platform Export Guide</H2>

          <P>
            Different platforms have specific requirements for emoji and icon uploads. Use this
            section to confirm the right settings before generating your final asset.
          </P>

          <H3 id="export-discord">Discord</H3>
          <UL>
            <LI><strong>Format:</strong> PNG or GIF</LI>
            <LI><strong>Size:</strong> 128 × 128 px recommended</LI>
            <LI><strong>File size limit:</strong> Under 256 KB</LI>
            <LI><strong>Transparency:</strong> Supported</LI>
            <LI><strong>Recommended settings:</strong> 128 px, Expressive or Blob preset, Discord platform target</LI>
          </UL>

          <H3 id="export-slack">Slack</H3>
          <UL>
            <LI><strong>Format:</strong> PNG, JPG, or GIF</LI>
            <LI><strong>Size:</strong> 128 × 128 px (Slack will resize automatically)</LI>
            <LI><strong>File size limit:</strong> Under 1 MB</LI>
            <LI><strong>Recommended settings:</strong> 128 px, Expressive or Minimal preset, Slack platform target</LI>
          </UL>

          <H3 id="export-ios">Apple iOS (App Store Icon)</H3>
          <UL>
            <LI><strong>Format:</strong> PNG (no transparency for App Store submissions)</LI>
            <LI><strong>Size:</strong> 1024 × 1024 px required by App Store</LI>
            <LI><strong>Workflow:</strong> Generate at 256 px HD → upscale to 1024 px with a lossless upscaler (e.g. Upscayl, waifu2x) → fill background before submitting</LI>
            <LI><strong>Recommended settings:</strong> 256 px, Minimal or Expressive preset, Apple iOS platform target, HD mode</LI>
          </UL>

          <H3 id="export-sticker">Stickers (Telegram / WhatsApp)</H3>
          <UL>
            <LI><strong>Format:</strong> PNG with transparency</LI>
            <LI><strong>Minimum size:</strong> 512 × 512 px (Telegram requirement)</LI>
            <LI><strong>Workflow:</strong> Generate at 256 px HD → upscale to 512 px</LI>
            <LI><strong>Recommended settings:</strong> 256 px, Blob or Expressive preset, Telegram platform target, HD mode</LI>
          </UL>

          <Callout type="tip">
            For all platform submissions requiring sizes above 256 px, generate at 256 px with
            HD mode, then upscale with a dedicated upscaling tool. HD mode produces sharp enough
            output that upscaling to 512 or 1024 px retains quality.
          </Callout>

          {/* ============================================================== */}
          {/* 13. FAQ                                                          */}
          {/* ============================================================== */}
          <H2 id="faq">13. FAQ</H2>

          <H3>Can I sell emoji I generate with WokGen?</H3>
          <P>
            Yes. WokGen Emoji outputs are available for commercial use. You can sell emoji
            packs, use them in paid apps, or include them in commercial products. See the{' '}
            <Link href="/terms">Terms of Service</Link> for full details.
          </P>

          <H3>What is the maximum pack size?</H3>
          <P>
            Pack Builder generates exactly four emoji per run. There is no option for larger
            packs in a single generation. To build a larger pack, run Pack Builder multiple times
            with the same theme and collect the best results from each run.
          </P>

          <H3>Can I match an existing emoji style I already have?</H3>
          <P>
            Yes — describe the style in your prompt alongside your concept. For example, if you
            have a flat icon set with thick outlines, add <Code>flat design, thick black outline</Code>{' '}
            to your prompt and use the Minimal preset. Style matching works best when you combine
            a compatible preset with descriptive style vocabulary.
          </P>

          <H3>Is the Pixel style actually pixel art?</H3>
          <P>
            Yes. The Pixel preset uses pixelated rendering that produces authentic 8-bit pixel
            art output — not a post-processing filter applied to a smooth image. Outputs have
            hard pixel edges, a restricted palette, and intentional pixel-grid structure. At 32 px
            the results are indistinguishable from hand-crafted pixel art.
          </P>

          <H3>Why does my emoji look blurry at 32px?</H3>
          <P>
            Blurriness at 32 px is usually caused by a complex concept that doesn&apos;t
            simplify well to a tiny canvas. Simplify your prompt — reduce detail words and focus
            on the single central concept. The Minimal preset also tends to produce cleaner
            results at 32 px than Expressive.
          </P>

          <H3>Can I use Pack Builder results individually?</H3>
          <P>
            Yes. Each of the four emoji in a Pack Builder run is independently downloadable as
            its own PNG. The ZIP is a convenience — you are not required to use all four.
          </P>

          <H3>Does HD mode work with Pack Builder?</H3>
          <P>
            Yes. Enabling HD mode in Pack Builder applies HD generation to all four emoji in the
            pack, at a cost of 4 credits per run (1 credit per emoji).
          </P>

          <H3>What happens if a generation fails?</H3>
          <P>
            Failed generations do not consume credits. If a Standard generation fails, simply
            re-generate — it is free. If an HD generation fails before completing, the credit is
            refunded to your account automatically.
          </P>

          <div className="docs-section docs-section--footer">
            <P>
              Have a question not covered here?{' '}
              <Link href="/docs">Browse the Docs Hub</Link> or{' '}
              <Link href="/discord">join the WokGen Discord</Link> for community support.
            </P>
          </div>

        </main>
      </div>
    </div>
  );
}
