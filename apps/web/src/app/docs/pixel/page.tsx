import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Pixel Docs — Prompting Guide, Tools & Export',
  description:
    'Complete documentation for WokGen Pixel. Sprites, animations, tilesets, ' +
    'and game-ready assets. Prompting guide, style presets, tools, and export formats.',
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

// ---------------------------------------------------------------------------
// TOC
// ---------------------------------------------------------------------------

const TOC = [
  { id: 'overview',   label: 'Overview' },
  { id: 'tools',      label: 'Tools' },
  { id: 'prompting',  label: 'Prompting Guide' },
  { id: 'sizes',      label: 'Sizes & Formats' },
  { id: 'styles',     label: 'Style Presets' },
  { id: 'animate',    label: 'Animations' },
  { id: 'export',     label: 'Export & Download' },
  { id: 'limits',     label: 'Limits & Quality' },
  { id: 'faq',        label: 'FAQ' },
];

export default function PixelDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* Sidebar TOC */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            <span style={{ color: '#a78bfa' }}>👾</span>
            <span>WokGen Pixel</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/pixel/studio" className="btn-primary btn-sm">Open Pixel Studio</Link>
          </div>
        </aside>

        {/* Content */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#a78bfa' }} />
              WokGen Pixel
            </div>
            <h1 className="docs-title">Pixel Documentation</h1>
            <p className="docs-subtitle">
              Everything you need to know about generating sprites, animations, tilesets, and game-ready assets.
            </p>
          </div>

          {/* Overview */}
          <H2 id="overview">Overview</H2>
          <P>
            WokGen Pixel is a specialized AI asset generator for game developers.
            It produces pixel art images in a wide range of resolutions, styles, and categories —
            optimized for direct use in games and game engines.
          </P>
          <P>
            Unlike general-purpose image generators, WokGen Pixel enforces pixel-art constraints:
            fixed resolutions, palette coherence, transparent backgrounds, and game-asset categories
            like sprites, tilesets, and UI elements.
          </P>
          <Callout type="tip">
            WokGen Pixel uses a combination of prompt engineering and model selection to enforce
            pixel art style. Free tier uses Pollinations (fast), HD tier uses Replicate FLUX for
            crisp high-detail output.
          </Callout>

          {/* Tools */}
          <H2 id="tools">Tools</H2>

          <H3>Generate</H3>
          <P>Text-to-pixel-art. Provide a description and get a static sprite, tile, or asset.</P>
          <UL>
            <LI>Any style preset, size, era, category, or palette</LI>
            <LI>Batch generation (2–4 images per click)</LI>
            <LI>Optional negative prompt to exclude specific elements</LI>
          </UL>

          <H3>Animate</H3>
          <P>Generate a multi-frame sprite animation as a looping GIF.</P>
          <UL>
            <LI>Choose the animation type: idle, walk, run, attack, effect, fly</LI>
            <LI>Set frame count (4, 6, 8, 12)</LI>
            <LI>Output is a real animated GIF (not a CSS trick)</LI>
          </UL>
          <Callout type="info">
            Animation takes 10–30 seconds depending on frame count and quality setting.
          </Callout>

          <H3>Scene</H3>
          <P>Generate a complete environmental scene: tilesets, maps, dungeon floors, forests, UI panels.</P>
          <UL>
            <LI>Designed for wide aspect ratios (e.g. 256×128 or 512×256)</LI>
            <LI>Consistent palette across the full scene</LI>
            <LI>Best for backgrounds, tilemaps, and environment art</LI>
          </UL>

          <H3>Rotate</H3>
          <P>Generate multi-directional views of a character (front, back, left, right — 4 directions).</P>
          <UL>
            <LI>All 4 images share the same seed family for visual consistency</LI>
            <LI>Best for RPG characters, enemies, and NPCs</LI>
          </UL>

          <H3>Inpaint</H3>
          <P>
            Edit a specific region of an existing pixel art image. Upload an image, paint a mask,
            and describe what to replace.
          </P>
          <UL>
            <LI>Brush-based mask editor in-studio</LI>
            <LI>Useful for swapping weapons, changing colors, fixing details</LI>
          </UL>

          {/* Prompting Guide */}
          <H2 id="prompting">Prompting Guide</H2>

          <P>
            Good pixel art prompts are specific about: <strong>what the asset is</strong>,
            <strong> the style</strong>, <strong>the size</strong>, and <strong>any constraints</strong>.
          </P>

          <H3>Basic formula</H3>
          <Pre>{`[subject], pixel art, [style preset], [size], [extra detail]`}</Pre>

          <H3>Examples</H3>
          <Pre>{`// Sprite
warrior knight with shield, pixel art, NES style, 64x64, front-facing, transparent background

// Enemy
green slime RPG monster, pixel art, cute chibi style, 32x32

// Tileset
stone dungeon floor tileset, pixel art, seamless, dark atmospheric, 64x64 tiles

// UI element
wooden chest item icon, RPG inventory, pixel art, golden lock, 32x32

// Animation
fire mage casting spell, idle animation, pixel art, 8 frames, SNES style`}</Pre>

          <H3>Tips</H3>
          <UL>
            <LI><strong>Always say "pixel art"</strong> — the model needs this signal.</LI>
            <LI><strong>Specify size</strong> — 32x32, 64x64, 128x128. Helps constrain detail level.</LI>
            <LI><strong>Use era presets</strong> — NES, SNES, Game Boy, CPS1, Neo Geo — for period-accurate palettes.</LI>
            <LI><strong>Name the category</strong> — sprite, tileset, icon, HUD element, effect — constrains composition.</LI>
            <LI><strong>Transparent background</strong> — say it explicitly or enable via Background Mode.</LI>
            <LI><strong>Negative prompt</strong> — use it to block photorealism: <Code>photorealistic, 3D render, blurry</Code>.</LI>
          </UL>

          {/* Sizes */}
          <H2 id="sizes">Sizes &amp; Formats</H2>

          <P>WokGen Pixel supports the following resolutions:</P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Resolution</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['32 × 32',   'Icons, small sprites, inventory items'],
                  ['64 × 64',   'Character sprites, enemies, items'],
                  ['128 × 128', 'Detailed characters, UI panels, boss sprites'],
                  ['256 × 256', 'Large characters, environmental tiles, backgrounds'],
                  ['512 × 512', 'Cover art, splash screens, hero assets (HD only)'],
                  ['256 × 128', 'Wide scene tiles, platform sections'],
                  ['512 × 256', 'Background panoramas, wide maps'],
                ].map(([res, use]) => (
                  <tr key={res}>
                    <td><Code>{res}</Code></td>
                    <td>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            Output format is PNG. GIF for animations. All images are downloaded at native resolution.
          </Callout>

          {/* Styles */}
          <H2 id="styles">Style Presets</H2>
          <P>18 style presets tune the generation. Select via the Style dropdown in the studio.</P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Preset</th><th>Description</th></tr>
              </thead>
              <tbody>
                {[
                  ['NES 8-bit',           'Classic 4-color NES palette, hard edges'],
                  ['SNES 16-bit',         '16-color SNES gradient shading, mid-era precision'],
                  ['Game Boy (DMG)',       'Monochrome 4-shade green palette'],
                  ['CPS1 Arcade',         'Bright CPS1 arcade colors, bold outlines'],
                  ['Neo Geo MVS',         'Rich Neo Geo color depth, anime fighter style'],
                  ['C64 Petscii',         'Commodore 64 palette, chunky pixels'],
                  ['ZX Spectrum',         'Bold ZX Spectrum 8-color system palette'],
                  ['Famicom Disk',        'FDS mono/limited color, pastel'],
                  ['MSX1',                'MSX1 16-color tiled graphics'],
                  ['PC-98',               'PC-98 640x400 80s/90s Japanese computer art'],
                  ['Amiga OCS',           '4096-color HAM Amiga palette'],
                  ['Atari 2600',          'Minimal Atari palette, very chunky pixels'],
                  ['Pico-8',              '16-color Pico-8 fantasy console palette'],
                  ['Pokémon GBC',         'GBC Pokémon sprite style, warm pastel'],
                  ['Celeste RPG',         'Modern indie pixel style, clean shading'],
                  ['Stardew-like',        'Warm farm-life indie pixel art style'],
                  ['Minimalist Flat',     'Clean modern pixel with flat shading'],
                  ['Custom Palette',      'No palette enforced — prompt drives colors'],
                ].map(([name, desc]) => (
                  <tr key={name}><td>{name}</td><td>{desc}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Animations */}
          <H2 id="animate">Animations</H2>
          <P>The Animate tool generates multi-frame sprite animations as looping GIFs.</P>

          <H3>How it works</H3>
          <P>
            WokGen generates each frame individually with a seed family (base seed + frame offset),
            then composites them into an animated GIF at the specified frame rate.
          </P>

          <H3>Animation types</H3>
          <UL>
            <LI><strong>Idle</strong> — breathing, blinking, subtle movement</LI>
            <LI><strong>Walk</strong> — walking cycle, 4–8 frames</LI>
            <LI><strong>Run</strong> — run cycle, faster timing</LI>
            <LI><strong>Attack</strong> — melee or ranged attack swing</LI>
            <LI><strong>Effect</strong> — particle or magic effect loop</LI>
            <LI><strong>Fly</strong> — wing flap or float cycle</LI>
          </UL>

          <Callout type="tip">
            Start with 6–8 frames for smooth animation. 4 frames gives a classic chunky retro feel.
          </Callout>

          {/* Export */}
          <H2 id="export">Export &amp; Download</H2>
          <P>
            All generated assets are available for immediate download.
            Click the <strong>↓ Download</strong> button below any result.
          </P>
          <UL>
            <LI>PNG for static images</LI>
            <LI>GIF for animations</LI>
            <LI>Filenames include prompt slug and tool name</LI>
            <LI>No watermarks — ever</LI>
          </UL>

          <H3>Commercial use</H3>
          <P>
            Generated assets are yours to use. Free tier: personal and indie commercial use.
            HD tier: full commercial license including client work and distribution.
            See <Link href="/terms">Terms of Service</Link> for full details.
          </P>

          {/* Limits */}
          <H2 id="limits">Limits &amp; Quality</H2>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Feature</th><th>Free</th><th>HD (Paid)</th></tr>
              </thead>
              <tbody>
                {[
                  ['Generation', 'Unlimited', 'Unlimited'],
                  ['Quality', 'Standard (Pollinations)', 'HD (Replicate FLUX)'],
                  ['Max resolution', '256×256', '512×512'],
                  ['Animations', 'Standard quality', 'HD quality'],
                  ['Commercial use', 'Personal + indie', 'Full commercial'],
                  ['Batch count', '2', '4'],
                ].map(([f, free, hd]) => (
                  <tr key={f}><td>{f}</td><td>{free}</td><td>{hd}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FAQ */}
          <H2 id="faq">FAQ</H2>

          {[
            {
              q: 'Why does my pixel art look blurry?',
              a: 'The model generates at a higher internal resolution and downscales. Use the exact size in your prompt (e.g. "32x32") and enable HD quality for crisper output.',
            },
            {
              q: 'Can I use these assets in a commercial game?',
              a: 'Yes. Free tier assets are licensed for personal and indie commercial use. HD tier includes full commercial rights.',
            },
            {
              q: 'How do I get a transparent background?',
              a: 'Enable "Transparent background" in the Background Mode selector, or include "transparent background" in your prompt.',
            },
            {
              q: 'Why are animations inconsistent frame-to-frame?',
              a: 'This is a current limitation of the generation model. Use the same style preset across all frames and keep your prompt consistent. HD quality significantly improves frame consistency.',
            },
            {
              q: 'Can I use a custom color palette?',
              a: 'Select "Custom Palette" in Style Presets and describe your palette in the prompt. For example: "limited 4-color palette: black, white, red, beige".',
            },
          ].map(({ q, a }) => (
            <div key={q} className="docs-faq-item">
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}

          <div className="docs-content-footer">
            <Link href="/docs" className="btn-ghost btn-sm">← Docs Hub</Link>
            <Link href="/docs/business" className="btn-ghost btn-sm">Business Docs →</Link>
          </div>

        </main>
      </div>
    </div>
  );
}
