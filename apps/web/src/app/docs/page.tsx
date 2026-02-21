'use client';

import { useState } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocSection {
  id: string;
  label: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Sidebar sections
// ---------------------------------------------------------------------------

const SECTIONS: DocSection[] = [
  { id: 'quick-start',   label: 'Quick Start',       icon: '⚡' },
  { id: 'studio',        label: 'Studio Guide',       icon: '✦' },
  { id: 'api',           label: 'REST API',           icon: '⊞' },
  { id: 'providers',     label: 'Provider Setup',     icon: '☁' },
  { id: 'pipeline',      label: 'Asset Pipeline CLI', icon: '⚙' },
  { id: 'self-hosting',  label: 'Self-Hosting',       icon: '🖥' },
  { id: 'docker',        label: 'Docker',             icon: '🐳' },
  { id: 'license',       label: 'License',            icon: '⚖' },
];

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------

function Anchor({ id }: { id: string }) {
  return (
    <span
      id={id}
      style={{ position: 'absolute', top: -72 }}
      aria-hidden="true"
    />
  );
}

function SectionTitle({
  id,
  icon,
  children,
}: {
  id: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Anchor id={id} />
      <h2
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '1.35rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--surface-border)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-muted)',
            color: 'var(--accent)',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        {children}
      </h2>
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
        marginTop: '1.5rem',
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: 'var(--text-secondary)',
        lineHeight: 1.75,
        marginBottom: '0.85rem',
        fontSize: '0.875rem',
      }}
    >
      {children}
    </p>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        background: 'var(--surface-overlay)',
        border: '1px solid var(--surface-border)',
        borderRadius: 3,
        padding: '0.1em 0.38em',
        fontSize: '0.82em',
        color: 'var(--accent-hover)',
        fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
      }}
    >
      {children}
    </code>
  );
}

function CodeBlock({
  lang,
  label,
  children,
}: {
  lang?: string;
  label?: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children.trim()).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid var(--surface-border)',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 14px',
          background: 'var(--surface-overlay)',
          borderBottom: '1px solid var(--surface-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#B13E53', display: 'block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFCD75', display: 'block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38B764', display: 'block' }} />
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}
          >
            {label ?? lang ?? 'code'}
          </span>
        </div>
        <button
          onClick={copy}
          style={{
            fontSize: '0.7rem',
            color: copied ? 'var(--success)' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
            padding: 0,
          }}
        >
          {copied ? '✓ Copied' : '⊕ Copy'}
        </button>
      </div>
      {/* Body */}
      <pre
        style={{
          margin: 0,
          padding: '14px 16px',
          background: 'var(--surface-muted)',
          overflowX: 'auto',
          fontSize: '0.8rem',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
          fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
          border: 'none',
          borderRadius: 0,
        }}
      >
        {children}
      </pre>
    </div>
  );
}

function Callout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warning' | 'tip' | 'danger';
  children: React.ReactNode;
}) {
  const styles = {
    info:    { bg: 'var(--accent-dim)',   border: 'var(--accent-muted)',  color: 'var(--accent)',       icon: 'ℹ' },
    warning: { bg: 'var(--warning-muted)', border: 'var(--warning)',      color: 'var(--warning)',      icon: '⚠' },
    tip:     { bg: 'var(--success-muted)', border: 'var(--success)',      color: 'var(--success)',      icon: '✓' },
    danger:  { bg: 'var(--danger-muted)',  border: 'var(--danger)',       color: 'var(--danger-hover)', icon: '✕' },
  }[type];

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 8,
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        marginBottom: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <span style={{ color: styles.color, flexShrink: 0, fontSize: 13, paddingTop: 1 }}>
        {styles.icon}
      </span>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        {children}
      </div>
    </div>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div
      style={{
        overflowX: 'auto',
        borderRadius: 8,
        border: '1px solid var(--surface-border)',
        marginBottom: '1.25rem',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: 'var(--surface-overlay)' }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: '9px 14px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--surface-border)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.03em',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background: ri % 2 === 0 ? 'transparent' : 'var(--surface-muted)',
                borderBottom: ri < rows.length - 1 ? '1px solid var(--surface-border)' : 'none',
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '9px 14px',
                    color: 'var(--text-secondary)',
                    verticalAlign: 'top',
                  }}
                >
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

function HR() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--surface-border)',
        margin: '2.5rem 0',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quick-start');

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(id);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100dvh - 56px)',
        background: 'var(--surface-base)',
      }}
    >

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          position: 'sticky',
          top: 56,
          height: 'calc(100dvh - 56px)',
          overflowY: 'auto',
          background: 'var(--surface-raised)',
          borderRight: '1px solid var(--surface-border)',
          padding: '20px 0',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--surface-border) transparent',
        }}
      >
        <div style={{ padding: '0 12px 12px', borderBottom: '1px solid var(--surface-border)', marginBottom: 8 }}>
          <p
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-disabled)',
              padding: '0 8px',
            }}
          >
            Documentation
          </p>
        </div>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '7px 20px',
              background: activeSection === section.id ? 'var(--accent-dim)' : 'transparent',
              border: 'none',
              borderLeft: `2px solid ${activeSection === section.id ? 'var(--accent)' : 'transparent'}`,
              color: activeSection === section.id ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: activeSection === section.id ? 600 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.14s ease',
            }}
            onMouseEnter={(e) => {
              if (activeSection !== section.id) {
                (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== section.id) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              }
            }}
          >
            <span style={{ fontSize: 12, flexShrink: 0 }}>{section.icon}</span>
            {section.label}
          </button>
        ))}

        {/* Links */}
        <div style={{ borderTop: '1px solid var(--surface-border)', marginTop: 16, padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a
            href="https://github.com/WokSpecialists/WokGen"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>↗</span> GitHub
          </a>
          <Link
            href="/studio"
            style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>✦</span> Open Studio
          </Link>
        </div>
      </aside>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: '40px 48px',
          maxWidth: 820,
        }}
      >

        {/* ── Quick Start ───────────────────────────────────────────────── */}
        <SectionTitle id="quick-start" icon="⚡">Quick Start</SectionTitle>

        <P>
          WokGen is a self-hosted AI pixel art studio. It runs a Next.js web app backed
          by a SQLite database and can use any combination of cloud AI providers — or your
          own local ComfyUI instance.
        </P>

        <Callout type="tip">
          You need <strong>Node.js 20+</strong> and at least one AI provider key.
          Together.ai offers a completely free <InlineCode>FLUX.1-schnell-Free</InlineCode> model
          that requires no billing setup.
        </Callout>

        <SubTitle>1. Clone & install</SubTitle>
        <CodeBlock lang="bash">
{`git clone https://github.com/WokSpecialists/WokGen.git
cd WokGen
npm install`}
        </CodeBlock>

        <SubTitle>2. Configure environment</SubTitle>
        <CodeBlock lang="bash">
{`cp .env.example .env.local
# Open .env.local and add at least one provider key:
#
#   TOGETHER_API_KEY=your_together_key   # free tier — recommended for new users
#   REPLICATE_API_TOKEN=r8_...
#   FAL_KEY=...
#   COMFYUI_HOST=http://127.0.0.1:8188   # if running ComfyUI locally`}
        </CodeBlock>

        <SubTitle>3. Set up the database</SubTitle>
        <CodeBlock lang="bash">
{`cd apps/web
npx prisma db push
cd ../..`}
        </CodeBlock>

        <SubTitle>4. Start the dev server</SubTitle>
        <CodeBlock lang="bash">
{`npm run dev
# → http://localhost:3000`}
        </CodeBlock>

        <P>
          Open <InlineCode>http://localhost:3000</InlineCode> in your browser.
          Navigate to <strong>Studio</strong> to start generating pixel art.
        </P>

        <HR />

        {/* ── Studio Guide ──────────────────────────────────────────────── */}
        <SectionTitle id="studio" icon="✦">Studio Guide</SectionTitle>

        <P>
          The Studio at <InlineCode>/studio</InlineCode> is the main generation interface.
          It is a single-page application with a three-column layout: tool rail, control panel,
          and output canvas.
        </P>

        <SubTitle>Tools</SubTitle>
        <Table
          headers={['Tool', 'Shortcut', 'Description']}
          rows={[
            [<InlineCode>Generate</InlineCode>, '1', 'Text → pixel art sprite or icon at any supported size.'],
            [<InlineCode>Animate</InlineCode>,  '2', 'Turn a static sprite into a looping GIF animation with text control.'],
            [<InlineCode>Rotate</InlineCode>,   '3', 'Generate 4 or 8 directional views of any sprite.'],
            [<InlineCode>Inpaint</InlineCode>,  '4', 'Edit specific regions using a paint mask.'],
            [<InlineCode>Scenes & Maps</InlineCode>, '5', 'Generate tilesets, environments, and game maps.'],
          ]}
        />

        <SubTitle>Style Presets</SubTitle>
        <Table
          headers={['Preset', 'Best for']}
          rows={[
            [<InlineCode>RPG Icon</InlineCode>,     'Dark background game inventory items'],
            [<InlineCode>Emoji</InlineCode>,        'Bright simple icons with no background'],
            [<InlineCode>Tileset</InlineCode>,      'Seamlessly repeating flat terrain tiles'],
            [<InlineCode>Sprite Sheet</InlineCode>, 'Multiple character poses on one sheet'],
            [<InlineCode>Game UI</InlineCode>,      'HUD elements, buttons, and widgets'],
            [<InlineCode>Raw</InlineCode>,          'No preset — pure model output'],
          ]}
        />

        <SubTitle>Keyboard shortcuts</SubTitle>
        <Table
          headers={['Shortcut', 'Action']}
          rows={[
            ['⌘ + Enter', 'Generate (when prompt is focused)'],
            ['1 – 5', 'Switch active tool'],
            ['Esc', 'Close modals'],
          ]}
        />

        <SubTitle>BYOK — Bring Your Own Key</SubTitle>
        <P>
          Open the <strong>Config</strong> icon in the tool rail sidebar (or press the ⚙ button).
          Enter your API keys in the settings modal. Keys are stored in your browser's
          <InlineCode>localStorage</InlineCode> and are only sent to the server
          as part of generation requests — they are never persisted to the database.
        </P>

        <HR />

        {/* ── REST API ──────────────────────────────────────────────────── */}
        <SectionTitle id="api" icon="⊞">REST API</SectionTitle>

        <P>
          WokGen exposes a REST API that can be called programmatically. All endpoints
          accept and return JSON. No authentication is required for self-hosted deployments.
        </P>

        <Callout type="info">
          All API routes are prefixed with <InlineCode>/api</InlineCode>. The server runs at
          <InlineCode>http://localhost:3000</InlineCode> by default.
        </Callout>

        {/* POST /api/generate */}
        <SubTitle>POST /api/generate</SubTitle>
        <P>Generate pixel art. Runs the full generation synchronously and returns the result.</P>

        <CodeBlock lang="json" label="Request body">
{`{
  "tool":        "generate",          // generate | animate | rotate | inpaint | scene
  "provider":    "together",          // replicate | fal | together | comfyui
  "prompt":      "iron sword, RPG icon, ornate crossguard",
  "negPrompt":   "blurry, 3d render", // optional
  "width":       512,                 // 32 | 64 | 128 | 256 | 512
  "height":      512,
  "seed":        1337,                // optional — omit for random
  "steps":       4,                   // optional
  "guidance":    3.5,                 // optional
  "stylePreset": "rpg_icon",          // optional
  "isPublic":    false,               // save to gallery if true
  "apiKey":      "your-key-here"      // optional BYOK override
}`}
        </CodeBlock>

        <CodeBlock lang="json" label="Response">
{`{
  "ok":          true,
  "job": {
    "id":        "cly1abc...",
    "tool":      "generate",
    "status":    "succeeded",
    "provider":  "together",
    "prompt":    "iron sword, RPG icon, ornate crossguard",
    "width":     512,
    "height":    512,
    "seed":      1337,
    "resultUrl": "https://...",
    "isPublic":  false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:05.231Z"
  },
  "resultUrl":   "https://cdn.together.xyz/...",
  "resultUrls":  null,
  "durationMs":  5231,
  "resolvedSeed": 1337
}`}
        </CodeBlock>

        <CodeBlock lang="bash" label="curl example">
{`curl -X POST http://localhost:3000/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "health potion, glowing red liquid, crystal vial",
    "provider": "together",
    "width": 256,
    "stylePreset": "rpg_icon",
    "apiKey": "YOUR_TOGETHER_API_KEY"
  }'`}
        </CodeBlock>

        {/* GET /api/jobs/[id] */}
        <SubTitle>GET /api/jobs/[id]</SubTitle>
        <P>Fetch the current state of a job by its ID.</P>
        <CodeBlock lang="bash">
{`GET /api/jobs/cly1abc123`}
        </CodeBlock>

        {/* PATCH /api/jobs/[id] */}
        <SubTitle>PATCH /api/jobs/[id]</SubTitle>
        <P>Update a job's title, visibility, or tags.</P>
        <CodeBlock lang="json" label="Request body">
{`{
  "title":    "Iron Sword — Legendary",
  "isPublic": true,
  "tags":     ["weapon", "sword", "legendary", "rpg"]
}`}
        </CodeBlock>

        {/* DELETE /api/jobs/[id] */}
        <SubTitle>DELETE /api/jobs/[id]</SubTitle>
        <P>Permanently delete a job and its gallery asset (if any). Image URLs hosted on provider CDNs are not affected.</P>

        {/* GET /api/gallery */}
        <SubTitle>GET /api/gallery</SubTitle>
        <P>List public gallery assets with filtering and pagination.</P>
        <Table
          headers={['Parameter', 'Type', 'Default', 'Description']}
          rows={[
            ['limit',  'number', '24',    'Max results (1–100)'],
            ['cursor', 'string', '—',     'Pagination cursor from previous response'],
            ['tool',   'string', '—',     'Filter by tool: generate | animate | rotate | inpaint | scene'],
            ['rarity', 'string', '—',     'Filter by rarity: common | uncommon | rare | epic | legendary'],
            ['search', 'string', '—',     'Substring search on prompt and title'],
            ['sort',   'string', 'newest','newest | oldest'],
          ]}
        />

        {/* POST /api/gallery */}
        <SubTitle>POST /api/gallery</SubTitle>
        <P>Promote a succeeded job to the public gallery.</P>
        <CodeBlock lang="json" label="Request body">
{`{
  "jobId":    "cly1abc123",
  "title":    "Iron Sword",
  "rarity":   "rare",
  "isPublic": true,
  "tags":     ["weapon", "sword"]
}`}
        </CodeBlock>

        {/* GET /api/providers */}
        <SubTitle>GET /api/providers</SubTitle>
        <P>
          Returns availability status for all configured providers. Does not expose key values —
          only boolean presence flags. Used by the Studio UI to determine which providers are ready.
        </P>

        <HR />

        {/* ── Provider Setup ────────────────────────────────────────────── */}
        <SectionTitle id="providers" icon="☁">Provider Setup</SectionTitle>

        <P>
          WokGen supports four AI providers. You can configure any combination — the Studio
          will show which are available. At least one provider key is required.
        </P>

        <Callout type="tip">
          <strong>Recommended for new users:</strong> Sign up for Together.ai and set
          <InlineCode>TOGETHER_API_KEY</InlineCode>. The <InlineCode>FLUX.1-schnell-Free</InlineCode> model
          is completely free with no billing required.
        </Callout>

        <SubTitle>Replicate</SubTitle>
        <P>
          Runs SDXL and FLUX models in the cloud. Free credits are available for new accounts.
        </P>
        <CodeBlock lang="bash">
{`# 1. Sign up at https://replicate.com/
# 2. Get your token: https://replicate.com/account/api-tokens
# 3. Add to .env.local:
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxx`}
        </CodeBlock>

        <SubTitle>fal.ai</SubTitle>
        <P>Fast inference with FLUX models. Free trial credits on signup.</P>
        <CodeBlock lang="bash">
{`# 1. Sign up at https://fal.ai/
# 2. Get your key: https://fal.ai/dashboard/keys
# 3. Add to .env.local:
FAL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
        </CodeBlock>

        <SubTitle>Together.ai</SubTitle>
        <P>
          <InlineCode>FLUX.1-schnell-Free</InlineCode> is completely free — unlimited
          generations with no billing required.
        </P>
        <CodeBlock lang="bash">
{`# 1. Sign up at https://api.together.xyz/
# 2. Get your key: https://api.together.xyz/settings/api-keys
# 3. Add to .env.local:
TOGETHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
        </CodeBlock>

        <SubTitle>ComfyUI (Local)</SubTitle>
        <P>
          Run your own ComfyUI instance locally or on a remote server. 100% free — runs on your GPU
          using any checkpoint you have installed.
        </P>
        <CodeBlock lang="bash">
{`# 1. Install ComfyUI:
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
python3 -m pip install -r requirements.txt

# 2. Download a checkpoint (e.g. v1-5-pruned-emaonly.safetensors)
#    and place it in ComfyUI/models/checkpoints/

# 3. Start ComfyUI:
python main.py --listen 127.0.0.1 --port 8188

# 4. Add to .env.local:
COMFYUI_HOST=http://127.0.0.1:8188`}
        </CodeBlock>

        <Callout type="info">
          When using Docker, set <InlineCode>COMFYUI_HOST=http://host.docker.internal:8188</InlineCode>
          to reach a ComfyUI instance running on the host machine.
        </Callout>

        <HR />

        {/* ── Asset Pipeline CLI ────────────────────────────────────────── */}
        <SectionTitle id="pipeline" icon="⚙">Asset Pipeline CLI</SectionTitle>

        <P>
          The <InlineCode>packages/asset-pipeline</InlineCode> package is a production-grade
          batch generation tool for building game asset catalogs. It is separate from the
          web studio — use it when you need to generate dozens or hundreds of assets
          programmatically.
        </P>

        <SubTitle>Quick start</SubTitle>
        <CodeBlock lang="bash">
{`cd packages/asset-pipeline
npm install
export REPLICATE_API_TOKEN=r8_...

# Run the interactive TUI:
npm start

# Or run the full pipeline non-interactively:
npm run cycle                              # 5 items, default categories
npm run cycle -- --category items/weapons  # filter to weapons
npm run cycle -- --engine cpu              # CPU procedural fallback (no AI)`}
        </CodeBlock>

        <SubTitle>Pipeline stages</SubTitle>
        <Table
          headers={['Command', 'Description']}
          rows={[
            [<InlineCode>npm run prompts</InlineCode>, 'Generate deterministic prompt jobs from the 450+ item catalog'],
            [<InlineCode>npm run gen</InlineCode>,     'Call Replicate SDXL/FLUX to generate raw images'],
            [<InlineCode>npm run normalize</InlineCode>, 'Resize, remap palette, and enforce pixel art constraints'],
            [<InlineCode>npm run package</InlineCode>,   'Export icon variants at 32/64/128/256/512px and build sprite sheets'],
            [<InlineCode>npm run validate</InlineCode>,  'Validate dimensions, alpha, palette membership, file sizes, duplicates'],
            [<InlineCode>npm run registry</InlineCode>,  'Build registry/assets.json — single source of truth for game lookups'],
            [<InlineCode>npm run all</InlineCode>,       'Run all stages in sequence'],
          ]}
        />

        <SubTitle>Dataset intake</SubTitle>
        <P>
          Drop downloaded art packs into <InlineCode>dataset/inbox/</InlineCode> with optional
          license metadata in <InlineCode>dataset/inbox/_licenses.csv</InlineCode>. The intake
          pipeline filters by license (CC0, CC-BY-*, OGA-BY), deduplicates by hash, and
          generates an attribution file.
        </P>
        <CodeBlock lang="bash">
{`npm run data:reset           # clean workspace
# drag files into dataset/inbox/
npm run data:intake          # accept/reject by license, dedup, build ATTRIBUTION.md
npm run data:report          # dry run — show what would happen`}
        </CodeBlock>

        <HR />

        {/* ── Self-Hosting ──────────────────────────────────────────────── */}
        <SectionTitle id="self-hosting" icon="🖥">Self-Hosting</SectionTitle>

        <P>
          WokGen is designed to run on any server with Node.js 20+ and no external
          dependencies beyond the SQLite database file. No Redis, no queues, no external
          storage required.
        </P>

        <SubTitle>Production build</SubTitle>
        <CodeBlock lang="bash">
{`cd apps/web
npm run build
npm run start        # serves at http://localhost:3000`}
        </CodeBlock>

        <SubTitle>Environment variables</SubTitle>
        <Table
          headers={['Variable', 'Required', 'Default', 'Description']}
          rows={[
            [<InlineCode>DATABASE_URL</InlineCode>, '✓', '—', 'SQLite path, e.g. file:./prisma/wokgen.db'],
            [<InlineCode>REPLICATE_API_TOKEN</InlineCode>, '—', '—', 'Replicate API token'],
            [<InlineCode>FAL_KEY</InlineCode>, '—', '—', 'fal.ai API key'],
            [<InlineCode>TOGETHER_API_KEY</InlineCode>, '—', '—', 'Together.ai API key'],
            [<InlineCode>COMFYUI_HOST</InlineCode>, '—', 'http://127.0.0.1:8188', 'ComfyUI base URL'],
            [<InlineCode>COMFYUI_CHECKPOINT</InlineCode>, '—', 'v1-5-pruned-emaonly.safetensors', 'Default ComfyUI checkpoint filename'],
            [<InlineCode>GENERATION_TIMEOUT_MS</InlineCode>, '—', '300000', 'Per-request generation timeout in ms'],
            [<InlineCode>NODE_ENV</InlineCode>, '—', 'development', 'Set to production for prod builds'],
            [<InlineCode>PORT</InlineCode>, '—', '3000', 'HTTP port'],
          ]}
        />

        <Callout type="warning">
          At least one of <InlineCode>REPLICATE_API_TOKEN</InlineCode>, <InlineCode>FAL_KEY</InlineCode>,
          or <InlineCode>TOGETHER_API_KEY</InlineCode> must be set for cloud generation. Alternatively,
          run ComfyUI locally and set <InlineCode>COMFYUI_HOST</InlineCode>.
        </Callout>

        <SubTitle>systemd service</SubTitle>
        <CodeBlock lang="ini" label="/etc/systemd/system/wokgen.service">
{`[Unit]
Description=WokGen AI Pixel Art Studio
After=network.target

[Service]
Type=simple
User=wokgen
WorkingDirectory=/opt/wokgen
EnvironmentFile=/opt/wokgen/.env.local
ExecStart=/usr/bin/node apps/web/node_modules/.bin/next start apps/web --port 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target`}
        </CodeBlock>

        <CodeBlock lang="bash">
{`sudo systemctl enable --now wokgen
sudo systemctl status wokgen
journalctl -u wokgen -f`}
        </CodeBlock>

        <HR />

        {/* ── Docker ────────────────────────────────────────────────────── */}
        <SectionTitle id="docker" icon="🐳">Docker</SectionTitle>

        <P>
          The included <InlineCode>Dockerfile</InlineCode> uses a multi-stage build to produce a
          minimal production image. A persistent volume at <InlineCode>/data</InlineCode> stores
          the SQLite database between container restarts.
        </P>

        <SubTitle>Build & run</SubTitle>
        <CodeBlock lang="bash">
{`# Build the image
docker build -t wokgen .

# Run with env file
docker run -d \\
  --name wokgen \\
  -p 3000:3000 \\
  --env-file .env.local \\
  -v wokgen-data:/data \\
  wokgen`}
        </CodeBlock>

        <SubTitle>docker-compose.yml</SubTitle>
        <CodeBlock lang="yaml" label="docker-compose.yml">
{`version: '3.8'
services:
  wokgen:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    environment:
      - DATABASE_URL=file:/data/wokgen.db
      - NODE_ENV=production
    volumes:
      - wokgen-data:/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/providers"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  wokgen-data:`}
        </CodeBlock>

        <CodeBlock lang="bash">
{`docker compose up -d
docker compose logs -f wokgen`}
        </CodeBlock>

        <Callout type="info">
          When using ComfyUI on the host machine from within Docker, set
          <InlineCode>COMFYUI_HOST=http://host.docker.internal:8188</InlineCode>
          in your <InlineCode>.env.local</InlineCode>.
        </Callout>

        <HR />

        {/* ── License ───────────────────────────────────────────────────── */}
        <SectionTitle id="license" icon="⚖">License</SectionTitle>

        <P>
          WokGen is licensed under the <strong>MIT License with Commons Clause</strong>.
        </P>

        <div
          style={{
            padding: '16px 18px',
            borderRadius: 8,
            background: 'var(--surface-overlay)',
            border: '1px solid var(--surface-border)',
            marginBottom: '1.25rem',
          }}
        >
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: 'var(--text-primary)' }}>MIT License</strong> — You are free to use,
            copy, modify, and distribute the software for any purpose, including commercial use, subject to
            the MIT conditions.<br /><br />
            <strong style={{ color: 'var(--warning)' }}>Commons Clause</strong> — You may not sell the
            software as an unmodified hosted service (i.e., you cannot offer "WokGen as a Service" without
            significant modification). Self-hosting, modification, and personal/commercial use of outputs
            are explicitly permitted.
          </p>
        </div>

        <Table
          headers={['Use case', 'Allowed']}
          rows={[
            ['Self-host for personal use', '✓ Yes'],
            ['Self-host for your company', '✓ Yes'],
            ['Modify and redistribute', '✓ Yes'],
            ['Use generated images commercially', '✓ Yes'],
            ['Sell hosted WokGen as a service (unmodified)', '✕ No (Commons Clause)'],
          ]}
        />

        <P>
          Copyright © 2026 Wok Specialists / WokGen Contributors.{' '}
          <a
            href="https://github.com/WokSpecialists/WokGen/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full license text →
          </a>
        </P>

        {/* Bottom nav */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            paddingTop: 24,
            marginTop: 12,
            borderTop: '1px solid var(--surface-border)',
          }}
        >
          <Link href="/studio" className="btn-primary btn-sm">
            ✦ Open Studio
          </Link>
          <Link href="/gallery" className="btn-secondary btn-sm">
            Browse Gallery
          </Link>
          <a
            href="https://github.com/WokSpecialists/WokGen"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-sm"
          >
            GitHub →
          </a>
        </div>

      </main>
    </div>
  );
}
