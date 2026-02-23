'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { EralSidebar } from '@/app/_components/EralSidebar';
import { QuotaBadge } from '@/components/quota-badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type EmojiTool = 'emoji' | 'pack';
type StylePreset = 'expressive' | 'minimal' | 'blob' | 'pixel_emoji';
type SizeOption = 32 | 64 | 128 | 256;
type Platform = 'universal' | 'discord' | 'slack' | 'apple' | 'android';
type BgMode = 'transparent' | 'white';
type JobStatus = 'idle' | 'running' | 'succeeded' | 'failed';

interface GenerationResult {
  jobId: string;
  resultUrl: string | null;
  durationMs?: number;
  resolvedSeed?: number;
  width?: number;
  height?: number;
}

interface HistoryItem {
  id: string;
  tool: EmojiTool;
  prompt: string;
  resultUrl: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLS: { id: EmojiTool; label: string; icon: string; desc: string }[] = [
  { id: 'emoji', label: 'Single Emoji', icon: '😀', desc: 'Generate one emoji or icon at a time' },
  { id: 'pack',  label: 'Pack Builder', icon: '📦', desc: 'Generate 4 related emojis from one theme' },
];

const STYLE_PRESETS: { id: StylePreset; label: string; desc: string }[] = [
  { id: 'expressive',  label: 'Expressive', desc: 'Bold, high contrast, clear emotion' },
  { id: 'minimal',     label: 'Minimal',    desc: 'Simple, flat, clean lines' },
  { id: 'blob',        label: 'Blob',       desc: 'Rounded, Discord-style, soft form' },
  { id: 'pixel_emoji', label: 'Pixel',      desc: 'Pixel art, 8-bit style' },
];

const SIZE_OPTIONS: { value: SizeOption; label: string }[] = [
  { value: 32,  label: '32px'  },
  { value: 64,  label: '64px'  },
  { value: 128, label: '128px' },
  { value: 256, label: '256px' },
];

const PLATFORMS: { id: Platform; label: string; hint: string }[] = [
  { id: 'universal', label: 'Universal', hint: '' },
  { id: 'discord',   label: 'Discord',   hint: '96×96 rec.' },
  { id: 'slack',     label: 'Slack',     hint: '128×128 rec.' },
  { id: 'apple',     label: 'Apple',     hint: '256px' },
  { id: 'android',   label: 'Android',   hint: '' },
];

const EXAMPLE_PROMPTS: Record<EmojiTool, string> = {
  emoji: 'laughing face with tears of joy',
  pack:  'weather',
};

const STYLE_PREFIXES: Record<StylePreset, string> = {
  expressive:  'expressive emoji icon, bold cartoon face, single character, high contrast, ',
  minimal:     'minimal flat emoji icon, simple clean shape, flat design, single icon, ',
  blob:        'blob emoji, rounded organic shape, Discord style, soft cute character, single emoji, ',
  pixel_emoji: 'pixel art emoji, 8-bit icon, pixelated face, retro game style, ',
};

const NEG_PROMPT =
  'text, letters, words, complex background, realistic, photographic, multiple characters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPrompt(userPrompt: string, preset: StylePreset, size: SizeOption): string {
  const prefix = STYLE_PREFIXES[preset];
  const suffix = `square format, ${size}px, isolated, no text, no background noise, no border`;
  return `${prefix}${userPrompt}, ${suffix}`;
}

function expandTheme(theme: string): string[] {
  return [
    `${theme} emoji, happy/positive`,
    `${theme} emoji, neutral/calm`,
    `${theme} emoji, surprised/excited`,
    `${theme} emoji, sad/negative`,
  ];
}

function resolveSize(platform: Platform, size: SizeOption): SizeOption {
  if (platform === 'discord') return 64;
  if (platform === 'slack')   return 128;
  if (platform === 'apple')   return 256;
  return size;
}

// ---------------------------------------------------------------------------
// Inner studio component
// ---------------------------------------------------------------------------

function EmojiStudioInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [activeTool, setActiveTool] = useState<EmojiTool>(
    (searchParams.get('tool') as EmojiTool | null) ?? 'emoji'
  );
  const [prompt, setPrompt] = useState(searchParams.get('prompt') ?? EXAMPLE_PROMPTS['emoji']);
  const [stylePreset, setStylePreset] = useState<StylePreset>('expressive');
  const [size, setSize] = useState<SizeOption>(64);
  const [platform, setPlatform] = useState<Platform>('universal');
  const [bgMode, setBgMode] = useState<BgMode>('transparent');
  const [useHD, setUseHD] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [packResults, setPackResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelHistory] = useState<number | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toastSuccess = (msg: string) => { setToast({ msg, type: 'success' }); setTimeout(() => setToast(null), 3500); };
  const toastError   = (msg: string) => { setToast({ msg, type: 'error' });   setTimeout(() => setToast(null), 4000); };

  const switchTool = useCallback((tool: EmojiTool) => {
    setActiveTool(tool);
    setResult(null);
    setPackResults([]);
    setError(null);
    setJobStatus('idle');
    setPrompt(EXAMPLE_PROMPTS[tool]);
  }, []);

  useEffect(() => {
    if (!searchParams.get('prompt')) setPrompt(EXAMPLE_PROMPTS[activeTool]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => stopTimer(), []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || jobStatus === 'running') return;
    setJobStatus('running');
    setError(null);
    setResult(null);
    setPackResults([]);
    setElapsedMs(0);
    startTimer();

    const effectiveSize = resolveSize(platform, size);

    const makeBody = (userPrompt: string, variantIndex = 0) => ({
      tool:        'generate',
      mode:        'emoji',
      prompt:      buildPrompt(userPrompt, stylePreset, effectiveSize),
      _promptBuilt: true,
      negPrompt:   NEG_PROMPT,
      width:       effectiveSize,
      height:      effectiveSize,
      provider:    'pollinations',
      quality:     useHD ? 'hd' : 'standard',
      isPublic,
      stylePreset,
      size:        effectiveSize,
      variantIndex,
      extra: {
        bgMode,
        platform,
      },
    });

    try {
      if (activeTool === 'pack') {
        const subPrompts = expandTheme(prompt.trim());
        const results = await Promise.allSettled(
          subPrompts.map(async (sub, idx) => {
            const res = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(makeBody(sub, idx)),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
            return {
              jobId: data.job?.id ?? 'local',
              resultUrl: data.resultUrl as string | null,
              durationMs: data.durationMs as number | undefined,
              resolvedSeed: data.resolvedSeed as number | undefined,
              width: effectiveSize,
              height: effectiveSize,
            } as GenerationResult;
          })
        );
        const fulfilled = results
          .filter((r): r is PromiseFulfilledResult<GenerationResult> => r.status === 'fulfilled')
          .map(r => r.value);
        setPackResults(fulfilled);
        setJobStatus('succeeded');
        if (fulfilled[0]) {
          setHistory(prev => [{
            id: fulfilled[0].jobId,
            tool: 'pack' as EmojiTool,
            prompt: prompt.trim(),
            resultUrl: fulfilled[0].resultUrl,
            createdAt: new Date().toISOString(),
          }, ...prev].slice(0, 12));
        }
      } else {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(makeBody(prompt.trim())),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        const gen: GenerationResult = {
          jobId: data.job?.id ?? 'local',
          resultUrl: data.resultUrl,
          durationMs: data.durationMs,
          resolvedSeed: data.resolvedSeed,
          width: effectiveSize,
          height: effectiveSize,
        };
        setResult(gen);
        setJobStatus('succeeded');
        setHistory(prev => [{
          id: gen.jobId,
          tool: 'emoji' as EmojiTool,
          prompt: prompt.trim(),
          resultUrl: gen.resultUrl,
          createdAt: new Date().toISOString(),
        }, ...prev].slice(0, 12));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setJobStatus('failed');
    } finally {
      stopTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, activeTool, stylePreset, size, platform, bgMode, useHD, isPublic, jobStatus]);

  // Load history on mount
  useEffect(() => {
    fetch('/api/generate?limit=12&status=succeeded&mode=emoji')
      .then(r => r.ok ? r.json() : null)
      .then((data: { jobs: Array<{ id?: string; prompt: string; tool: string; resultUrl?: string; imageUrl?: string; createdAt: string }> } | null) => {
        if (!data?.jobs) return;
        setHistory(data.jobs.map(j => ({
          id: j.id ?? crypto.randomUUID(),
          tool: (j.tool as EmojiTool) ?? 'emoji',
          prompt: j.prompt,
          resultUrl: j.imageUrl ?? j.resultUrl ?? null,
          createdAt: j.createdAt,
        })));
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerate]);

  const handleDownload = useCallback(async (url: string, suffix = '') => {
    try {
      const slug = prompt.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30);
      const filename = `wokgen-emoji-${activeTool}${suffix ? `-${suffix}` : ''}-${slug}.png`;
      const res  = await fetch(url);
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toastSuccess('Download started');
    } catch { toastError('Download failed'); }
  }, [prompt, activeTool]);

  const displayResult = result ?? (history[selectedHistory ?? -1] ?? null);
  const isPack = activeTool === 'pack';
  const PACK_LABELS = ['Happy / Positive', 'Neutral / Calm', 'Surprised / Excited', 'Sad / Negative'];

  const imgRendering = stylePreset === 'pixel_emoji' ? 'pixelated' : 'auto';

  return (
    <div className="studio-layout">

      {/* Toast */}
      {toast && (
        <div className={`studio-toast studio-toast--${toast.type}`} role="alert">
          {toast.msg}
        </div>
      )}

      {/* ── LEFT PANEL ───────────────────────────────────────────────────────── */}
      <aside className="studio-sidebar">

        {/* Mode header */}
        <div className="studio-mode-header" style={{ '--mode-accent': '#fb923c' } as React.CSSProperties}>
          <span className="studio-mode-label">Emoji Studio</span>
          <QuotaBadge />
          <a
            href="/pixel/studio"
            style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              color: 'var(--text-faint, #555)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint, #555)')}
            title="Switch to Pixel Studio"
          >
            <span style={{ fontSize: 10 }}>✦</span> Pixel
          </a>
        </div>

        {/* Tool tabs */}
        <div className="studio-tool-tabs">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`studio-tool-tab${activeTool === t.id ? ' active' : ''}`}
              onClick={() => switchTool(t.id)}
              title={t.desc}
            >
              <span className="studio-tool-icon">{t.icon}</span>
              <span className="studio-tool-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Prompt */}
        <div className="studio-control-section">
          <label className="studio-label">
            {isPack ? 'Theme' : 'Describe your emoji'}
          </label>
          <textarea
            className="studio-textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={isPack
              ? 'e.g. weather, animals, sports, food'
              : 'e.g. laughing face, fire with sunglasses, robot waving'}
            rows={3}
          />
          {isPack && (
            <p className="studio-hint" style={{ marginTop: 4 }}>
              Will generate 4 emoji variations: happy, neutral, surprised, sad
            </p>
          )}
        </div>

        {/* Style presets */}
        <div className="studio-control-section">
          <label className="studio-label">Style</label>
          <div className="studio-preset-grid studio-preset-grid--sm">
            {STYLE_PRESETS.map(s => (
              <button
                key={s.id}
                className={`studio-preset-btn${stylePreset === s.id ? ' active' : ''}`}
                onClick={() => setStylePreset(s.id)}
                title={s.desc}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="studio-control-section">
          <label className="studio-label">Size</label>
          <div className="studio-preset-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {SIZE_OPTIONS.map(s => (
              <button
                key={s.value}
                className={`studio-preset-btn${size === s.value ? ' active' : ''}`}
                onClick={() => setSize(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="studio-control-section">
          <label className="studio-label">Platform</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.14s',
                  background: platform === p.id ? 'rgba(251,146,60,0.12)' : 'var(--surface-overlay)',
                  border: `1px solid ${platform === p.id ? 'rgba(251,146,60,0.4)' : 'var(--surface-border)'}`,
                  color: platform === p.id ? '#fb923c' : 'var(--text-secondary)',
                  textAlign: 'left',
                }}
              >
                <span>{p.label}</span>
                {p.hint && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {p.hint}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="studio-control-section">
          <label className="studio-label">Background</label>
          <div className="studio-preset-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {([
              { id: 'transparent', label: '🔲 Transparent' },
              { id: 'white',       label: '⬜ White' },
            ] as { id: BgMode; label: string }[]).map(opt => (
              <button
                key={opt.id}
                className={`studio-preset-btn${bgMode === opt.id ? ' active' : ''}`}
                onClick={() => setBgMode(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* HD toggle */}
        <div className="studio-control-section">
          <div className="studio-row studio-row--spaced">
            <label className="studio-label" style={{ margin: 0 }}>
              HD Quality
              <span className="studio-label-opt"> (uses 1 credit)</span>
            </label>
            <button
              className={`toggle-track${useHD ? ' on' : ''}`}
              onClick={() => setUseHD(v => !v)}
              disabled={!session}
              title={session ? undefined : 'Sign in to use HD quality'}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          {!session && (
            <p className="studio-hint">
              <a href="/login" className="link">Sign in</a> to unlock HD quality
            </p>
          )}
        </div>

        {/* Public toggle */}
        {session && (
          <div className="studio-control-section">
            <div className="studio-row studio-row--spaced">
              <label className="studio-label" style={{ margin: 0 }}>Share to Gallery</label>
              <button className={`toggle-track${isPublic ? ' on' : ''}`} onClick={() => setIsPublic(v => !v)}>
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>
        )}

        {/* Generate button */}
        <div className="studio-control-section">
          <button
            className="btn-primary btn-generate"
            onClick={handleGenerate}
            disabled={jobStatus === 'running' || !prompt.trim()}
            style={{ '--btn-accent': '#fb923c' } as React.CSSProperties}
          >
            {jobStatus === 'running'
              ? `Generating… ${(elapsedMs / 1000).toFixed(1)}s`
              : isPack
              ? '✦ Generate Pack (4 emojis)'
              : '✦ Generate Emoji'}
          </button>
          <p className="studio-hint" style={{ textAlign: 'right', marginTop: '0.25rem' }}>⌘↵</p>
        </div>

      </aside>

      {/* ── CANVAS ────────────────────────────────────────────────────────────── */}
      <main className="studio-canvas">

        {/* Error */}
        {jobStatus === 'failed' && error && (
          <div className="studio-error-card">
            <p className="studio-error-title">Generation failed</p>
            <p className="studio-error-msg">{error}</p>
            <button className="btn-ghost btn-sm" onClick={handleGenerate}>Retry</button>
          </div>
        )}

        {/* Pack 2×2 grid */}
        {isPack && packResults.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            maxWidth: 520,
            width: '100%',
          }}>
            {packResults.map((r, i) => (
              r.resultUrl ? (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{
                    background: bgMode === 'white' ? '#fff' : 'var(--surface-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                    minHeight: 160,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.resultUrl}
                      alt={PACK_LABELS[i]}
                      style={{
                        imageRendering: imgRendering,
                        maxWidth: 128,
                        maxHeight: 128,
                      }}
                    />
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--surface-border)',
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {PACK_LABELS[i]}
                    </span>
                    <button
                      className="btn-ghost btn-xs"
                      onClick={() => r.resultUrl && handleDownload(r.resultUrl, String(i + 1))}
                      title="Download"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ) : null
            ))}
          </div>
        )}

        {/* Single emoji output */}
        {!isPack && jobStatus !== 'idle' && (
          <div className="studio-output-frame">
            {jobStatus === 'running' && (
              <div className="studio-output-loading">
                <div className="studio-spinner" />
                <span>Generating… {(elapsedMs / 1000).toFixed(1)}s</span>
              </div>
            )}
            {displayResult?.resultUrl && jobStatus !== 'running' && (
              <>
                <div style={{
                  background: bgMode === 'white' ? '#fff' : 'var(--surface-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 32,
                  minHeight: 240,
                  backgroundImage: bgMode === 'transparent'
                    ? 'linear-gradient(45deg, #1a1a2e 25%, transparent 25%), linear-gradient(-45deg, #1a1a2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a2e 75%), linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)'
                    : 'none',
                  backgroundSize: bgMode === 'transparent' ? '16px 16px' : 'auto',
                  backgroundPosition: bgMode === 'transparent' ? '0 0, 0 8px, 8px -8px, -8px 0px' : 'auto',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayResult.resultUrl}
                    alt="Generated emoji"
                    style={{
                      imageRendering: imgRendering,
                      maxWidth: 256,
                      maxHeight: 256,
                    }}
                  />
                </div>
                <div className="studio-output-toolbar">
                  {result?.width && (
                    <span className="studio-output-size">
                      {result.width} × {result.height}
                    </span>
                  )}
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => displayResult.resultUrl && handleDownload(displayResult.resultUrl)}
                  >
                    ↓ Download
                  </button>
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      if (displayResult.resultUrl) {
                        navigator.clipboard.writeText(displayResult.resultUrl);
                        toastSuccess('URL copied');
                      }
                    }}
                  >
                    Copy URL
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Idle state */}
        {jobStatus === 'idle' && (
          <div className="studio-idle">
            <div className="studio-idle-icon">😀</div>
            <p className="studio-idle-title">Emoji Studio</p>
            <p className="studio-idle-desc">
              {TOOLS.find(t => t.id === activeTool)?.desc}
            </p>
            <div className="studio-idle-chips">
              {[
                'laughing face with tears of joy',
                'fire with sunglasses',
                'robot waving hello',
                'hearts and sparkles',
              ].map(ex => (
                <button
                  key={ex}
                  className="studio-chip"
                  onClick={() => { setPrompt(ex); }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── HISTORY ───────────────────────────────────────────────────────────── */}
      <aside className="studio-history">
        <div className="studio-history-header">
          <span className="studio-history-title">Recent</span>
          <a
            href="/emoji/gallery"
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              marginLeft: 'auto',
            }}
          >
            Gallery →
          </a>
        </div>
        <div className="studio-history-list">
          {history.length === 0 && (
            <p className="studio-history-empty">Generated emojis appear here</p>
          )}
          {history.map((item, idx) => (
            <button
              key={item.id}
              className={`studio-history-item${selectedHistory === idx ? ' active' : ''}`}
              onClick={() => {
                setResult({ jobId: item.id, resultUrl: item.resultUrl });
                setSelHistory(idx);
                setJobStatus('succeeded');
              }}
            >
              {item.resultUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.resultUrl}
                  alt=""
                  className="studio-history-thumb"
                  style={{ imageRendering: 'auto' }}
                />
              ) : (
                <div className="studio-history-thumb studio-history-thumb--empty">😀</div>
              )}
              <div className="studio-history-meta">
                <span className="studio-history-tool">{item.tool}</span>
                <span className="studio-history-prompt">{item.prompt.slice(0, 28)}…</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <EralSidebar mode="emoji" tool={activeTool} prompt={prompt} />
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function EmojiStudio() {
  return (
    <Suspense fallback={<div className="studio-layout" />}>
      <EmojiStudioInner />
    </Suspense>
  );
}
