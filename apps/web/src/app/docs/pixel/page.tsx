import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Pixel Docs — Sprites, Animations, Tilesets & Game Assets',
  description:
    'Complete user documentation for WokGen Pixel. Learn to generate sprites, ' +
    'animations, tilesets, direction views, and more. Covers all 18 style presets, ' +
    'prompting guide, size guide, export, workspaces, credits, and FAQ.',
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
  return <ol className="docs-ul" style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}>{children}</ol>;
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
  { id: 'overview',   label: '1. Overview' },
  { id: 'quickstart', label: '2. Quick Start' },
  { id: 'tools',      label: '3. Tools Reference' },
  { id: 'presets',    label: '4. Style Presets' },
  { id: 'prompting',  label: '5. Prompting Guide' },
  { id: 'sizes',      label: '6. Size Guide' },
  { id: 'export',     label: '7. Export Guide' },
  { id: 'workspace',  label: '8. Workspace & Projects' },
  { id: 'credits',    label: '9. Credits & Limits' },
  { id: 'faq',        label: '10. FAQ' },
];

export default function PixelDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar TOC                                                       */}
        {/* ---------------------------------------------------------------- */}
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

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}
        <main className="docs-content">

          <div className="docs-content-header">
            <div className="landing-badge">
              <span className="landing-badge-dot" style={{ background: '#a78bfa' }} />
              WokGen Pixel
            </div>
            <h1 className="docs-title">Pixel Documentation</h1>
            <p className="docs-subtitle">
              Complete guide to generating game-ready pixel art — sprites, animations,
              tilesets, direction sheets, and more.
            </p>
          </div>

          {/* ============================================================== */}
          {/* 1. OVERVIEW                                                      */}
          {/* ============================================================== */}
          <H2 id="overview">1. Overview</H2>

          <P>
            <strong>WokGen Pixel</strong> is a specialized pixel-art asset generator built for
            game developers. It is purpose-built to produce game-ready sprites, tilesets,
            spritesheets, animated GIFs, and direction views at fixed pixel-perfect resolutions
            with coherent palettes and transparent backgrounds.
          </P>

          <H3>Who it&apos;s for</H3>
          <UL>
            <LI><strong>Indie developers</strong> — solo devs and small teams who need fast, consistent placeholder or final art without hiring a pixel artist.</LI>
            <LI><strong>Game jam participants</strong> — generate a full set of character sprites, tiles, and UI icons in hours rather than days.</LI>
            <LI><strong>Mobile game studios</strong> — rapidly prototype retro-style asset sets, test visual directions, and iterate on character designs.</LI>
            <LI><strong>Hobbyist game makers</strong> — RPGMaker, GDevelop, Godot, and Unity users who want a fast asset pipeline.</LI>
          </UL>

          <H3>What WokGen Pixel is NOT</H3>
          <P>
            WokGen Pixel is <strong>not</strong> a general-purpose image generator. It does not
            produce photos, illustrations, or vector art. Every output is constrained to pixel-art
            aesthetics: fixed resolutions, palette-aware rendering, and game-asset categories.
            If you need general image generation, use a different tool.
          </P>

          <H3>Output types</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Output type</th>
                  <th>Tool</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sprite',          'Sprite (generate)',     'Single-frame static PNG, transparent background'],
                  ['Spritesheet',     'Sprite (generate)',     'Multi-frame laid out on a grid, single PNG'],
                  ['Animated GIF',    'Animate',               'Looping multi-frame animation exported as GIF'],
                  ['Direction views', 'Directions (rotate)',   '4 or 8 directional views in a grid PNG'],
                  ['Tileset',         'Tileset (scene)',       'Seamless-edge-matching tileable map section'],
                  ['Edited sprite',   'Edit (inpaint)',        'Masked region of an existing sprite replaced'],
                ].map(([out, tool, desc]) => (
                  <tr key={out}>
                    <td><strong>{out}</strong></td>
                    <td><Code>{tool}</Code></td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Standard (free) vs HD (credit-based)</H3>
          <P>
            Every tool has two quality tiers. <strong>Standard</strong> is always free and uses
            Pollinations — fast results, excellent for prototyping and iteration.{' '}
            <strong>HD</strong> uses a premium model for crisp, high-detail output and costs
            credits. HD is recommended for final assets, print-quality sprites, and
            512 px outputs. See <a href="#credits">Credits &amp; Limits</a> for details.
          </P>

          <Callout type="tip">
            Start with Standard to iterate on your prompt, then switch to HD for your final
            export. You&apos;ll save credits and get cleaner results.
          </Callout>

          {/* ============================================================== */}
          {/* 2. QUICK START                                                   */}
          {/* ============================================================== */}
          <H2 id="quickstart">2. Quick Start</H2>

          <P>
            Generating your first pixel art asset takes under a minute. Follow these three steps.
          </P>

          <H3>Step 1 — Pick a preset</H3>
          <P>
            Open the <strong>Pixel Studio</strong> at{' '}
            <Link href="/pixel/studio">wokgen.wokspec.org/pixel/studio</Link>.
            In the top-left panel, choose a style preset. For most RPG assets, start with{' '}
            <Code>rpg_icon</Code>. For a character, use <Code>character_idle</Code>.
            For a dungeon tile, use <Code>tileset</Code>.
          </P>

          <H3>Step 2 — Write a short, noun-focused prompt</H3>
          <P>
            Type a concise description. The most common mistake new users make is writing a
            paragraph — the model works best with <strong>short noun-focused phrases under
            200 characters</strong>. Lead with the subject, then add descriptors.
          </P>
          <Callout type="warn">
            ❌ <strong>Bad:</strong> &quot;I want a really cool fire sword that looks ancient
            and battle-worn, maybe with some glowing runes on the blade and a red gem in the
            hilt, it should feel powerful and dangerous&quot;<br />
            ✅ <strong>Good:</strong> <Code>fire sword, battle-worn blade, glowing runes, red gem hilt</Code>
          </Callout>
          <P>
            Notice: do <strong>not</strong> write &quot;pixel art&quot; yourself — the engine
            automatically adds the pixel-art style constraint based on your chosen preset and
            size. Adding it manually can cause the model to over-apply it.
          </P>

          <H3>Step 3 — Generate</H3>
          <P>
            Click <strong>Generate</strong>. Standard results appear in 3–8 seconds. HD results
            take 10–25 seconds. Use the zoom controls (1×, 2×, 4×) to inspect the output at
            native resolution before downloading.
          </P>

          <H3>Walkthrough: fire sword with rpg_icon preset</H3>
          <OL>
            <LI>Select preset: <Code>rpg_icon</Code></LI>
            <LI>Select size: <Code>64</Code> (64 × 64 px)</LI>
            <LI>Select quality: <Code>Standard</Code></LI>
            <LI>Enter prompt: <Code>fire sword, battle-worn blade, ember glow</Code></LI>
            <LI>Click <strong>Generate</strong></LI>
            <LI>Zoom to 4× to check details</LI>
            <LI>Click <strong>Download</strong> or <strong>Save to Gallery</strong></LI>
          </OL>
          <Callout type="tip">
            If the first result doesn&apos;t match, re-generate without changing anything first —
            each run uses a different random seed. If results consistently miss, refine your
            prompt (add a material: &quot;iron blade&quot;, add a mood: &quot;dark fantasy&quot;).
          </Callout>

          {/* ============================================================== */}
          {/* 3. TOOLS REFERENCE                                               */}
          {/* ============================================================== */}
          <H2 id="tools">3. Tools Reference</H2>

          <P>
            WokGen Pixel has five tools accessible from the top tab bar in the studio.
            Each tool is optimized for a different asset type.
          </P>

          {/* --- Sprite ---------------------------------------------------- */}
          <H3 id="tool-sprite">Sprite</H3>
          <P>
            The <strong>Sprite</strong> tool (engine name: <Code>generate</Code>) produces a
            single-frame static sprite on a transparent background. This is the most versatile
            tool and the right starting point for the majority of game assets.
          </P>

          <P><strong>Best for:</strong></P>
          <UL>
            <LI>Inventory items — weapons, armour, potions, keys, gems</LI>
            <LI>Character sprites — heroes, NPCs, enemies, bosses</LI>
            <LI>Monster icons — slimes, skeletons, dragons, elementals</LI>
            <LI>Tile singles — floor, wall, door, water, lava, grass</LI>
            <LI>UI elements — buttons, frames, health bars, icons</LI>
            <LI>Decorative objects — barrels, chests, pillars, torches</LI>
          </UL>

          <P><strong>Output:</strong> PNG with alpha (transparent background by default). File size is tiny at 32 px (1–4 KB), moderate at 256 px (20–80 KB), and up to 200 KB at 512 px HD.</P>

          <P><strong>HD vs Standard:</strong> Standard produces clean sprites suitable for most uses. HD adds significantly more pixel detail, sharper outlines, and more accurate palette adherence — recommended for 128 px and above.</P>

          <P><strong>Example prompts:</strong></P>
          <Pre>{`iron longsword, ornate crossguard, fantasy RPG weapon
green health potion bottle, cork stopper, glowing liquid
skeleton archer enemy, tattered cloak, bone bow
leather boots, worn and muddy, adventure gear
treasure chest, golden lock, wooden planks, side view
blue mana crystal, faceted gem, glowing inner light`}</Pre>

          <Callout type="info">
            The Sprite tool always outputs a single image. For a row of animation frames in a
            single PNG, use the <strong>Animate</strong> tool with &quot;export as spritesheet&quot;
            enabled instead of GIF.
          </Callout>

          {/* --- Animate --------------------------------------------------- */}
          <H3 id="tool-animate">Animate</H3>
          <P>
            The <strong>Animate</strong> tool generates a multi-frame pixel art animation
            and exports it as a looping <strong>GIF</strong> or a <strong>PNG spritesheet</strong>
            (frames laid out horizontally in a single image). Both formats are ready to drop
            into your game engine.
          </P>

          <P><strong>Animation types available:</strong></P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Type</th><th>Frames</th><th>Description</th></tr>
              </thead>
              <tbody>
                {[
                  ['idle',      '4–8',  'Breathing, blinking, subtle sway — looping background animation'],
                  ['walk',      '6–8',  'Side-view walk cycle with leg movement'],
                  ['run',       '6–8',  'Faster run cycle, more exaggerated motion'],
                  ['attack',    '4–6',  'Melee swing or ranged shot — one full attack motion'],
                  ['cast',      '6–8',  'Spellcast wind-up, release, and recovery'],
                  ['death',     '4–6',  'Character or enemy death/collapse sequence'],
                  ['fire',      '4–8',  'Flame flicker loop — suitable for torches and campfires'],
                  ['magic',     '6–8',  'Magical particle/glow effect loop'],
                  ['explosion', '6–8',  'Expanding explosion burst, one-shot or loop'],
                  ['water',     '6–8',  'Ripple or wave animation loop for water tiles'],
                ].map(([type, frames, desc]) => (
                  <tr key={type}>
                    <td><Code>{type}</Code></td>
                    <td>{frames}</td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <P><strong>Frame count guide:</strong></P>
          <UL>
            <LI><Code>4 frames</Code> — Snappy, classic retro feel. Fast to generate. Good for NES/Game Boy era.</LI>
            <LI><Code>6 frames</Code> — Smooth without being over-animated. Best balance for most use cases.</LI>
            <LI><Code>8 frames</Code> — Fluid, cinematic motion. Best for hero characters and prominent enemies.</LI>
            <LI>More than 8 frames increases generation time significantly with diminishing returns at pixel scale.</LI>
          </UL>

          <P><strong>FPS guide:</strong></P>
          <UL>
            <LI><Code>6 fps</Code> — Retro chunky. Authentic NES/Famicom feel.</LI>
            <LI><Code>8 fps</Code> — Classic SNES/GBA feel. Most common for RPGs.</LI>
            <LI><Code>12 fps</Code> — Smooth modern pixel animation. Good for action games.</LI>
            <LI><Code>18 fps</Code> — Fast and fluid. Best for effects, explosions, fast attacks.</LI>
          </UL>

          <P><strong>Reference image upload:</strong> You can upload an existing sprite as a
          reference. The engine will attempt to match the character&apos;s silhouette, colour
          palette, and proportions across all frames, giving you much better frame-to-frame
          consistency.</P>

          <P><strong>GIF export:</strong> The output GIF uses the exact frame dimensions you
          selected (e.g. 64 × 64 px per frame). GIFs are indexed-color (256 colours max), which
          is actually ideal for pixel art and produces very small file sizes — typically 20–150 KB
          for a 6-frame 64 px animation.</P>

          <P><strong>Example prompts:</strong></P>
          <Pre>{`warrior knight, idle animation, slight breathing movement
red dragon, walk cycle, side view, wings folded
fire torch wall mount, flickering flame loop
blue wizard, cast animation, staff raised, magic particles
slime enemy, idle bounce, jelly wobble`}</Pre>

          <Callout type="tip">
            For walk/run cycles, specify &quot;side view&quot; in your prompt. For idle animations
            designed for top-down games, say &quot;top-down view, idle&quot;.
          </Callout>

          {/* --- Directions ------------------------------------------------ */}
          <H3 id="tool-directions">Directions</H3>
          <P>
            The <strong>Directions</strong> tool (engine name: <Code>rotate</Code>) generates
            multiple directional views of a single character or object in one operation.
            This is essential for top-down RPGs and isometric games where characters
            must face in multiple directions.
          </P>

          <P><strong>4-direction mode</strong> produces views for:</P>
          <UL>
            <LI>Front (facing toward camera / south)</LI>
            <LI>Right (east)</LI>
            <LI>Back (facing away / north)</LI>
            <LI>Left (west)</LI>
          </UL>

          <P><strong>8-direction mode</strong> adds four diagonal views:</P>
          <UL>
            <LI>Front-right (south-east)</LI>
            <LI>Front-left (south-west)</LI>
            <LI>Back-right (north-east)</LI>
            <LI>Back-left (north-west)</LI>
          </UL>

          <Callout type="tip">
            Use a reference image with the Directions tool whenever possible. Upload your
            front-facing sprite and the engine will keep colours, proportions, and equipment
            consistent across all views.
          </Callout>

          <P><strong>Output format:</strong> The result is a single PNG containing all
          directional frames arranged in a grid — 2×2 for 4 directions, 2×4 for 8 directions.
          You can also download each direction as a separate PNG strip. The grid PNG is
          directly usable in engines like RPGMaker MZ/MV (which expect this exact layout).</P>

          <P><strong>Example prompt:</strong></P>
          <Pre>{`top-down warrior, plate armor, sword and shield, RPG character
forest elf ranger, leather armor, bow equipped, top-down
skeleton guard, spear, cracked armor, undead, 4-direction`}</Pre>

          <Callout type="info">
            8-direction generation takes roughly twice as long as 4-direction. Start with 4
            directions during development and add diagonals when you&apos;re finalizing art.
          </Callout>

          {/* --- Edit ------------------------------------------------------ */}
          <H3 id="tool-edit">Edit</H3>
          <P>
            The <strong>Edit</strong> tool (engine name: <Code>inpaint</Code>) lets you modify
            a specific masked region of an existing pixel art image. Upload a sprite, paint
            over the region you want to change with the brush tool, describe the replacement,
            and generate.
          </P>

          <P><strong>Good use cases:</strong></P>
          <UL>
            <LI>Swapping a weapon — paint over the sword, describe &quot;iron axe, wooden handle&quot;</LI>
            <LI>Adding detail — paint over empty chest area, describe &quot;glowing rune tattoo, blue light&quot;</LI>
            <LI>Changing colours — paint over a cloak, describe &quot;red velvet cloak&quot; instead of blue</LI>
            <LI>Fixing a region — paint over a garbled area and describe what should be there</LI>
            <LI>Adding equipment — paint shoulder area and describe &quot;iron pauldron, battle-worn&quot;</LI>
          </UL>

          <P><strong>Bad use cases (expect poor results):</strong></P>
          <UL>
            <LI>Masking the entire image for a full regeneration — use Sprite for that</LI>
            <LI>Trying to change the art style or palette across the whole sprite</LI>
            <LI>Asking for structural pose changes (standing → running)</LI>
          </UL>

          <Callout type="warn">
            Keep your mask tight and targeted. Masking large areas causes the engine to
            regenerate too much and the result will diverge from the original sprite.
            Small, focused masks produce the best edits.
          </Callout>

          <P><strong>Mask brush controls:</strong> Use the brush size slider to adjust
          precision. Zoom in with 2× or 4× before painting for pixel-accurate masks.
          The red overlay shows your masked region before you submit.</P>

          {/* --- Tileset --------------------------------------------------- */}
          <H3 id="tool-tileset">Tileset</H3>
          <P>
            The <strong>Tileset</strong> tool (engine name: <Code>scene</Code>) generates
            seamless, tileable game map sections — dungeon floors, forests, deserts, snow,
            water, and more. The output is designed so adjacent tiles connect without
            visible seams or edges.
          </P>

          <P><strong>Map size options:</strong></P>
          <UL>
            <LI><Code>1×1</Code> — Single tile (useful as a base texture)</LI>
            <LI><Code>2×2</Code> — 2-tile-wide section. Good for most use cases.</LI>
            <LI><Code>4×4</Code> — Larger map section with more varied detail. Best for backgrounds.</LI>
          </UL>

          <P><strong>Seamless edge matching:</strong> The Tileset tool applies a seamless
          tiling constraint so the left edge matches the right edge and the top edge matches
          the bottom edge. You can tile the output infinitely in any direction. Test this by
          loading the PNG into your engine and placing it adjacently.</P>

          <P><strong>Example prompts:</strong></P>
          <Pre>{`stone dungeon floor, dark grey cobblestones, moss cracks
lush green grass meadow, small flowers, sunny
lava cavern floor, glowing cracks, volcanic rock
snow tundra ground, frost patterns, icy surface
wooden plank floor, tavern interior, warm light`}</Pre>

          <Callout type="tip">
            Avoid describing objects in a Tileset prompt — no barrels, chests, or characters.
            The engine should generate a uniform surface. Objects belong in separate Sprite
            generations that you place on top of your tileset.
          </Callout>

          {/* ============================================================== */}
          {/* 4. STYLE PRESETS GUIDE                                           */}
          {/* ============================================================== */}
          <H2 id="presets">4. Style Presets Guide</H2>

          <P>
            WokGen Pixel includes <strong>18 style presets</strong> organized into 5 categories.
            Selecting the right preset is the single biggest lever you have for output quality —
            it controls pixel density expectations, colour palette, outline weight, and
            compositional framing.
          </P>

          {/* Characters */}
          <H3>Characters</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>What it produces</th>
                  <th>Best prompt types</th>
                  <th>Rec. size</th>
                  <th>Do NOT use for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'character_idle',
                    'Front-facing character sprite, slight idle pose, full body',
                    'Hero, NPC, vendor, villager — any human or humanoid',
                    '64 or 128',
                    'Weapons, tiles, UI elements',
                  ],
                  [
                    'character_side',
                    'Side-view character for platformers, walking stance',
                    'Platformer characters, side-scrollers, profile views',
                    '64 or 128',
                    'Top-down games, isometric characters',
                  ],
                  [
                    'top_down_char',
                    'Overhead bird\'s-eye character, visible from above',
                    'Top-down RPG characters, Zelda-like heroes, NPCs',
                    '32 or 64',
                    'Platformers, portrait art',
                  ],
                  [
                    'chibi',
                    'Super-deformed chibi style — large head, small body',
                    'Cute characters, mobile game heroes, mascots',
                    '64',
                    'Serious/horror aesthetics, tiles',
                  ],
                  [
                    'portrait',
                    'Face/bust portrait for dialogue boxes, character select',
                    'NPC portraits, dialogue faces, character select screens',
                    '128 or 256',
                    'Full-body sprites, tile generation',
                  ],
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i}>{i === 0 ? <Code>{cell}</Code> : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Items */}
          <H3>Items</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>What it produces</th>
                  <th>Best prompt types</th>
                  <th>Rec. size</th>
                  <th>Do NOT use for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'rpg_icon',
                    'Centred item on transparent bg — inventory icon style',
                    'Potions, scrolls, gems, food, misc loot, rings, amulets',
                    '32 or 64',
                    'Characters, tiles, large objects',
                  ],
                  [
                    'weapon_icon',
                    'Weapon viewed at 45° angle, optimised for armaments',
                    'Swords, axes, bows, staves, daggers, hammers, spears',
                    '64',
                    'Armour, potions, tiles',
                  ],
                  [
                    'badge_icon',
                    'Achievement / badge style — circular or shield framing',
                    'Achievement icons, skill icons, class badges, emblems',
                    '64',
                    'Environment art, characters',
                  ],
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i}>{i === 0 ? <Code>{cell}</Code> : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Environments */}
          <H3>Environments</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>What it produces</th>
                  <th>Best prompt types</th>
                  <th>Rec. size</th>
                  <th>Do NOT use for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'tileset',
                    'Ground-level tile for grid-based maps — orthogonal view',
                    'Stone, grass, dirt, sand, water, ice, lava floor tiles',
                    '64 or 128',
                    'Characters, UI, perspective views',
                  ],
                  [
                    'nature_tile',
                    'Nature-themed tile — trees, bushes, flowers, rocks',
                    'Forest tiles, outdoor maps, nature props',
                    '64',
                    'Indoor dungeon scenes, UI',
                  ],
                  [
                    'isometric',
                    'Isometric 2:1 projection tile/object',
                    'Isometric buildings, furniture, ground tiles',
                    '128 or 256',
                    'Top-down orthogonal tiles, side-view sprites',
                  ],
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i}>{i === 0 ? <Code>{cell}</Code> : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FX & UI */}
          <H3>FX &amp; UI</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>What it produces</th>
                  <th>Best prompt types</th>
                  <th>Rec. size</th>
                  <th>Do NOT use for</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'animated_effect',
                    'Particle/effect sprite optimised for animation sequences',
                    'Fire, magic, explosions, sparks, holy light, dark void',
                    '64',
                    'Characters, tiles, static items',
                  ],
                  [
                    'game_ui',
                    'UI panel or HUD element with game-appropriate framing',
                    'Health bars, skill buttons, inventory frames, menu boxes',
                    '128 or 256',
                    'Character sprites, tileable maps',
                  ],
                  [
                    'sprite_sheet',
                    'Multi-frame spritesheet (frames in a horizontal row)',
                    'Walk cycles, attack animations laid out as a strip',
                    '256 wide',
                    'Single static items, tiles',
                  ],
                  [
                    'emoji',
                    'Emoji-like expressive icon — round, cute, bold',
                    'Reaction icons, emotion bubbles, mobile stickers',
                    '32 or 64',
                    'Serious RPG items, detailed characters',
                  ],
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i}>{i === 0 ? <Code>{cell}</Code> : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advanced */}
          <H3>Advanced</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>What it produces</th>
                  <th>Best prompt types</th>
                  <th>Rec. size</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    'sci_fi',
                    'Sci-fi themed pixel art — metal, neon, tech aesthetic',
                    'Space ships, robots, tech items, cyberpunk characters',
                    '64 or 128',
                    'Good for space games and cyberpunk titles',
                  ],
                  [
                    'horror',
                    'Dark horror aesthetic — desaturated, distorted, eerie',
                    'Monsters, undead, cursed items, blood, dark environments',
                    '64 or 128',
                    'Not suitable for cute/cheerful content',
                  ],
                  [
                    'raw',
                    'Minimal style enforcement — prompt drives everything',
                    'Experimental prompts, unusual styles, custom requests',
                    'Any',
                    'Use when other presets overconstrain the result',
                  ],
                ].map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i}>{i === 0 ? <Code>{cell}</Code> : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            When in doubt, <Code>rpg_icon</Code> is the safest default for items and small
            objects. <Code>character_idle</Code> for any humanoid. <Code>tileset</Code> for
            any ground surface. <Code>raw</Code> when experimenting.
          </Callout>

          {/* ============================================================== */}
          {/* 5. PROMPTING GUIDE                                               */}
          {/* ============================================================== */}
          <H2 id="prompting">5. Prompting Guide</H2>

          <P>
            Writing effective prompts is the most impactful skill in WokGen Pixel. A
            well-structured prompt with the right preset will produce consistent, usable
            results on the first or second try.
          </P>

          <H3>Prompt structure</H3>
          <P>Follow this four-part formula:</P>
          <Pre>{`[noun] + [descriptor] + [material] + [mood/era]`}</Pre>
          <P>Examples:</P>
          <Pre>{`// [noun]          [descriptor]      [material]       [mood]
iron longsword,   double-edged,     forged steel,    dark fantasy
leather satchel,  worn and patched, brown hide,      adventure
skeleton warrior, cracked armor,    aged bone,       undead horror
crystal orb,      glowing purple,   faceted glass,   arcane magic`}</Pre>

          <H3>Good vs bad prompt examples</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>❌ Bad</th><th>✅ Good</th><th>Why</th></tr>
              </thead>
              <tbody>
                {[
                  [
                    'Make a sword for my RPG game that looks really cool',
                    'iron sword, ornate crossguard, battle-worn',
                    'Specific nouns and descriptors outperform vague requests',
                  ],
                  [
                    'pixel art character sprite',
                    'forest elf archer, green cloak, leather bracers',
                    'The preset handles "pixel art" — focus on the subject',
                  ],
                  [
                    'a nice looking dungeon floor tile please',
                    'stone dungeon floor, dark cobblestones, moss cracks',
                    'Short, noun-first prompts produce more consistent results',
                  ],
                  [
                    'fire magic explosion effect with particles and glow',
                    'fire explosion, orange core, white hot centre',
                    'Reduce to key visual elements rather than listing effects',
                  ],
                ].map(([bad, good, why]) => (
                  <tr key={bad}>
                    <td style={{ color: 'var(--docs-warn, #f97316)' }}>{bad}</td>
                    <td style={{ color: 'var(--docs-tip, #22c55e)' }}>{good}</td>
                    <td>{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Length limit</H3>
          <P>
            Keep prompts under <strong>200 characters</strong>. Beyond that, additional words
            tend to interfere rather than help. If you find yourself writing a long description,
            prioritise: subject noun → primary material → most important visual detail → mood.
            Cut everything else.
          </P>

          <H3>Do NOT write &quot;pixel art&quot;</H3>
          <P>
            The Pixel Studio engine prepends the pixel-art constraint automatically based on
            your preset and size selection. Writing &quot;pixel art&quot; in the prompt itself
            often causes the model to overweight the style token and under-weight your actual
            subject description. Leave it out.
          </P>

          <H3>Category-specific tips</H3>

          <P><strong>Weapons:</strong></P>
          <UL>
            <LI>Always name the weapon type first: sword, axe, bow, staff, dagger, lance</LI>
            <LI>Describe material before decoration: <Code>iron blade, gold runes</Code> not <Code>gold rune iron blade</Code></LI>
            <LI>Add &quot;weapon icon&quot; or use the <Code>weapon_icon</Code> preset for inventory-style orientation</LI>
            <LI>For magical weapons add a light source: <Code>glowing blue edge</Code>, <Code>fire-enchanted blade</Code></LI>
          </UL>

          <P><strong>Characters:</strong></P>
          <UL>
            <LI>Specify role/class before appearance: <Code>dark knight, full plate armor</Code></LI>
            <LI>Include pose hint when needed: <Code>idle stance</Code>, <Code>arms at sides</Code></LI>
            <LI>Describe colour of primary garment: <Code>red tunic</Code>, <Code>white robe</Code></LI>
            <LI>For top-down games add: <Code>top-down view, overhead perspective</Code></LI>
            <LI>Chibi characters: add <Code>chibi style, large head</Code> or use <Code>chibi</Code> preset</LI>
          </UL>

          <P><strong>Tiles:</strong></P>
          <UL>
            <LI>Name the surface material first: <Code>stone</Code>, <Code>grass</Code>, <Code>wood</Code>, <Code>water</Code></LI>
            <LI>Add a secondary variation detail: <Code>moss cracks</Code>, <Code>small pebbles</Code>, <Code>frost pattern</Code></LI>
            <LI>Mood/lighting is effective: <Code>dark damp dungeon</Code>, <Code>sun-baked desert sand</Code></LI>
            <LI>Never include objects (chests, enemies) in a tile prompt — tiles should be uniform surfaces</LI>
          </UL>

          <P><strong>Effects:</strong></P>
          <UL>
            <LI>Describe the core visual element first: <Code>fire burst</Code>, <Code>ice crystal</Code>, <Code>lightning bolt</Code></LI>
            <LI>Add colour temperature: <Code>cold blue</Code>, <Code>hot orange-white</Code>, <Code>sickly green</Code></LI>
            <LI>Use the <Code>animated_effect</Code> preset for anything intended to animate</LI>
            <LI>For looping effects, keep it symmetrical in your description: <Code>circular flame ring</Code></LI>
          </UL>

          <H3>Era / style guide</H3>
          <P>
            Adding an era keyword helps lock in the visual feel. These work as prompt additions
            even without selecting a specific era preset:
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Keyword</th><th>Visual feel</th><th>Colours</th></tr>
              </thead>
              <tbody>
                {[
                  ['NES style',      'Hard edges, chunky pixels, minimal detail',     '4-colour palette per tile'],
                  ['SNES style',     'Gradient shading, medium detail',               '16 colours per sprite'],
                  ['Game Boy',       'Monochrome green, very blocky',                 '4 shades of green'],
                  ['Pico-8 style',   'Fantasy console palette, clean and bright',     '16 fixed colours'],
                  ['Stardew style',  'Warm indie, medium resolution, soft outlines',  'Natural earth tones'],
                  ['CPS1 arcade',    'Bold outlines, bright saturated colours',       '32+ colours, vivid'],
                  ['modern indie',   'High detail, smooth shading, clean outlines',   'Full colour range'],
                ].map(([kw, feel, colours]) => (
                  <tr key={kw}>
                    <td><Code>{kw}</Code></td>
                    <td>{feel}</td>
                    <td>{colours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Palette guide</H3>
          <P>
            To specify a colour palette in your prompt, describe it in plain English after your
            main subject:
          </P>
          <Pre>{`// Restrict to a specific palette
iron sword, cold blue steel, limited palette: navy, silver, white
forest tile, earthy greens, limited palette: dark green, brown, tan
potion bottle, warm glow, limited palette: amber, gold, orange`}</Pre>

          <H3>Outline guide</H3>
          <P>
            Outlines are on by default for most presets. You can influence outline style with
            these prompt additions:
          </P>
          <UL>
            <LI><Code>black outline</Code> — classic hard outline (default for most presets)</LI>
            <LI><Code>no outline</Code> — outline-free, softer look (works best at 128 px+)</LI>
            <LI><Code>colored outline</Code> — outline matches the sprite&apos;s dominant colour</LI>
            <LI><Code>thick outline</Code> — bold black outline for high visibility in-game</LI>
          </UL>

          {/* ============================================================== */}
          {/* 6. SIZE GUIDE                                                    */}
          {/* ============================================================== */}
          <H2 id="sizes">6. Size Guide</H2>

          <P>
            Choosing the right resolution is critical for pixel art. Too small and detail is
            lost; too large and the model wastes resolution on empty space around small objects.
          </P>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Label</th>
                  <th>Best for</th>
                  <th>Quality tier</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    '32 × 32',
                    'Tiny',
                    'UI icons, status symbols, mini-map markers, coin/gem counters',
                    'Standard or HD',
                    'Very few pixels available — keep prompt minimal. Avoid complex characters.',
                  ],
                  [
                    '64 × 64',
                    'Standard ✓',
                    'Most sprites — characters, enemies, items, weapons, tiles',
                    'Standard or HD',
                    'Recommended default for the majority of game assets. Best bang-for-buck.',
                  ],
                  [
                    '128 × 128',
                    'Detailed',
                    'Complex characters, boss sprites, large objects, detailed tiles',
                    'HD recommended',
                    'Standard can look blurry at 128 px — HD makes a meaningful difference here.',
                  ],
                  [
                    '256 × 256',
                    'Large',
                    'Tilesets, environmental backgrounds, splash screens, map sections',
                    'HD recommended',
                    'Excellent for tileset generation. File sizes grow — 50–150 KB per PNG.',
                  ],
                  [
                    '512 × 512',
                    'Full',
                    'Spritesheets, full backgrounds, cover art, large UI panels',
                    'HD only',
                    'HD-only tier. Not available on Standard. Very large file sizes (100–300 KB).',
                  ],
                ].map(([size, label, best, tier, notes]) => (
                  <tr key={size}>
                    <td><Code>{size}</Code></td>
                    <td><strong>{label}</strong></td>
                    <td>{best}</td>
                    <td>{tier}</td>
                    <td>{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="warn">
            At 32 px, always zoom to 4× in the studio preview before downloading.
            Native 32 × 32 looks tiny on modern screens — zooming in shows you what it
            actually looks like in-game at 2× or 4× scale (which is standard for pixel games).
          </Callout>

          <H3>File size trade-offs</H3>
          <P>
            PNG file sizes are relevant if you&apos;re shipping many assets in a mobile game or
            web-based title where download size matters:
          </P>
          <UL>
            <LI><strong>32 px PNG</strong> — typically 1–5 KB with alpha</LI>
            <LI><strong>64 px PNG</strong> — typically 5–20 KB with alpha</LI>
            <LI><strong>128 px PNG</strong> — typically 15–60 KB with alpha</LI>
            <LI><strong>256 px PNG</strong> — typically 50–150 KB with alpha</LI>
            <LI><strong>512 px PNG</strong> — typically 100–300 KB with alpha</LI>
            <LI><strong>GIF (64 px, 6 frames)</strong> — typically 20–80 KB</LI>
            <LI><strong>GIF (128 px, 8 frames)</strong> — typically 80–250 KB</LI>
          </UL>
          <P>
            Most game engines support PNG compression and texture atlases — you can pack
            many 64 px sprites into a single atlas texture for optimal performance.
          </P>

          {/* ============================================================== */}
          {/* 7. EXPORT GUIDE                                                  */}
          {/* ============================================================== */}
          <H2 id="export">7. Export Guide</H2>

          <H3>Output format</H3>
          <P>
            All static assets export as <strong>PNG with alpha channel</strong> (transparent
            background). GIF animations are exported as standard looping animated GIFs with
            indexed colour (up to 256 colours per frame). No watermarks are ever added.
          </P>

          <H3>Zooming for inspection</H3>
          <P>
            Before downloading, use the zoom controls beneath each generated image to inspect
            the result:
          </P>
          <UL>
            <LI><Code>1×</Code> — native pixel resolution (may look tiny)</LI>
            <LI><Code>2×</Code> — doubled pixels, good for 64 px assets</LI>
            <LI><Code>4×</Code> — quadrupled, best for inspecting 32 px assets and checking pixel-level detail</LI>
          </UL>
          <Callout type="tip">
            Always inspect at <Code>4×</Code> zoom before regenerating. Many assets that look
            blurry at 1× look great at 4× — which is how they will appear in your game if
            you apply pixel-perfect scaling.
          </Callout>

          <H3>Pixel grid overlay</H3>
          <P>
            Enable the pixel grid overlay (grid icon in the preview toolbar) to see exact
            pixel boundaries. This is particularly useful when checking that a tile is
            clean at its edges, or verifying a character sprite doesn&apos;t bleed outside
            its bounding box.
          </P>

          <H3>Filename convention</H3>
          <P>
            Downloaded files follow this naming pattern:
          </P>
          <Pre>{`wokgen-{preset}-{prompt-slug}-{seed}.png

// Examples:
wokgen-rpg_icon-fire-sword-ember-glow-48291.png
wokgen-character_idle-forest-elf-archer-73910.png
wokgen-tileset-stone-dungeon-floor-10482.png
wokgen-animate-warrior-idle-walk-cycle-58321.gif`}</Pre>
          <P>
            The <strong>seed</strong> at the end of each filename is the random seed used
            for that generation.
          </P>

          <H3>Seed reproducibility</H3>
          <P>
            Every generation has a seed — a number that determines the &quot;random&quot;
            starting point of the AI generation. If you want to reproduce a result exactly:
          </P>
          <OL>
            <LI>Note the seed from the filename or from the result card metadata</LI>
            <LI>Enter that seed in the <strong>Seed</strong> field (Advanced panel)</LI>
            <LI>Use the same prompt, preset, and size</LI>
            <LI>Generate — you will get the same image every time</LI>
          </OL>
          <Callout type="info">
            Seed reproducibility only works within the same quality tier (Standard or HD).
            Switching between Standard and HD with the same seed will produce different results
            because the underlying models differ.
          </Callout>

          <H3>Save to Gallery vs Download</H3>
          <UL>
            <LI><strong>Save to Gallery</strong> — stores the asset in your WokGen workspace history. Accessible from the Gallery panel at any time. Does not download to your device.</LI>
            <LI><strong>Download</strong> — downloads the PNG/GIF directly to your device. Does not save to Gallery unless you also click Save.</LI>
            <LI>You can do both — save to Gallery for reference and download for immediate use.</LI>
            <LI>Gallery items are retained while your account is active. Deleting a workspace soft-deletes its gallery items (recoverable for 30 days).</LI>
          </UL>

          {/* ============================================================== */}
          {/* 8. WORKSPACE & PROJECTS                                          */}
          {/* ============================================================== */}
          <H2 id="workspace">8. Workspace &amp; Projects</H2>

          <P>
            <strong>Workspaces</strong> let you organise your generations by project —
            for example, one workspace per game title, game jam, or client project.
            All generations, gallery saves, and history are scoped to the active workspace.
          </P>

          <H3>Creating a workspace</H3>
          <OL>
            <LI>Click the workspace selector in the top navigation bar (shows your current workspace name)</LI>
            <LI>Click <strong>+ New Workspace</strong></LI>
            <LI>Enter a name (e.g. &quot;Dungeon Crawler 2025&quot;, &quot;Game Jam April&quot;)</LI>
            <LI>Click <strong>Create</strong></LI>
            <LI>The new workspace becomes active immediately</LI>
          </OL>

          <H3>Workspace limits by plan</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Max workspaces</th>
                  <th>Gallery items per workspace</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Free',  '3',  'Unlimited'],
                  ['Plus',  '10', 'Unlimited'],
                  ['Pro',   '25', 'Unlimited'],
                  ['Max',   '50', 'Unlimited'],
                ].map(([plan, ws, gallery]) => (
                  <tr key={plan}>
                    <td><strong>{plan}</strong></td>
                    <td>{ws}</td>
                    <td>{gallery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>History and filtering</H3>
          <P>
            The <strong>History</strong> panel shows all generations for the currently active
            workspace. Switch workspaces to see a different project&apos;s history.
            Within a workspace you can filter history by tool, preset, size, and date range.
          </P>

          <H3>Soft-delete and recovery</H3>
          <P>
            Deleting a workspace does <em>not</em> permanently erase your history immediately.
            Deleted workspaces and their gallery items enter a <strong>30-day grace period</strong>
            during which they can be recovered from the <strong>Trash</strong> section of your
            account settings. After 30 days, deletion is permanent.
          </P>
          <Callout type="warn">
            Renaming a workspace does not affect your generation history or gallery. All
            history is preserved under the workspace&apos;s internal ID, not its display name.
          </Callout>

          {/* ============================================================== */}
          {/* 9. CREDITS & LIMITS                                              */}
          {/* ============================================================== */}
          <H2 id="credits">9. Credits &amp; Limits</H2>

          <H3>Standard (always free)</H3>
          <P>
            Standard quality is <strong>always free and unlimited</strong>. It uses the
            Pollinations engine for fast generation (typically 3–8 seconds per image).
            Standard is excellent for rapid iteration, prototyping, and game-jam-speed
            development. There is no daily or monthly cap on Standard generations.
          </P>

          <H3>HD (credit-based)</H3>
          <P>
            HD quality uses a premium model for higher detail, sharper outlines, and more
            faithful palette adherence. HD costs <strong>credits</strong> per generation.
            Credits are allocated monthly based on your plan and can also be purchased as
            top-up packs.
          </P>

          <P><strong>What costs HD credits:</strong></P>
          <UL>
            <LI>Any generation with &quot;HD&quot; quality selected</LI>
            <LI>Animate tool with HD quality (costs per frame generated)</LI>
            <LI>Edit (inpaint) with HD quality</LI>
            <LI>Directions with HD quality (costs per direction view)</LI>
            <LI>Tileset with HD quality</LI>
          </UL>

          <P><strong>What does NOT cost credits:</strong></P>
          <UL>
            <LI>Any Standard quality generation across all tools</LI>
            <LI>Viewing, zooming, and downloading previously generated results</LI>
            <LI>Saving to Gallery or renaming gallery items</LI>
            <LI>Creating or managing workspaces</LI>
          </UL>

          <H3>Monthly credits and top-ups</H3>
          <P>
            Monthly credits are allocated on your billing cycle date and expire at the end of
            each billing period. <strong>Top-up credit packs never expire</strong> — they are
            consumed only after your monthly allocation runs out. This means you can stock up
            on top-up credits for intensive periods (like game jams) without losing them.
          </P>

          <H3>Rate limits</H3>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Account type</th>
                  <th>Requests per minute</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Authenticated (any plan)', '30 req/min', 'Per user, across all tools'],
                  ['Guest (not logged in)',     '10 req/min', 'Standard only, no Gallery access'],
                ].map(([type, limit, notes]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td><Code>{limit}</Code></td>
                    <td>{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout type="info">
            Rate limits are applied per user account, not per workspace. If you hit the rate
            limit, wait 60 seconds and retry. The studio will display a &quot;rate limit
            reached&quot; message if this occurs.
          </Callout>

          {/* ============================================================== */}
          {/* 10. FAQ                                                          */}
          {/* ============================================================== */}
          <H2 id="faq">10. FAQ</H2>

          {[
            {
              q: 'Can I use generated assets commercially?',
              a: 'Yes. Assets generated on WokGen Pixel can be used in commercial projects — including games sold on Steam, itch.io, App Store, Google Play, and elsewhere. Free tier covers personal and indie commercial use. See Terms of Service for the full license terms.',
            },
            {
              q: 'Why does my sprite look different every time I generate with the same prompt?',
              a: 'Each generation uses a random seed by default, so results vary. This is intentional — it gives you variety to choose from. If you want the exact same image again, use the seed from the filename (the number at the end) and enter it into the Seed field in the Advanced panel, then regenerate with identical settings.',
            },
            {
              q: 'How do I get the same image again? (Seed reproducibility)',
              a: 'Every downloaded file contains the seed in its filename: wokgen-{preset}-{slug}-{seed}.png. Enter that seed number into the Seed field in the studio\'s Advanced panel. Use the same prompt, preset, size, and quality tier. Generate — you will get the identical image.',
            },
            {
              q: 'What is the difference between HD and Standard quality?',
              a: 'Standard uses Pollinations — fast (3–8 seconds), free, and very good for iteration. HD uses a premium model — slower (10–25 seconds), credit-based, and produces sharper outlines, more accurate palettes, and finer pixel detail. The difference is most visible at 128 px and above.',
            },
            {
              q: 'Can I upload a sprite to modify it?',
              a: 'Yes — use the Edit tool (Inpaint). Upload your existing sprite, paint a mask over the region you want to change, describe the change, and generate. Keep the mask tight to the region for best results. The Edit tool works on any PNG, including sprites generated outside of WokGen.',
            },
            {
              q: 'Why does my tileset have a visible seam when I tile it?',
              a: 'This can happen if the seamless constraint was not applied consistently — try regenerating once or twice with the same prompt, as it is stochastic. Also ensure you are using the Tileset tool (not the Sprite tool) with a tileset preset. If seams persist, try adding "seamless tile, no borders" to your prompt.',
            },
            {
              q: 'Which game engines are these assets compatible with?',
              a: 'All outputs are standard PNG (with alpha) and GIF files — compatible with every major game engine including Unity, Godot, Unreal, RPGMaker MZ/MV/XP, GDevelop, Phaser, Love2D, GameMaker Studio, Defold, Cocos2d, and any other engine that imports PNG. No conversion is needed.',
            },
            {
              q: 'My 32px sprite looks blurry — is something wrong?',
              a: 'It\'s almost certainly fine — zoom to 4× in the studio preview to see it at the scale your game will render it. Modern screens have very high pixel density, so a 32 × 32 px image displayed at 1× appears tiny and soft. In a pixel-art game using 2× or 4× integer scaling, it will look crisp and sharp.',
            },
            {
              q: 'Can I generate a full tileset as a batch?',
              a: 'Yes. Use the Tileset tool with map size set to 4×4 for a larger seamless section, or use the Sprite tool in batch mode (set batch count to 2–4) and describe individual tiles with the same palette descriptor for visual consistency. For large tile libraries, use a workspace to organise generations by tile category.',
            },
            {
              q: 'Can I cancel a generation that is taking too long?',
              a: 'Yes — click the Cancel button that appears while a generation is in progress. Standard generations are fast enough that cancellation is rarely needed. HD and multi-frame animations (Animate, Directions) can take 15–30 seconds and the cancel button will interrupt and discard the in-progress job.',
            },
            {
              q: 'What happens to my credits if I cancel an HD generation?',
              a: 'Credits are only deducted on successful completion. If you cancel a generation mid-run or if it fails due to an error, no credits are charged. If a generation completes and you receive an image but choose not to save or download it, the credit is still consumed.',
            },
            {
              q: 'Are there any content restrictions?',
              a: 'Yes. WokGen Pixel enforces a content policy — prompts that generate NSFW content, graphic violence, hate imagery, or real person likenesses are blocked. The engine will return an error message and no generation will occur. Credits are not charged on blocked requests.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="docs-faq-item">
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}

          <div className="docs-content-footer">
            <Link href="/docs" className="btn-ghost btn-sm">← Docs Hub</Link>
            <Link href="/docs/platform" className="btn-ghost btn-sm">Platform Docs →</Link>
          </div>

        </main>
      </div>
    </div>
  );
}
