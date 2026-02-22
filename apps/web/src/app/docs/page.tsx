'use client';

import { useState } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Nav sections
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: 'overview',       label: 'Overview',              icon: '✦' },
  { id: 'studio',         label: 'Studio Guide',          icon: '🎨' },
  { id: 'tools',          label: 'Tools',                 icon: '⚙' },
  { id: 'generation',     label: 'Generation Settings',   icon: '⊞' },
  { id: 'api',            label: 'API Reference',         icon: '{}' },
  { id: 'credits',        label: 'Plans & Credits',       icon: '💳' },
  { id: 'faq',            label: 'FAQ',                   icon: '?' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.015em',
        fontFamily: 'var(--font-heading)', color: 'var(--text)',
        marginBottom: '0.75rem', marginTop: '2.5rem', paddingTop: '2.5rem',
        borderTop: '1px solid var(--border)',
        scrollMarginTop: 80,
      }}
    >{children}</h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '0.75rem' }}>{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      fontFamily: 'monospace', fontSize: '0.78rem', color: '#c4b5fd',
      background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.15)',
      borderRadius: 3, padding: '1px 5px',
    }}>{children}</code>
  );
}

function Pre({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <pre style={{
        background: '#0a0a0a', border: '1px solid var(--border)',
        borderRadius: 4, padding: '1rem 1.25rem',
        fontSize: '0.78rem', color: '#a78bfa', fontFamily: 'monospace',
        lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre',
      }}>
        {children}
      </pre>
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.2)',
          borderRadius: 3, color: '#a78bfa', fontSize: '0.65rem',
          padding: '2px 7px', cursor: 'pointer', transition: 'opacity 0.15s',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'tip' | 'warn' }) {
  const styles = {
    info: { bg: 'rgba(167,139,250,.07)', border: 'rgba(167,139,250,.2)', color: '#c4b5fd', icon: 'ℹ' },
    tip:  { bg: 'rgba(52,211,153,.07)',  border: 'rgba(52,211,153,.2)',  color: '#34d399', icon: '✓' },
    warn: { bg: 'rgba(245,158,11,.07)',  border: 'rgba(245,158,11,.2)',  color: '#fcd34d', icon: '⚠' },
  }[variant];
  return (
    <div style={{
      display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
      background: styles.bg, border: `1px solid ${styles.border}`,
      borderRadius: 4, padding: '0.75rem 1rem', marginBottom: '1rem',
    }}>
      <span style={{ color: styles.color, flexShrink: 0, lineHeight: 1.75, fontSize: '0.85rem' }}>{styles.icon}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{children}</span>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '0.55rem 0.75rem', color: j === 0 ? 'var(--text)' : 'var(--text-muted)', fontFamily: j === 0 ? 'monospace' : undefined, fontSize: j === 0 ? '0.78rem' : '0.8rem' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', maxWidth: '72rem', margin: '0 auto' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        padding: '2rem 0 2rem 1.5rem',
        position: 'sticky', top: 56, height: 'calc(100dvh - 56px)',
        overflowY: 'auto',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: '0.15rem',
      }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
          Documentation
        </p>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.5rem',
              borderRadius: 4, border: 'none', cursor: 'pointer',
              textAlign: 'left', width: '100%',
              background: activeSection === s.id ? 'rgba(167,139,250,.1)' : 'transparent',
              color: activeSection === s.id ? '#a78bfa' : 'var(--text-muted)',
              fontSize: '0.82rem',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{s.icon}</span>
            {s.label}
          </button>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', paddingLeft: '0.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', lineHeight: 1.6 }}>
            Self-hosting?{' '}
            <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none' }}>
              See the open-source repo →
            </a>
          </p>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '2.5rem 2.5rem 4rem', minWidth: 0 }}>

        {/* ── Overview ─────────────────────────────────────────────────── */}
        <div id="overview" style={{ scrollMarginTop: 80 }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem' }}>
              WokGen Documentation
            </p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', fontFamily: 'var(--font-heading)', marginBottom: '0.6rem' }}>
              Overview
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '42rem' }}>
              WokGen is an AI pixel art generation studio for game developers. Generate sprites, tilesets, animations,
              and UI elements directly from text prompts. No setup required — just sign in and create.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: '5 tools', body: 'Generate, Animate, Rotate, Inpaint, Scene' },
              { label: 'Free forever', body: 'Standard generation — always free, unlimited' },
              { label: 'HD quality', body: 'Replicate FLUX.1-schnell on paid plans' },
              { label: 'GitHub auth', body: 'Sign in with GitHub — no password required' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '1rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text)', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>{c.label}</p>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{c.body}</p>
              </div>
            ))}
          </div>

          <InfoBox variant="tip">
            WokGen is hosted at{' '}
            <a href="https://wokgen.wokspec.org" style={{ color: '#34d399' }}>wokgen.wokspec.org</a>.
            An open-source, self-hostable version is available at{' '}
            <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" style={{ color: '#34d399' }}>github.com/WokSpec/WokGen</a>.
          </InfoBox>
        </div>

        {/* ── Studio Guide ─────────────────────────────────────────────── */}
        <H2 id="studio">Studio Guide</H2>

        <P>The WokGen Studio is a single-page workspace with a left prompt panel and a right output panel.</P>

        <H3>Getting started</H3>
        <P>
          1. Sign in with GitHub at the top-right corner.<br />
          2. You&#39;ll be taken to the Studio automatically after sign-in.<br />
          3. Enter a prompt describing what you want to generate.<br />
          4. Click <Code>Generate</Code> or press <Code>⌘ + ↵</Code> (Ctrl+Enter on Windows).
        </P>

        <H3>Left panel</H3>
        <P>The left panel contains all inputs:</P>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {[
            ['Tool tabs', 'Switch between Generate, Animate, Rotate, Inpaint, and Scene'],
            ['Prompt textarea', 'Your description of the asset. Be specific for best results.'],
            ['Negative prompt', 'What to avoid in the output. Filled automatically based on category.'],
            ['Size picker', 'Output resolution: 32×32 to 512×512 (HD up to 1024×1024).'],
            ['Style preset', '18 curated pixel art presets including RPG, chibi, sci-fi, isometric.'],
            ['Asset category', '15 asset categories that tune the prompt intelligently.'],
            ['Era', 'NES, Game Boy, SNES, GBA, or Modern — controls pixel era vocabulary.'],
            ['Background', 'Transparent, dark, or scene — toggles checkerboard preview.'],
            ['Outline / Palette', 'Outline style and color palette size controls.'],
          ].map(([k, v]) => (
            <li key={k as string} style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{k as string}</span> — {v as string}
            </li>
          ))}
        </ul>

        <H3>Right panel (Output)</H3>
        <P>
          The output panel shows your generated image centered on a transparent checkerboard background.
          Use the zoom controls (+/−) to inspect pixel-level detail. The toolbar has:
        </P>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
          {[
            ['↻ Reroll', 'Generate again with a new random seed'],
            ['⎘ Copy', 'Copy the image to clipboard as PNG'],
            ['↓ Download', 'Download as PNG or GIF — filename includes tool, size, and prompt'],
            ['⊕ Save to Gallery', 'Publish the image to the public community gallery'],
          ].map(([k, v]) => (
            <li key={k as string} style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <Code>{k as string}</Code> — {v as string}
            </li>
          ))}
        </ul>

        <InfoBox variant="info">
          Click any prompt chip in the idle state to instantly load an example prompt and jump-start your session.
        </InfoBox>

        {/* ── Tools ────────────────────────────────────────────────────── */}
        <H2 id="tools">Tools</H2>

        <H3>✦ Generate</H3>
        <P>
          The primary tool. Text-to-pixel-art for any asset type: characters, weapons, tiles, effects, UI elements.
          Supports all style presets, categories, era tokens, and background modes.
        </P>
        <InfoBox variant="tip">Use the <strong>batch mode (×2 / ×4)</strong> to generate multiple variations simultaneously and pick your favorite.</InfoBox>

        <H3>▶ Animate</H3>
        <P>
          Generates multi-frame GIF animations. Choose an animation type (Idle, Walk, Run, Attack, Cast, Death,
          or particle effects) and set frame count, FPS, and loop mode. Each frame is generated with per-frame
          motion context tokens to maintain consistency.
        </P>
        <InfoBox variant="warn">Animation generation costs multiple standard credits (one per frame). Aim for 4–6 frames for best quality/speed balance.</InfoBox>

        <H3>↻ Rotate</H3>
        <P>
          Generates a 4-direction turntable view (front, back, left, right) of a character or object.
          Each direction gets specialized view tokens while maintaining consistent style/palette.
        </P>

        <H3>⬛ Inpaint</H3>
        <P>
          Upload an existing sprite PNG, paint a mask over the region to modify, and describe what should
          replace it. Uses ControlNet-style inpainting. Ideal for iterating on a near-complete asset.
        </P>

        <H3>⊞ Scene</H3>
        <P>
          Generates tilesets, dungeon maps, and environmental assets. Themes include Dungeon, Forest, Castle,
          Desert, Cave, Ocean, Cyberpunk, and more. Can generate 4×4 coherent tile grids in one pass.
        </P>

        {/* ── Generation Settings ──────────────────────────────────────── */}
        <H2 id="generation">Generation Settings</H2>

        <H3>Prompting tips</H3>
        <P>
          WokGen uses a layered prompt system — your text is combined with smart tokens from the category,
          era, style, and background settings. You don&#39;t need to manually specify &#34;pixel art&#34; or &#34;32-bit&#34;
          — the system handles that. Focus your prompt on the <em>content</em>:
        </P>
        <Pre>{`✓ iron sword with ornate crossguard, battle-worn blade
✓ warrior in plate armor, front-facing, detailed face
✓ dungeon stone floor, cracked and mossy, seamless tile
✗ pixel art sword (redundant — era tokens handle this)
✗ make a good sprite (too vague — describe the content)`}</Pre>

        <H3>Style presets</H3>
        <Table
          headers={['Preset', 'Best for']}
          rows={[
            ['rpg_icon', 'Inventory icons, RPG items (weapons, potions, armor)'],
            ['character_idle', 'Front-facing standing character sprites'],
            ['character_side', 'Side-scroll platformer characters'],
            ['top_down_char', 'Top-down RPG characters (Zelda-style)'],
            ['isometric', '3/4 isometric objects and characters'],
            ['chibi', 'Super-deformed cute characters, 2:1 head ratio'],
            ['tileset', 'Seamless tiled backgrounds and environments'],
            ['sprite_sheet', 'Multi-sprite sheet layout'],
            ['game_ui', 'UI elements: buttons, frames, health bars'],
            ['animated_effect', 'High-contrast particles and spell effects'],
            ['portrait', 'Character busts and face closeups'],
            ['sci_fi', 'Technological, metallic, neon-accented assets'],
            ['horror', 'Dark, desaturated, high-contrast scary assets'],
            ['nature_tile', 'Organic environment tiles (grass, trees, water)'],
            ['badge_icon', 'App-style flat icons, centered on clean background'],
            ['weapon_icon', 'Dedicated weapon sprites with clean silhouette'],
            ['emoji', 'Expressive, bold, single-concept icons'],
            ['raw', 'No style preset — pure user prompt'],
          ]}
        />

        <H3>Pixel era</H3>
        <Table
          headers={['Era', 'Vocabulary']}
          rows={[
            ['NES 8-bit', '54-color palette, very blocky, hard edges, 8×8 tile unit'],
            ['Game Boy', '4-shade green mono, 160×144 scale aesthetic'],
            ['SNES 16-bit', '256 colors, detailed sprites, smooth gradients'],
            ['GBA 32-bit', 'Rich palette, smoother while remaining pixel art'],
            ['Modern Pixel', 'HD pixel art, no era restriction, maximum detail'],
          ]}
        />

        <H3>Background mode</H3>
        <Table
          headers={['Mode', 'Use case']}
          rows={[
            ['Transparent', 'Game engine sprites — adds alpha channel tokens, checkered preview'],
            ['Dark', 'Moody atmospheric assets on dark backgrounds'],
            ['Scene', 'Contextual environment — asset shown in its environment'],
          ]}
        />

        {/* ── API Reference ────────────────────────────────────────────── */}
        <H2 id="api">API Reference</H2>

        <InfoBox variant="warn">
          The REST API is currently for internal use. External API key authentication is on the roadmap.
          For now, API calls require a valid session cookie (i.e., be signed in).
        </InfoBox>

        <H3>POST /api/generate</H3>
        <P>Generate a single pixel art image.</P>

        <Pre>{`POST /api/generate
Content-Type: application/json

{
  "prompt": "iron sword with ornate crossguard",
  "negPrompt": "",
  "size": 64,
  "stylePreset": "rpg_icon",
  "assetCategory": "weapon",
  "pixelEra": "modern",
  "backgroundMode": "transparent",
  "outlineStyle": "bold",
  "paletteSize": 32,
  "steps": 4,
  "guidance": 3.5,
  "seed": null,
  "provider": "pollinations",
  "useHD": false
}`}</Pre>

        <H3>Response</H3>
        <Pre>{`{
  "ok": true,
  "jobId": "cm...",
  "resultUrl": "data:image/png;base64,...",
  "provider": "pollinations",
  "resolvedSeed": 1234567,
  "durationMs": 1823,
  "width": 64,
  "height": 64
}`}</Pre>

        <H3>POST /api/animate</H3>
        <P>Generate a multi-frame GIF animation.</P>
        <Pre>{`POST /api/animate
Content-Type: application/json

{
  "prompt": "warrior knight, idle breathing",
  "animationType": "idle",
  "frameCount": 6,
  "fps": 8,
  "loop": "loop",
  "size": 64,
  "stylePreset": "character_idle",
  "pixelEra": "modern"
}`}</Pre>

        <H3>GET /api/gallery</H3>
        <P>Fetch public gallery assets.</P>
        <Pre>{`GET /api/gallery?tool=generate&sort=newest&limit=20&cursor=<cursor>

Response:
{
  "assets": [...],
  "nextCursor": "...",
  "hasMore": true,
  "total": 147
}`}</Pre>

        {/* ── Plans & Credits ──────────────────────────────────────────── */}
        <H2 id="credits">Plans & Credits</H2>

        <H3>Standard generation (always free)</H3>
        <P>
          Standard generation uses the Pollinations FLUX model. It is completely free and unlimited —
          no account needed, no credits required. Quality is solid for rapid prototyping and casual use.
        </P>

        <H3>HD generation (requires credits)</H3>
        <P>
          HD generation uses Replicate&#39;s FLUX.1-schnell model, producing significantly higher quality
          output. HD generation costs 1 HD credit per image.
        </P>

        <H3>Subscription plans</H3>
        <Table
          headers={['Plan', 'Price', 'Monthly HD credits', 'Notes']}
          rows={[
            ['Free', '$0', '0 (unlimited standard)', 'No card required'],
            ['Plus', '$2/mo', '100', '~$0.02/credit'],
            ['Pro', '$6/mo', '500', '~$0.012/credit, priority queue'],
            ['Max', '$20/mo', '2,000', '~$0.01/credit, bulk export'],
          ]}
        />

        <H3>Credit top-up packs</H3>
        <P>
          One-time credit purchases that never expire. Credits from top-up packs are used after your
          monthly allocation runs out.
        </P>
        <Table
          headers={['Pack', 'Price', 'Credits']}
          rows={[
            ['Micro', '$1', '30 credits'],
            ['Small', '$3', '100 credits'],
            ['Medium', '$8', '400 credits'],
            ['Large', '$20', '1,200 credits (best value)'],
          ]}
        />

        <P>
          Manage your subscription, view invoices, or cancel anytime at{' '}
          <Link href="/billing" style={{ color: '#a78bfa', textDecoration: 'none' }}>wokgen.wokspec.org/billing</Link>.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <H2 id="faq">FAQ</H2>

        {[
          {
            q: 'Do I need an account to use WokGen?',
            a: 'No — you can generate images without signing in using standard quality. An account is required to save to gallery, view history, and access HD generation.',
          },
          {
            q: 'What is the difference between standard and HD?',
            a: 'Standard uses Pollinations FLUX (free, fast, no limit). HD uses Replicate FLUX.1-schnell (costs 1 credit, higher quality, better prompt adherence).',
          },
          {
            q: 'Do unused monthly credits roll over?',
            a: 'On Plus: unused credits from the monthly allocation roll to your top-up bank. On Pro and Max: unused credits do not roll over, but you can always buy top-up packs.',
          },
          {
            q: 'Can I use generated assets in commercial games?',
            a: 'Yes. You own the output. WokGen places no restrictions on how you use generated assets. Check your game engine and distribution store for any policy on AI-generated art.',
          },
          {
            q: 'Is there a self-hosted version?',
            a: 'Yes — an open-source community edition is available at github.com/WokSpec/WokGen. It supports running your own instance with your own provider API keys.',
          },
          {
            q: 'Why does my transparent background show colors?',
            a: 'Most AI models generate on a white or black background — true transparency requires post-processing. Enable "Transparent" background mode for checkerboard preview and optimized tokens, then remove the background in your image editor or sprite tool.',
          },
          {
            q: 'How do I cancel my subscription?',
            a: 'Go to /billing and click "Manage billing →". You will be taken to the Stripe customer portal where you can cancel, pause, or switch plans.',
          },
          {
            q: 'Is the API publicly available?',
            a: 'An API key-based system for external integrations is on the roadmap. Currently, API access requires an active session (signed in).',
          },
        ].map(({ q, a }) => (
          <div key={q} style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>{q}</p>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{a}</p>
          </div>
        ))}

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            WokGen is built by{' '}
            <a href="https://wokspec.org" style={{ color: '#a78bfa', textDecoration: 'none' }}>WokSpec</a>.
            {' '}View the{' '}
            <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none' }}>open-source repo</a>.
            {' '}<Link href="/terms" style={{ color: 'var(--text-faint)', textDecoration: 'underline' }}>Terms</Link>
            {' · '}<Link href="/privacy" style={{ color: 'var(--text-faint)', textDecoration: 'underline' }}>Privacy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
