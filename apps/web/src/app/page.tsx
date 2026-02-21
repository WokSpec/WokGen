'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    id: 'generate',
    icon: '✦',
    label: 'Generate',
    description: 'Text → pixel art sprite or icon at 32–512px with any cloud provider.',
    color: '#41A6F6',
    glow: 'rgba(65,166,246,0.25)',
  },
  {
    id: 'animate',
    icon: '▶',
    label: 'Animate',
    description: 'Turn a static sprite into a looping GIF animation with text control.',
    color: '#38B764',
    glow: 'rgba(56,183,100,0.25)',
  },
  {
    id: 'rotate',
    icon: '↻',
    label: 'Rotate',
    description: 'Generate 4 or 8 directional views of any sprite automatically.',
    color: '#73EFF7',
    glow: 'rgba(115,239,247,0.25)',
  },
  {
    id: 'inpaint',
    icon: '⬛',
    label: 'Inpaint',
    description: 'Edit specific regions of existing pixel art using a brush mask.',
    color: '#FFCD75',
    glow: 'rgba(255,205,117,0.25)',
  },
  {
    id: 'scene',
    icon: '⊞',
    label: 'Scenes & Maps',
    description: 'Generate tilesets, environments, and full game maps from a prompt.',
    color: '#A7F070',
    glow: 'rgba(167,240,112,0.25)',
  },
] as const;

const PROVIDERS = [
  {
    id: 'replicate',
    label: 'Replicate',
    note: 'Free credits for new users',
    envVar: 'REPLICATE_API_TOKEN',
    color: '#0066FF',
    free: true,
    models: 'SDXL · FLUX.1-schnell · FLUX.1-dev',
    href: 'https://replicate.com/account/api-tokens',
  },
  {
    id: 'fal',
    label: 'fal.ai',
    note: 'Free trial credits',
    envVar: 'FAL_KEY',
    color: '#7B2FBE',
    free: true,
    models: 'FLUX.1-schnell · FLUX.1-dev · FLUX-LoRA',
    href: 'https://fal.ai/dashboard/keys',
  },
  {
    id: 'together',
    label: 'Together.ai',
    note: 'FLUX.1-schnell-Free — unlimited',
    envVar: 'TOGETHER_API_KEY',
    color: '#00A67D',
    free: true,
    models: 'FLUX.1-schnell-Free (no cost)',
    href: 'https://api.together.xyz/settings/api-keys',
  },
  {
    id: 'comfyui',
    label: 'ComfyUI (Local)',
    note: '100% free — runs on your GPU',
    envVar: 'COMFYUI_HOST',
    color: '#E06C00',
    free: true,
    models: 'Any checkpoint · LoRA support',
    href: 'https://github.com/comfyanonymous/ComfyUI',
  },
] as const;

const DEMO_PROMPTS = [
  'iron sword with ornate hilt, RPG inventory icon',
  'health potion, glowing red liquid in crystal vial',
  'ancient wooden shield with iron rivets',
  'fire spell scroll with golden seal',
  'enchanted bow with glowing string',
  'diamond pickaxe, Minecraft style',
  'legendary crown with sapphires and gold',
  'poison dagger, dark green blade',
];

const STATS = [
  { value: '450+', label: 'Catalog items' },
  { value: '31', label: 'Categories' },
  { value: '4', label: 'AI providers' },
  { value: '5', label: 'Studio tools' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PixelDot({ color, size = 4 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        imageRendering: 'pixelated',
      }}
      aria-hidden="true"
    />
  );
}

function TypingText({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pause' | 'erasing'>('typing');

  useEffect(() => {
    const current = phrases[index];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (displayed.length < current.length) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length + 1));
        }, 38);
      } else {
        timeout = setTimeout(() => setPhase('pause'), 1800);
      }
    } else if (phase === 'pause') {
      timeout = setTimeout(() => setPhase('erasing'), 200);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, 18);
      } else {
        setIndex((i) => (i + 1) % phrases.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, index, phrases]);

  return (
    <span>
      {displayed}
      <span
        className="inline-block w-0.5 h-[1.1em] ml-0.5 -mb-0.5 align-middle animate-blink"
        style={{ background: 'var(--accent)' }}
        aria-hidden="true"
      />
    </span>
  );
}

function ToolCard({
  tool,
  index,
}: {
  tool: (typeof TOOLS)[number];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/studio?tool=${tool.id}`}
      className={`card-hover flex flex-col gap-3 p-5 animate-fade-in`}
      style={{
        animationDelay: `${index * 0.07}s`,
        borderColor: hovered ? tool.color + '55' : undefined,
        boxShadow: hovered ? `0 0 24px 4px ${tool.glow}` : undefined,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold flex-shrink-0 transition-all duration-200"
        style={{
          background: hovered ? tool.color + '22' : 'var(--surface-overlay)',
          border: `1px solid ${hovered ? tool.color + '55' : 'var(--surface-border)'}`,
          color: tool.color,
          textShadow: hovered ? `0 0 12px ${tool.color}` : 'none',
        }}
      >
        {tool.icon}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <h3
          className="text-sm font-semibold leading-none transition-colors duration-150"
          style={{ color: hovered ? tool.color : 'var(--text-primary)' }}
        >
          {tool.label}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {tool.description}
        </p>
      </div>

      {/* Arrow */}
      <div
        className="mt-auto flex items-center gap-1 text-xs font-medium transition-all duration-150"
        style={{ color: hovered ? tool.color : 'var(--text-disabled)' }}
      >
        Open in Studio
        <span
          className="transition-transform duration-150"
          style={{ transform: hovered ? 'translateX(3px)' : 'none' }}
        >
          →
        </span>
      </div>
    </Link>
  );
}

function ProviderCard({
  provider,
  index,
}: {
  provider: (typeof PROVIDERS)[number];
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const copyEnvVar = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigator.clipboard.writeText(provider.envVar).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className="card flex flex-col gap-3 p-4 animate-fade-in"
      style={{ animationDelay: `${0.1 + index * 0.06}s` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PixelDot color={provider.color} size={8} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {provider.label}
          </span>
        </div>
        <span
          className="text-2xs px-1.5 py-0.5 rounded font-medium"
          style={{
            background: 'rgba(56,183,100,0.12)',
            color: 'var(--success)',
            border: '1px solid rgba(56,183,100,0.25)',
            fontSize: '0.65rem',
          }}
        >
          FREE
        </span>
      </div>

      {/* Note */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {provider.note}
      </p>

      {/* Models */}
      <p className="text-xs font-mono" style={{ color: 'var(--text-disabled)' }}>
        {provider.models}
      </p>

      {/* Env var */}
      <button
        onClick={copyEnvVar}
        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs font-mono cursor-pointer transition-all duration-150 w-full text-left"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid var(--surface-border)',
          color: copied ? 'var(--success)' : 'var(--accent-hover)',
        }}
        title="Click to copy"
      >
        <span>{provider.envVar}</span>
        <span style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}>
          {copied ? '✓' : '⊕'}
        </span>
      </button>

      {/* Docs link */}
      <a
        href={provider.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs transition-colors duration-150"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = provider.color)}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-muted)')}
      >
        Get API key →
      </a>
    </div>
  );
}

function QuickStartBlock() {
  const [copied, setCopied] = useState(false);

  const code = `git clone https://github.com/WokSpecialists/WokGen.git
cd WokGen
cp .env.example .env.local
# Add at least one AI provider key to .env.local
npm install
cd apps/web && npx prisma db push && cd ../..
npm run dev`;

  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="code-block-header">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#B13E53' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#FFCD75' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#38B764' }} />
          </div>
          <span style={{ color: 'var(--text-muted)' }}>bash</span>
        </div>
        <button
          onClick={copy}
          className="text-xs transition-colors duration-150 flex items-center gap-1"
          style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}
        >
          {copied ? '✓ Copied' : '⊕ Copy'}
        </button>
      </div>
      <pre className="text-xs leading-relaxed overflow-x-auto p-4 m-0 rounded-none border-none" style={{ color: 'var(--text-secondary)', background: 'var(--surface-muted)' }}>
        {code.split('\n').map((line, i) => (
          <span key={i} className="block">
            {line.startsWith('#') ? (
              <span style={{ color: 'var(--text-disabled)' }}>{line}</span>
            ) : line.startsWith('cd') || line.startsWith('cp') || line.startsWith('npm') || line.startsWith('npx') || line.startsWith('git') ? (
              <>
                <span style={{ color: 'var(--accent)' }}>$</span>
                <span style={{ color: 'var(--text-secondary)' }}> {line}</span>
              </>
            ) : (
              line
            )}
          </span>
        ))}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pixel art showcase — deterministic animated grid
// ---------------------------------------------------------------------------
const PALETTE = [
  '#1A1C2C', '#5D275D', '#B13E53', '#EF7D57', '#FFCD75',
  '#A7F070', '#38B764', '#257179', '#29366F', '#3B5DC9',
  '#41A6F6', '#73EFF7',
];

function PixelShowcase() {
  const GRID = 12;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), 160);
    return () => clearInterval(id);
  }, []);

  // Simple deterministic pattern — evolves with frame
  const getColor = (x: number, y: number, f: number) => {
    const t = f * 0.18;
    const v = Math.sin(x * 0.7 + t) * Math.cos(y * 0.7 - t * 0.6) * 0.5 + 0.5;
    const idx = Math.floor(v * (PALETTE.length - 1));
    const alpha = v > 0.35 ? (v > 0.7 ? 1 : 0.7) : 0;
    return alpha > 0 ? PALETTE[idx] : null;
  };

  return (
    <div
      className="grid gap-px rounded-lg overflow-hidden flex-shrink-0"
      style={{
        gridTemplateColumns: `repeat(${GRID}, 1fr)`,
        width: 192,
        height: 192,
        background: '#0a0a10',
        border: '1px solid var(--surface-border)',
        imageRendering: 'pixelated',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: GRID * GRID }, (_, i) => {
        const x = i % GRID;
        const y = Math.floor(i / GRID);
        const color = getColor(x, y, frame);
        return (
          <div
            key={i}
            style={{
              background: color ?? 'transparent',
              transition: 'background 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 py-20 md:py-28"
        style={{ background: 'var(--surface-base)' }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 pixel-grid-bg opacity-60 pointer-events-none" />
        {/* Radial glow behind hero text */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(65,166,246,0.08) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: text */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              {/* Eyebrow + attribution */}
              <div className="flex flex-col items-center lg:items-start gap-2 mb-6 animate-fade-in">
                <span
                  className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded"
                  style={{
                    background: 'rgba(52,211,153,0.08)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    color: '#6ee7b7',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                  Early Preview · Active development — expect changes
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Open-source · MIT + Commons Clause · by{' '}
                  <a
                    href="https://wokspec.org"
                    style={{ color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                  >
                    Wok Specialists
                  </a>
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-bold mb-4 animate-fade-in leading-tight"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                  color: 'var(--text-primary)',
                  animationDelay: '0.05s',
                  letterSpacing: '-0.02em',
                }}
              >
                AI Pixel Art{' '}
                <span className="gradient-text">Studio</span>
              </h1>

              {/* Typing subtitle */}
              <p
                className="text-lg mb-8 animate-fade-in"
                style={{
                  color: 'var(--text-muted)',
                  animationDelay: '0.1s',
                  minHeight: '2.6em',
                  lineHeight: 1.6,
                }}
              >
                Generate&nbsp;
                <span style={{ color: 'var(--text-secondary)' }}>
                  <TypingText phrases={DEMO_PROMPTS} />
                </span>
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <Link
                  href="/studio"
                  className="btn-primary btn-lg"
                  style={{ minWidth: 160 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Open Studio
                </Link>
                <Link href="/gallery" className="btn-secondary btn-lg">
                  Browse Gallery
                </Link>
                <a
                  href="https://github.com/WokSpecialists/WokGen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-lg"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>

              {/* Stats row */}
              <div
                className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div
                      className="text-xl font-bold leading-none mb-0.5 gradient-text"
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: pixel showcase */}
            <div
              className="flex-shrink-0 flex flex-col items-center gap-4 animate-fade-in"
              style={{ animationDelay: '0.12s' }}
            >
              <PixelShowcase />
              <p className="text-xs text-center" style={{ color: 'var(--text-disabled)' }}>
                Live pixel art preview
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools ───────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16" style={{ background: 'var(--surface-raised)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Five tools. One studio.
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Everything you need to produce game-ready pixel art assets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {TOOLS.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Providers ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-16" style={{ background: 'var(--surface-base)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Provider-agnostic. All free tiers.
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Set any combination of providers. Click an env var to copy it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PROVIDERS.map((p, i) => (
              <ProviderCard key={p.id} provider={p} index={i} />
            ))}
          </div>

          {/* Note */}
          <p
            className="text-xs text-center mt-6"
            style={{ color: 'var(--text-disabled)' }}
          >
            No provider keys stored server-side — you bring your own (BYOK) or set env vars in .env.local.
          </p>
        </div>
      </section>

      {/* ── Quick Start ─────────────────────────────────────────────────────── */}
      <section
        className="px-6 py-16"
        style={{ background: 'var(--surface-raised)', borderTop: '1px solid var(--surface-border)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Up and running in 60 seconds
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Self-host on any machine with Node.js 20+. No account required.
            </p>
          </div>

          <QuickStartBlock />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link href="/docs" className="btn-secondary">
              Read the docs
            </Link>
            <Link href="/studio" className="btn-primary">
              Skip to Studio →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Asset Pipeline callout ──────────────────────────────────────────── */}
      <section
        className="px-6 py-12"
        style={{ background: 'var(--surface-base)', borderTop: '1px solid var(--surface-border)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div
            className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl animate-fade-in"
            style={{
              background: 'var(--surface-overlay)',
              border: '1px solid var(--surface-border)',
            }}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center w-14 h-14 rounded-xl flex-shrink-0 text-2xl"
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-muted)',
              }}
              aria-hidden="true"
            >
              ⚙
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Need batch production? Use the Asset Pipeline CLI.
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                <code className="text-xs">packages/asset-pipeline</code> runs automated
                generate → normalize → package → validate → registry cycles for entire
                item catalogs. 450+ item catalog included, RPG-ready.
              </p>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <a
                href="https://github.com/WokSpecialists/WokGen/tree/main/packages/asset-pipeline"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-sm whitespace-nowrap"
              >
                View Pipeline →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8"
        style={{
          background: 'var(--surface-muted)',
          borderTop: '1px solid var(--surface-border)',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-disabled)' }}>
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>WokGen</span>
            <span>·</span>
            <span>MIT + Commons Clause</span>
            <span>·</span>
            <span>© 2026 Wok Specialists</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" style={{ color: 'var(--text-disabled)' }} className="hover:text-wok-mist transition-colors">Docs</Link>
            <Link href="/gallery" style={{ color: 'var(--text-disabled)' }} className="hover:text-wok-mist transition-colors">Gallery</Link>
            <a
              href="https://github.com/WokSpecialists/WokGen"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-disabled)' }}
              className="hover:text-wok-mist transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
