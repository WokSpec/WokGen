import type { Metadata } from 'next';
import Link from 'next/link';
import { MODES_LIST } from '@/lib/modes';

export const metadata: Metadata = {
  title: 'WokGen — AI Generation Studio',
  description: 'Studio for pixel art, brand assets, vectors, UI components, voice, and code. One workspace, every asset type.',
  keywords: ['AI asset generator', 'pixel art AI', 'brand asset generator', 'sprite generator', 'AI logo maker', 'WokGen', 'WokSpec'],
  openGraph: {
    title: 'WokGen — AI Generation Studio',
    description: 'Studio for pixel art, brand assets, vectors, UI components, voice, and code.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const MODE_DESCS: Record<string, string> = {
  pixel:    'Sprites, tilesets, and game-ready asset packs.',
  business: 'Logos, brand kits, and social visuals.',
  vector:   'SVG icon sets, illustrations, and graphics.',
  uiux:     'React components, Tailwind sections, and templates.',
  voice:    'TTS narration and audio assets.',
  code:     'Components, docs, SQL, and boilerplate.',
};

const PROVIDERS = ['FLUX', 'Stable Diffusion', 'Llama 3.3', 'Kokoro', 'Real-ESRGAN', 'MusicGen', 'BLIP', 'Groq'];

export default function HomePage() {
  return (
    <div className="homepage-root min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-14 sm:pt-24 pb-12 sm:pb-20">
        <div
          className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] mb-6"
          style={{ background: 'var(--surface-raised)' }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--success)',
              display: 'inline-block',
              boxShadow: '0 0 6px var(--success)',
            }}
          />
          AI Generation Studio
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          WokGen
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base max-w-sm mb-8 leading-relaxed">
          Generate pixel art, vectors, UI mockups, voice, music, and business assets — free, AI-powered, no limits.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/pixel/studio"
            className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            Start Creating
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition text-sm border border-[var(--border)] text-[var(--text)]"
            style={{ background: 'var(--surface-raised)' }}
          >
            Browse Tools
          </Link>
        </div>
      </section>

      {/* ── Studio Modes ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Studios</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {MODES_LIST.map((mode) => (
            <Link
              key={mode.id}
              href={mode.routes.studio}
              className="group block rounded-lg border border-[var(--border)] p-4 transition-colors"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div
                className="h-[3px] w-8 rounded-full mb-3.5 transition-all group-hover:w-12"
                style={{ background: mode.accentColor }}
              />
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{mode.label}</span>
                {mode.status !== 'stable' && (
                  <span
                    className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{
                      background: `color-mix(in srgb, ${mode.accentColor} 12%, transparent)`,
                      color: mode.accentColor,
                    }}
                  >
                    {mode.status === 'beta' ? 'Beta' : 'Soon'}
                  </span>
                )}
              </div>
              <div className="text-[var(--text-muted)] text-xs leading-relaxed">
                {MODE_DESCS[mode.id] ?? ''}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Free Services ────────────────────────────────────── */}
      <section className="home-free-services max-w-4xl mx-auto px-6 pb-20">
        <div className="home-section-header">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Powered by <span style={{ color: 'var(--accent)' }}>10+ free AI services</span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-8">Zero API cost by default. Add your free keys to unlock more.</p>
        </div>
        <div className="home-services-grid">
          {[
            { name: 'FLUX.1-schnell', role: 'Image generation', free: true, via: 'Pollinations' },
            { name: 'Stable Diffusion', role: '30+ SD models', free: true, via: 'Prodia' },
            { name: 'Stable Horde', role: 'Federated GPU pool', free: true, via: 'Community' },
            { name: 'Llama 3.3 70B', role: 'Prompt enhancement', free: true, via: 'Groq' },
            { name: 'Llama 3.3 70B', role: 'Ultra-fast inference', free: true, via: 'Cerebras' },
            { name: 'Gemini Flash 2.0', role: 'Multimodal analysis', free: true, via: 'Google' },
            { name: 'Real-ESRGAN', role: '4× image upscaling', free: true, via: 'HuggingFace' },
            { name: 'BLIP', role: 'Image interrogation', free: true, via: 'Salesforce' },
            { name: 'MusicGen', role: 'Music generation', free: true, via: 'Meta' },
            { name: 'Freesound + Pixabay', role: 'CC0 media library', free: true, via: 'Community' },
          ].map((s) => (
            <div key={s.name + s.role} className="home-service-card">
              <span className="home-service-badge">FREE</span>
              <strong>{s.name}</strong>
              <span>{s.role}</span>
              <small>via {s.via}</small>
            </div>
          ))}
        </div>
      </section>

      {/* ── Eral ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">AI Director</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>Eral</h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-6 max-w-xs text-sm">
              Describe what you&apos;re building. Eral plans your asset pipeline, routes tasks to the right studio, and maintains context across your project.
            </p>
            <Link
              href="/eral"
              className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
              style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
            >
              Open Eral
            </Link>
          </div>
          <div
            className="rounded-lg border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="text-xs font-semibold text-[var(--text-muted)]">Eral</span>
            </div>
            <div className="p-4 space-y-3">
              <div
                className="ml-auto max-w-[80%] rounded-lg rounded-tr-sm px-3 py-2 text-[var(--text-muted)] text-xs leading-relaxed"
                style={{ background: 'var(--surface-raised)' }}
              >
                I need assets for a dark fantasy RPG main menu.
              </div>
              <div
                className="max-w-[85%] rounded-lg rounded-tl-sm px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)] border border-[var(--border)]"
                style={{ background: 'var(--bg-surface)' }}
              >
                Here&apos;s what I&apos;d queue:<br /><br />
                <strong>1.</strong> Hero background — Pixel mode<br />
                <strong>2.</strong> Logo with runic type — Brand mode<br />
                <strong>3.</strong> UI button set — UI/UX mode<br /><br />
                Queue all three?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── API ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">Programmatic</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>API</h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-6 max-w-xs text-sm">
              Programmatic access to every studio. Integrate generation into your own tools, pipelines, and workflows.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="/developers"
                className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition text-sm"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
              >
                Docs
              </a>
              <a
                href="/account/api-keys"
                className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition text-sm border border-[var(--border)] text-[var(--text)]"
                style={{ background: 'var(--surface-raised)' }}
              >
                API Keys
              </a>
            </div>
          </div>
          <div
            className="rounded-lg border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div
              className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--border)]"
              style={{ background: 'var(--bg-surface)' }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-strong)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-strong)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-strong)' }} />
              <span className="ml-2 text-xs text-[var(--text-faint)]">@wokspec/sdk</span>
            </div>
            <pre
              className="p-4 text-xs leading-relaxed overflow-x-auto text-[var(--text-secondary)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <code>{`import WokGen from '@wokspec/sdk';

const wok = new WokGen({ apiKey: 'wok_...' });

const asset = await wok.generate({
  prompt: 'pixel art wizard, 32x32',
  mode: 'pixel',
});

console.log(asset.url);`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Footer strip ─────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-sm">
            <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">GitHub</a>
            <a href="/changelog" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Changelog</a>
            <a href="/docs" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {PROVIDERS.map((p) => (
              <span
                key={p}
                className="text-xs text-[var(--text-faint)] px-2 py-1 rounded border border-[var(--border)]"
                style={{ background: 'var(--surface-raised)' }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
