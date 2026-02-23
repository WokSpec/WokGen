'use client';




import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import WorkspaceSelector from '@/app/_components/WorkspaceSelector';
import { EralSidebar } from '@/app/_components/EralSidebar';
import { QuotaBadge } from '@/components/quota-badge';
import { ColorPalette } from '@/components/color-palette';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VectorTool = 'icon' | 'illustration';
type StylePreset = 'outline' | 'filled' | 'rounded' | 'sharp';
type BgMode = 'transparent' | 'white' | 'dark';
type JobStatus = 'idle' | 'running' | 'succeeded' | 'failed';

interface GenerationResult {
  jobId: string;
  resultUrl: string | null;
  durationMs?: number;
  width?: number;
  height?: number;
  guestDownloadGated?: boolean;
}

interface HistoryItem {
  id: string;
  tool: VectorTool;
  prompt: string;
  resultUrl: string | null;
  size: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLS: { id: VectorTool; label: string; icon?: string; desc: string }[] = [
  { id: 'icon',         label: 'Icon Generator', desc: 'Generate icons and symbols at precise sizes' },
  { id: 'illustration', label: 'Illustration',   desc: 'Generate vector-style spot illustrations' },
];

const PRESETS: { id: StylePreset; label: string; desc: string }[] = [
  { id: 'outline', label: 'Outline', desc: 'Line icons, consistent stroke width' },
  { id: 'filled',  label: 'Filled',  desc: 'Solid shapes, flat design' },
  { id: 'rounded', label: 'Rounded', desc: 'Soft corners, friendly' },
  { id: 'sharp',   label: 'Sharp',   desc: 'Angular, geometric precision' },
];

const ICON_SIZES = [24, 32, 48, 64, 128, 256] as const;
const ILLUSTRATION_SIZES = [256, 512, 768] as const;

const BATCH_COUNTS = [1, 2, 4] as const;

const EXAMPLE_PROMPTS: Record<VectorTool, string> = {
  icon:         'Settings gear icon, minimal, crisp lines',
  illustration: 'Flat illustration of a developer at a laptop with coffee',
};

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildVectorPrompt(
  rawPrompt: string,
  tool: VectorTool,
  preset: StylePreset,
  size: number,
  bgMode: BgMode,
  colorHint: string,
): string {
  let prefix = '';
  const suffix = ', isolated, vector art, no gradients';

  if (tool === 'icon') {
    if (preset === 'outline') {
      prefix = `minimal flat icon, ${size}px, crisp outline, ${colorHint ? '' : 'monochrome '}stroke, SVG style, white background, centered, `;
    } else if (preset === 'filled') {
      prefix = `filled icon, flat design, ${size}px, solid vector shape, clean silhouette, `;
    } else if (preset === 'rounded') {
      prefix = `rounded icon, ${size}px, soft corners, friendly style, flat design, `;
    } else {
      prefix = `sharp icon, ${size}px, angular, precise geometry, flat design, `;
    }
  } else {
    prefix = 'vector illustration, flat style, spot illustration, minimal, clean composition, ';
  }

  let bgToken = '';
  if (bgMode === 'transparent') bgToken = ', transparent background';
  else if (bgMode === 'white')   bgToken = ', white background clean';
  else                           bgToken = ', dark background';

  let colorToken = '';
  if (colorHint.trim()) {
    colorToken = `, color palette: ${colorHint.trim()}`;
  }

  return `${prefix}${rawPrompt.trim()}${suffix}${bgToken}${colorToken}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid var(--surface-border)',
        borderTopColor: '#34d399',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Inner studio component (wrapped in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

function VectorStudioInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // ── Tool & controls ──────────────────────────────────────────────────────
  const [activeTool, setActiveTool]   = useState<VectorTool>(
    (searchParams.get('tool') as VectorTool | null) ?? 'icon',
  );
  const [prompt, setPrompt]           = useState(searchParams.get('prompt') ?? EXAMPLE_PROMPTS['icon']);
  const [preset, setPreset]           = useState<StylePreset>('outline');
  const [iconSize, setIconSize]       = useState<number>(64);
  const [illustSize, setIllustSize]   = useState<number>(512);
  const [bgMode, setBgMode]           = useState<BgMode>('white');
  const [colorHint, setColorHint]     = useState('');
  const [useHD, setUseHD]             = useState(false);
  const [isPublic, setIsPublic]       = useState(false);
  const [batchCount, setBatchCount]   = useState<1 | 2 | 4>(1);

  // Workspace
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('wokgen:workspace:vector') ?? null;
    return null;
  });

  // ── Generation state ─────────────────────────────────────────────────────
  const [jobStatus, setJobStatus]     = useState<JobStatus>('idle');
  const [results, setResults]         = useState<GenerationResult[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [elapsedMs, setElapsedMs]     = useState(0);

  // ── History ───────────────────────────────────────────────────────────────
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelHistory] = useState<number | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toastSuccess = (msg: string) => { setToast({ msg, type: 'success' }); setTimeout(() => setToast(null), 3500); };
  const toastError   = (msg: string) => { setToast({ msg, type: 'error' });   setTimeout(() => setToast(null), 4000); };

  // ── Bg remove state ──────────────────────────────────────────────────────
  const [bgRemoving, setBgRemoving]   = useState(false);
  const [displayUrl, setDisplayUrl]   = useState<string | null>(null);

  // ── Tool switch ───────────────────────────────────────────────────────────
  const switchTool = useCallback((tool: VectorTool) => {
    setActiveTool(tool);
    setResults([]);
    setError(null);
    setJobStatus('idle');
    setPrompt(EXAMPLE_PROMPTS[tool]);
  }, []);

  // Init prompt
  useEffect(() => {
    if (!searchParams.get('prompt')) setPrompt(EXAMPLE_PROMPTS[activeTool]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => stopTimer(), []);

  // ── Dimensions ───────────────────────────────────────────────────────────
  const getSize = () => activeTool === 'icon' ? iconSize : illustSize;

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || jobStatus === 'running') return;
    setJobStatus('running');
    setError(null);
    setResults([]);
    setElapsedMs(0);
    startTimer();

    const size = getSize();
    const enhancedPrompt = buildVectorPrompt(prompt, activeTool, preset, size, bgMode, colorHint);

    const body = {
      prompt: enhancedPrompt,
      _promptBuilt: true,
      tool: activeTool,
      mode: 'vector',
      width: size,
      height: size,
      steps: 20,
      guidance: 7.0,
      provider: useHD ? 'replicate' : 'pollinations',
      useHD,
      isPublic,
      stylePreset: preset,
      negPrompt: 'blurry, photorealistic, complex background, messy, rough, sketch',
      size,
      ...(activeWorkspaceId ? { projectId: activeWorkspaceId } : {}),
    };

    try {
      const indices = Array.from({ length: batchCount }, (_, i) => i);
      const settled = await Promise.allSettled(
        indices.map(async (variantIndex) => {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, variantIndex }),
          });
          const data = await res.json() as { ok?: boolean; error?: string; job?: { id?: string }; resultUrl?: string; durationMs?: number; guestDownloadGated?: boolean };
          if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
          return {
            jobId: data.job?.id ?? crypto.randomUUID(),
            resultUrl: data.resultUrl ?? null,
            durationMs: data.durationMs,
            width: size,
            height: size,
            guestDownloadGated: data.guestDownloadGated,
          } as GenerationResult;
        }),
      );

      const fulfilled = settled
        .filter((r): r is PromiseFulfilledResult<GenerationResult> => r.status === 'fulfilled')
        .map(r => r.value);

      if (fulfilled.length === 0) {
        const firstErr = settled.find((r): r is PromiseRejectedResult => r.status === 'rejected');
        throw firstErr?.reason instanceof Error ? firstErr.reason : new Error('Generation failed');
      }

      setResults(fulfilled);
      setJobStatus('succeeded');

      if (fulfilled[0]) {
        setHistory(prev => [{
          id: fulfilled[0].jobId,
          tool: activeTool,
          prompt: prompt.trim(),
          resultUrl: fulfilled[0].resultUrl,
          size,
          createdAt: new Date().toISOString(),
        }, ...prev].slice(0, 10));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setJobStatus('failed');
    } finally {
      stopTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, activeTool, preset, iconSize, illustSize, bgMode, colorHint, useHD, isPublic, batchCount, activeWorkspaceId, jobStatus]);

  // ── Load history on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/generate?limit=10&status=succeeded&mode=vector')
      .then(r => r.ok ? r.json() : null)
      .then((data: { jobs: Array<{ id?: string; prompt: string; tool: string; resultUrl?: string; imageUrl?: string; size?: number; width?: number; createdAt: string }> } | null) => {
        if (!data?.jobs) return;
        setHistory(data.jobs.map(j => ({
          id: j.id ?? crypto.randomUUID(),
          tool: (j.tool as VectorTool) ?? 'icon',
          prompt: j.prompt,
          resultUrl: j.imageUrl ?? j.resultUrl ?? null,
          size: j.size ?? j.width ?? 64,
          createdAt: j.createdAt,
        })));
      })
      .catch(() => {});
  }, []);

  // ── Load user isPublic default ────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: { publicGenerationsDefault?: boolean } | null) => { if (d?.publicGenerationsDefault) setIsPublic(true); })
      .catch(() => {});
  }, []);

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
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

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async (url: string, idx = 0) => {
    try {
      const slug = prompt.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30);
      const suffix = batchCount > 1 ? `-${idx + 1}` : '';
      const filename = `wokgen-vector-${activeTool}-${slug}${suffix}.png`;
      const res  = await fetch(url);
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toastSuccess('Download started');
    } catch { toastError('Download failed'); }
  }, [prompt, activeTool, batchCount]);

  // ── Displayed result ──────────────────────────────────────────────────────
  const primaryResult  = results[0] ?? null;
  const historyDisplay = selectedHistory !== null ? history[selectedHistory] ?? null : null;
  const displayResult  = primaryResult ?? (historyDisplay ? { jobId: historyDisplay.id, resultUrl: historyDisplay.resultUrl, width: historyDisplay.size, height: historyDisplay.size } : null);

  // Keep displayUrl in sync (allows bg-remove override)
  useEffect(() => { setDisplayUrl(displayResult?.resultUrl ?? null); }, [displayResult?.resultUrl]);

  const handleBgRemove = useCallback(async (url: string) => {
    setBgRemoving(true);
    try {
      const res = await fetch('/api/tools/bg-remove', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.error ?? 'BG removal failed'); return; }
      setDisplayUrl(`data:image/png;base64,${data.resultBase64}`);
      toastSuccess('Background removed');
    } catch { toastError('BG removal failed'); }
    finally { setBgRemoving(false); }
  }, [toastError, toastSuccess]);

  const ACCENT = '#34d399';

  return (
    <div className="studio-layout">

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`studio-toast studio-toast--${toast.type}`} role="alert">
          {toast.msg}
        </div>
      )}

      {/* ────────────────────────── LEFT SIDEBAR ────────────────────────────── */}
      <aside className="studio-sidebar">

        {/* Mode header */}
        <div className="studio-mode-header" style={{ '--mode-accent': ACCENT } as React.CSSProperties}>
          <span className="studio-mode-label" style={{ color: ACCENT }}>Vector Studio</span>
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
            Pixel
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
              style={activeTool === t.id ? { '--tab-accent': ACCENT } as React.CSSProperties : undefined}
            >
              <span className="studio-tool-icon">{t.icon}</span>
              <span className="studio-tool-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Workspace selector */}
        <div className="studio-control-section" style={{ paddingBottom: 0 }}>
          <WorkspaceSelector
            mode="vector"
            activeWorkspaceId={activeWorkspaceId}
            onChange={setActiveWorkspaceId}
          />
        </div>

        {/* Prompt */}
        <div className="studio-control-section">
          <label className="studio-label">Prompt</label>
          <textarea
            className="studio-textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={EXAMPLE_PROMPTS[activeTool]}
            rows={4}
          />
        </div>

        {/* Style presets */}
        <div className="studio-control-section">
          <label className="studio-label">Style</label>
          <div className="studio-preset-grid studio-preset-grid--sm">
            {PRESETS.map(p => (
              <button
                key={p.id}
                className={`studio-preset-btn${preset === p.id ? ' active' : ''}`}
                onClick={() => setPreset(p.id)}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="studio-control-section">
          <label className="studio-label">Size (px)</label>
          <div className="studio-preset-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {(activeTool === 'icon' ? ICON_SIZES : ILLUSTRATION_SIZES).map(s => {
              const active = activeTool === 'icon' ? iconSize === s : illustSize === s;
              return (
                <button
                  key={s}
                  className={`studio-preset-btn${active ? ' active' : ''}`}
                  onClick={() => activeTool === 'icon' ? setIconSize(s) : setIllustSize(s)}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color hint */}
        <div className="studio-control-section">
          <label className="studio-label">
            Color Hint <span className="studio-label-opt">(optional)</span>
          </label>
          <input
            className="studio-input"
            type="text"
            value={colorHint}
            onChange={e => setColorHint(e.target.value)}
            placeholder="e.g. indigo and slate"
          />
        </div>

        {/* Background */}
        <div className="studio-control-section">
          <label className="studio-label">Background</label>
          <div className="studio-preset-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {([
              { id: 'transparent', label: 'Clear' },
              { id: 'white',       label: '⬜ White' },
              { id: 'dark',        label: '⬛ Dark'  },
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

        {/* Batch count */}
        <div className="studio-control-section">
          <label className="studio-label">Batch</label>
          <div className="studio-preset-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {BATCH_COUNTS.map(n => (
              <button
                key={n}
                className={`studio-preset-btn${batchCount === n ? ' active' : ''}`}
                onClick={() => setBatchCount(n as 1 | 2 | 4)}
              >
                {n === 1 ? '×1' : n === 2 ? '×2' : '×4'}
              </button>
            ))}
          </div>
        </div>

        {/* HD quality */}
        <div className="studio-control-section">
          <div className="studio-row studio-row--spaced">
            <label className="studio-label" style={{ margin: 0 }}>
              HD Quality
              <span className="studio-label-opt"> (uses 2 credits)</span>
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

        {/* Share to gallery */}
        {session && (
          <div className="studio-control-section">
            <div className="studio-row studio-row--spaced">
              <label className="studio-label" style={{ margin: 0 }}>Share to Gallery</label>
              <button
                className={`toggle-track${isPublic ? ' on' : ''}`}
                onClick={() => setIsPublic(v => !v)}
              >
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
            style={jobStatus !== 'running' ? { background: ACCENT, borderColor: ACCENT } : undefined}
          >
            {jobStatus === 'running'
              ? `Generating… ${(elapsedMs / 1000).toFixed(1)}s`
              : batchCount > 1
              ? `Generate ×${batchCount}`
              : 'Generate'}
          </button>
          <p className="studio-hint" style={{ textAlign: 'right', marginTop: '0.25rem' }}>⌘↵</p>
        </div>

      </aside>

      {/* ─────────────────────────── CANVAS ─────────────────────────────────── */}
      <main className="studio-canvas">

        {/* Error */}
        {jobStatus === 'failed' && error && (
          <div className="studio-error-card">
            <p className="studio-error-title">Generation failed</p>
            <p className="studio-error-msg">{error}</p>
            <button className="btn-ghost btn-sm" onClick={handleGenerate}>Retry</button>
          </div>
        )}

        {/* Batch grid */}
        {jobStatus !== 'idle' && results.length > 1 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: results.length === 4 ? 'repeat(2, 1fr)' : `repeat(${results.length}, 1fr)`,
              gap: 12,
              padding: 16,
              maxWidth: 640,
              width: '100%',
            }}
          >
            {results.map((r, i) =>
              r.resultUrl ? (
                <div
                  key={r.jobId}
                  style={{
                    position: 'relative',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.resultUrl}
                    alt={`Variant ${i + 1}`}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', display: 'block' }}
                  />
                  {r.guestDownloadGated ? (
                    <a
                      href="/api/auth/signin"
                      style={{
                        position: 'absolute', bottom: 6, right: 6,
                        padding: '2px 6px', borderRadius: 4,
                        background: '#f59e0b18', border: '1px solid #f59e0b55',
                        color: '#f59e0b', fontSize: 10, fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      Sign in →
                    </a>
                  ) : (
                    <button
                      className="btn-ghost btn-xs"
                      style={{ position: 'absolute', bottom: 6, right: 6 }}
                      onClick={() => r.resultUrl && handleDownload(r.resultUrl, i)}
                    >
                      ↓
                    </button>
                  )}
                </div>
              ) : null,
            )}
          </div>
        )}

        {/* Single output */}
        {jobStatus !== 'idle' && results.length <= 1 && (
          <div className="studio-output-frame">
            {jobStatus === 'running' && (
              <div className="studio-output-loading">
                <div className="studio-spinner" style={{ borderTopColor: ACCENT }} />
                <span>Generating… {(elapsedMs / 1000).toFixed(1)}s</span>
              </div>
            )}
            {displayResult?.resultUrl && jobStatus !== 'running' && (
              <>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                    background: bgMode === 'dark' ? '#0d0d14' : bgMode === 'white' ? '#ffffff' : 'repeating-conic-gradient(#333 0% 25%, #1a1a2a 0% 50%) 0 0 / 20px 20px',
                    minHeight: 300,
                    borderRadius: '8px 8px 0 0',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayUrl ?? displayResult.resultUrl}
                    alt="Generated vector asset"
                    style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', imageRendering: 'auto' }}
                  />
                  <button
                    onClick={() => handleBgRemove(displayUrl ?? displayResult.resultUrl!)}
                    disabled={bgRemoving}
                    style={{
                      position: 'absolute', top: 8, right: 8, opacity: 0,
                      transition: 'opacity 0.15s', fontSize: '0.72rem', padding: '3px 8px',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 4, color: '#fff', cursor: bgRemoving ? 'wait' : 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                    title="Remove background"
                  >
                    {bgRemoving ? 'Removing…' : 'Remove BG'}
                  </button>
                </div>
                {/* Color palette */}
                {(displayUrl ?? displayResult.resultUrl) && (
                  <ColorPalette imageUrl={displayUrl ?? displayResult.resultUrl!} />
                )}
                <div className="studio-output-toolbar">
                  {displayResult.width && (
                    <span className="studio-output-size">
                      {displayResult.width} × {displayResult.height}
                    </span>
                  )}
                  {displayResult?.guestDownloadGated ? (
                    <a
                      href="/api/auth/signin"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: '#f59e0b18',
                        border: '1px solid #f59e0b55',
                        color: '#f59e0b',
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Sign in to download →
                    </a>
                  ) : (
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => handleDownload(displayUrl ?? displayResult.resultUrl!)}
                    >
                      ↓ Download
                    </button>
                  )}
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      const u = displayUrl ?? displayResult.resultUrl;
                      if (u) { navigator.clipboard.writeText(u).catch(() => null); toastSuccess('URL copied'); }
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => { navigator.clipboard.writeText(prompt).catch(() => null); toastSuccess('Prompt copied'); }}
                  >
                    Copy Prompt
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Idle state */}
        {jobStatus === 'idle' && (
          <div className="studio-idle">
            <div className="studio-idle-icon" style={{ color: ACCENT }}>
              {''}
            </div>
            <p className="studio-idle-title">Vector Studio</p>
            <p className="studio-idle-desc">
              {TOOLS.find(t => t.id === activeTool)?.desc}
            </p>
            <div className="studio-idle-chips">
              {Object.entries(EXAMPLE_PROMPTS).map(([tool, p]) => (
                <button
                  key={tool}
                  className="studio-chip"
                  onClick={() => {
                    switchTool(tool as VectorTool);
                    setPrompt(p);
                  }}
                >
                  {p.slice(0, 55)}…
                </button>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ─────────────────────────── HISTORY ─────────────────────────────────── */}
      <aside className="studio-history">
        <div className="studio-history-header">
          <span className="studio-history-title">History</span>
          <a
            href="/vector/gallery"
            style={{
              marginLeft: 'auto',
              fontSize: '0.68rem',
              color: ACCENT,
              textDecoration: 'none',
              opacity: 0.8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
          >
            Gallery →
          </a>
        </div>
        <div className="studio-history-list">
          {history.length === 0 && (
            <p className="studio-history-empty">Generated assets appear here</p>
          )}
          {history.map((item, idx) => (
            <button
              key={item.id}
              className={`studio-history-item${selectedHistory === idx ? ' active' : ''}`}
              onClick={() => {
                setResults([{ jobId: item.id, resultUrl: item.resultUrl, width: item.size, height: item.size }]);
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
                <div className="studio-history-thumb studio-history-thumb--empty">◈</div>
              )}
              <div className="studio-history-meta">
                <span className="studio-history-tool">{item.tool}</span>
                <span className="studio-history-prompt">{item.prompt.slice(0, 32)}…</span>
                <span className="studio-history-size">{item.size}px</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <EralSidebar mode="vector" tool={activeTool} prompt={prompt} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export (wrapped in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function VectorStudio() {
  return (
    <Suspense fallback={<div className="studio-layout" />}>
      <VectorStudioInner />
    </Suspense>
  );
}
