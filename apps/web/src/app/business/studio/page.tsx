'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import type {
  BusinessTool,
  BusinessStyle,
  BusinessMood,
  BusinessPlatform,
} from '@/lib/prompt-builder-business';
import { PLATFORM_DIMENSIONS } from '@/lib/prompt-builder-business';
import WorkspaceSelector from '@/app/_components/WorkspaceSelector';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GenerationResult {
  jobId:        string;
  resultUrl:    string | null;
  resultUrls?:  string[] | null;
  durationMs?:  number;
  resolvedSeed?: number;
  width?:       number;
  height?:      number;
}

interface HistoryItem {
  id: string;
  tool: BusinessTool;
  prompt: string;
  resultUrl: string | null;
  width?: number;
  height?: number;
  createdAt: string;
}

type JobStatus = 'idle' | 'running' | 'succeeded' | 'failed';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOOLS: { id: BusinessTool; label: string; icon: string; desc: string }[] = [
  { id: 'logo',       label: 'Logo Mark',        icon: '⬛', desc: 'Brand symbols and marks' },
  { id: 'brand-kit',  label: 'Brand Kit (4×)',   icon: '🎨', desc: 'Full 4-image brand set' },
  { id: 'slide',      label: 'Slide Visual',     icon: '📊', desc: '16:9 presentation backgrounds' },
  { id: 'social',     label: 'Social Banner',    icon: '📱', desc: 'Platform-optimised sizes' },
  { id: 'web-hero',   label: 'Hero Image',       icon: '🌐', desc: 'Website hero backgrounds' },
];

const STYLES: { id: BusinessStyle; label: string }[] = [
  { id: 'minimal_flat',        label: 'Minimal Flat' },
  { id: 'bold_geometric',      label: 'Bold Geometric' },
  { id: 'corporate_clean',     label: 'Corporate' },
  { id: 'photography_overlay', label: 'Photography' },
  { id: 'monochrome',          label: 'Monochrome' },
  { id: 'gradient_modern',     label: 'Gradient' },
  { id: 'tech_dark',           label: 'Tech Dark' },
  { id: 'warm_brand',          label: 'Warm Brand' },
];

const MOODS: { id: BusinessMood; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'playful',      label: 'Playful' },
  { id: 'bold',         label: 'Bold' },
  { id: 'minimal',      label: 'Minimal' },
  { id: 'luxury',       label: 'Luxury' },
  { id: 'technical',    label: 'Technical' },
];

const PLATFORMS: { id: BusinessPlatform; label: string; size: string; icon: string }[] = [
  { id: 'og_image',         label: 'OG / Meta',         size: '1200×630',  icon: '🔗' },
  { id: 'twitter_header',   label: 'X/Twitter Header',  size: '1500×500',  icon: '𝕏' },
  { id: 'twitter_post',     label: 'X/Twitter Post',    size: '1080×1080', icon: '𝕏' },
  { id: 'instagram_square', label: 'Instagram Post',    size: '1080×1080', icon: '📸' },
  { id: 'instagram_story',  label: 'Instagram Story',   size: '1080×1920', icon: '📲' },
  { id: 'linkedin_banner',  label: 'LinkedIn Banner',   size: '1584×396',  icon: '💼' },
  { id: 'youtube_art',      label: 'YouTube Art',       size: '2560×1440', icon: '▶' },
];

const SLIDE_FORMATS = [
  { id: '16:9',  label: 'Widescreen 16:9', width: 1920, height: 1080 },
  { id: '4:3',   label: 'Standard 4:3',   width: 1024, height: 768  },
  { id: '1:1',   label: 'Square',         width: 1024, height: 1024 },
];

const INDUSTRIES = [
  'Tech', 'Finance', 'Health', 'E-commerce', 'Creative', 'Food & Beverage',
  'Real Estate', 'Education', 'SaaS', 'Consulting', 'Media', 'Startup',
];

const EXAMPLE_PROMPTS: Record<BusinessTool, string> = {
  'logo':      'Modern tech startup focused on AI security, minimal, trustworthy',
  'brand-kit': 'Creative agency specializing in digital design, bold and colorful',
  'slide':     'SaaS product launch, dark tech style, innovation keynote',
  'social':    'Product launch announcement for a productivity app, minimal flat',
  'web-hero':  'Developer tools company homepage, dark tech background, clean',
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Business Studio Component (inner — needs Suspense for useSearchParams)
// ---------------------------------------------------------------------------
function BusinessStudioInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // ── Tool & controls state ──────────────────────────────────────────────────
  const [activeTool, setActiveTool]     = useState<BusinessTool>(
    (searchParams.get('tool') as BusinessTool | null) ?? 'logo'
  );
  const [prompt, setPrompt]             = useState(searchParams.get('prompt') ?? '');
  const [style, setStyle]               = useState<BusinessStyle>('corporate_clean');
  const [mood, setMood]                 = useState<BusinessMood>('professional');
  const [industry, setIndustry]         = useState('');
  const [colorDirection, setColorDir]   = useState('');
  const [platform, setPlatform]         = useState<BusinessPlatform>('og_image');
  const [slideFormat, setSlideFormat]   = useState(SLIDE_FORMATS[0]);
  const [logoBg, setLogoBg]             = useState<'white' | 'dark' | 'transparent'>('white');
  const [useHD, setUseHD]               = useState(false);
  const [isPublic, setIsPublic]         = useState(false);

  // Workspace
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('wokgen:workspace:business') ?? null;
    return null;
  });

  // ── Generation state ──────────────────────────────────────────────────────
  const [jobStatus, setJobStatus]       = useState<JobStatus>('idle');
  const [result, setResult]             = useState<GenerationResult | null>(null);
  const [brandKitResults, setBrandKitResults] = useState<GenerationResult[]>([]);
  const [error, setError]               = useState<string | null>(null);
  const [elapsedMs, setElapsedMs]       = useState(0);

  // ── History ───────────────────────────────────────────────────────────────
  const [history, setHistory]           = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelHistory] = useState<number | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toastSuccess = (msg: string) => { setToast({ msg, type: 'success' }); setTimeout(() => setToast(null), 3500); };
  const toastError   = (msg: string) => { setToast({ msg, type: 'error' });   setTimeout(() => setToast(null), 4000); };

  // ── Tool switch — reset relevant state ───────────────────────────────────
  const switchTool = useCallback((tool: BusinessTool) => {
    setActiveTool(tool);
    setResult(null);
    setBrandKitResults([]);
    setError(null);
    setJobStatus('idle');
    setPrompt(EXAMPLE_PROMPTS[tool]);
  }, []);

  // Init prompt
  // Only set default prompt if not provided via URL param
  useEffect(() => {
    if (!searchParams.get('prompt')) setPrompt(EXAMPLE_PROMPTS[activeTool]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => stopTimer(), []);

  // ── Determine width/height for current tool ───────────────────────────────
  const getToolDimensions = () => {
    if (activeTool === 'social') {
      const dims = PLATFORM_DIMENSIONS[platform];
      return { width: dims.width, height: dims.height };
    }
    if (activeTool === 'slide') {
      return { width: slideFormat.width, height: slideFormat.height };
    }
    if (activeTool === 'logo') return { width: 512, height: 512 };
    if (activeTool === 'web-hero') return { width: 1920, height: 1080 };
    return { width: 1024, height: 1024 };
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || jobStatus === 'running') return;
    setJobStatus('running');
    setError(null);
    setResult(null);
    setBrandKitResults([]);
    setElapsedMs(0);
    startTimer();

    const dims = getToolDimensions();

    const body = {
      tool:           activeTool === 'brand-kit' ? 'generate' : activeTool,
      mode:           'business',
      prompt:         prompt.trim(),
      style,
      mood,
      industry:       industry.trim() || undefined,
      colorDirection: colorDirection.trim() || undefined,
      platform:       activeTool === 'social' ? platform : undefined,
      width:          dims.width,
      height:         dims.height,
      quality:        useHD ? 'hd' : 'standard',
      isPublic,
      ...(activeWorkspaceId ? { projectId: activeWorkspaceId } : {}),
      // Business-specific extra params passed through
      extra: {
        businessTool: activeTool,
        businessStyle: style,
        businessMood: mood,
        businessPlatform: activeTool === 'social' ? platform : undefined,
        logoBg: activeTool === 'logo' ? logoBg : undefined,
      },
    };

    try {
      if (activeTool === 'brand-kit') {
        // Fire 4 parallel requests with brandKitIndex 1-4
        const results = await Promise.allSettled(
          [1, 2, 3, 4].map(async (idx) => {
            const res = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...body, extra: { ...body.extra, brandKitIndex: idx } }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
            return { jobId: data.job?.id ?? 'local', resultUrl: data.resultUrl, width: dims.width, height: dims.height } as GenerationResult;
          })
        );
        const fulfilled = results
          .filter((r): r is PromiseFulfilledResult<GenerationResult> => r.status === 'fulfilled')
          .map(r => r.value);
        setBrandKitResults(fulfilled);
        setJobStatus('succeeded');
        if (fulfilled[0]) {
          setHistory(prev => [{
            id: fulfilled[0].jobId, tool: activeTool,
            prompt: prompt.trim(), resultUrl: fulfilled[0].resultUrl,
            width: dims.width, height: dims.height, createdAt: new Date().toISOString(),
          }, ...prev].slice(0, 30));
        }
      } else {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        const gen: GenerationResult = {
          jobId: data.job?.id ?? 'local', resultUrl: data.resultUrl,
          durationMs: data.durationMs, resolvedSeed: data.resolvedSeed,
          width: dims.width, height: dims.height,
        };
        setResult(gen);
        setJobStatus('succeeded');
        setHistory(prev => [{
          id: gen.jobId, tool: activeTool,
          prompt: prompt.trim(), resultUrl: gen.resultUrl,
          width: dims.width, height: dims.height, createdAt: new Date().toISOString(),
        }, ...prev].slice(0, 30));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setJobStatus('failed');
    } finally {
      stopTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, activeTool, style, mood, industry, colorDirection, platform, slideFormat, useHD, isPublic, jobStatus]);

  // ── Load history from API on mount ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/generate?limit=20&status=succeeded&mode=business')
      .then(r => r.ok ? r.json() : null)
      .then((data: { jobs: Array<{ id?: string; prompt: string; tool: string; resultUrl?: string; imageUrl?: string; width?: number; height?: number; createdAt: string }> } | null) => {
        if (!data?.jobs) return;
        const items = data.jobs.map(j => ({
          id: j.id ?? crypto.randomUUID(),
          tool: (j.tool as BusinessTool) ?? 'logo',
          prompt: j.prompt,
          resultUrl: j.imageUrl ?? j.resultUrl ?? '',
          width: j.width ?? 1024,
          height: j.height ?? 1024,
          createdAt: j.createdAt,
        }));
        setHistory(items);
      })
      .catch(() => { /* silently ignore — history isn't critical */ });
  }, []);

  // ── Init isPublic from user's default preference ───────────────────────────
  useEffect(() => {
    fetch('/api/user/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.publicGenerationsDefault) setIsPublic(true); })
      .catch(() => {});
  }, []);

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault(); handleGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerate]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async (url: string, suffix = '') => {
    try {
      const slug = prompt.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30);
      const filename = `wokgen-business-${activeTool}${suffix ? `-${suffix}` : ''}-${slug}.png`;
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

  // ── Displayed output image ────────────────────────────────────────────────
  const displayResult = result ?? (history[selectedHistory ?? -1] ?? null);
  const isBrandKit    = activeTool === 'brand-kit';

  return (
    <div className="studio-layout">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`studio-toast studio-toast--${toast.type}`} role="alert">
          {toast.msg}
        </div>
      )}

      {/* ────────────────────────────── LEFT PANEL ──────────────────────────── */}
      <aside className="studio-sidebar">

        {/* Mode identifier */}
        <div className="studio-mode-header" style={{ '--mode-accent': '#60a5fa' } as React.CSSProperties}>
          <span className="studio-mode-label">Business Studio</span>
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

        {/* Workspace selector */}
        <div className="studio-control-section" style={{ paddingBottom: 0 }}>
          <WorkspaceSelector
            mode="business"
            activeWorkspaceId={activeWorkspaceId}
            onChange={setActiveWorkspaceId}
          />
        </div>

        {/* Prompt / concept input */}
        <div className="studio-control-section">
          <label className="studio-label">Concept / Description</label>
          <textarea
            className="studio-textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={EXAMPLE_PROMPTS[activeTool]}
            rows={4}
          />
        </div>

        {/* Industry (optional) */}
        <div className="studio-control-section">
          <label className="studio-label">Industry <span className="studio-label-opt">(optional)</span></label>
          <select
            className="studio-select"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
          >
            <option value="">— Select industry —</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Style presets */}
        <div className="studio-control-section">
          <label className="studio-label">Style</label>
          <div className="studio-preset-grid studio-preset-grid--sm">
            {STYLES.map(s => (
              <button
                key={s.id}
                className={`studio-preset-btn${style === s.id ? ' active' : ''}`}
                onClick={() => setStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="studio-control-section">
          <label className="studio-label">Mood</label>
          <div className="studio-preset-grid studio-preset-grid--sm">
            {MOODS.map(m => (
              <button
                key={m.id}
                className={`studio-preset-btn${mood === m.id ? ' active' : ''}`}
                onClick={() => setMood(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color direction */}
        <div className="studio-control-section">
          <label className="studio-label">Color Direction <span className="studio-label-opt">(optional)</span></label>
          <input
            className="studio-input"
            type="text"
            value={colorDirection}
            onChange={e => setColorDir(e.target.value)}
            placeholder="e.g. navy and gold, deep purple"
          />
        </div>

        {/* Logo background toggle */}
        {activeTool === 'logo' && (
          <div className="studio-control-section">
            <label className="studio-label">Logo Background</label>
            <div className="studio-preset-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {([
                { id: 'white',       label: '⬜ White'       },
                { id: 'dark',        label: '⬛ Dark'         },
                { id: 'transparent', label: '🔲 Transparent' },
              ] as { id: typeof logoBg; label: string }[]).map(opt => (
                <button
                  key={opt.id}
                  className={`studio-preset-btn${logoBg === opt.id ? ' active' : ''}`}
                  onClick={() => setLogoBg(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Platform selector (social only) */}
        {activeTool === 'social' && (
          <div className="studio-control-section">
            <label className="studio-label">Platform</label>
            <div className="biz-platform-grid">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  className={`biz-platform-btn${platform === p.id ? ' active' : ''}`}
                  onClick={() => setPlatform(p.id)}
                >
                  <span className="biz-platform-icon">{p.icon}</span>
                  <span className="biz-platform-label">{p.label}</span>
                  <span className="biz-platform-size">{p.size}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slide format (slide only) */}
        {activeTool === 'slide' && (
          <div className="studio-control-section">
            <label className="studio-label">Format</label>
            <div className="studio-preset-grid">
              {SLIDE_FORMATS.map(f => (
                <button
                  key={f.id}
                  className={`studio-preset-btn${slideFormat.id === f.id ? ' active' : ''}`}
                  onClick={() => setSlideFormat(f)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quality toggle */}
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
          >
            {jobStatus === 'running'
              ? `Generating… ${(elapsedMs / 1000).toFixed(1)}s`
              : isBrandKit
              ? '✦ Generate Brand Kit (4 images)'
              : '✦ Generate'}
          </button>
          <p className="studio-hint" style={{ textAlign: 'right', marginTop: '0.25rem' }}>⌘↵</p>
        </div>

      </aside>

      {/* ────────────────────────────── CANVAS ──────────────────────────────── */}
      <main className="studio-canvas">

        {/* Error state */}
        {jobStatus === 'failed' && error && (
          <div className="studio-error-card">
            <p className="studio-error-title">Generation failed</p>
            <p className="studio-error-msg">{error}</p>
            <button className="btn-ghost btn-sm" onClick={handleGenerate}>Retry</button>
          </div>
        )}

        {/* Brand kit 2x2 grid */}
        {isBrandKit && brandKitResults.length > 0 && (
          <div className="biz-brandkit-grid">
            {brandKitResults.map((r, i) => {
              const labels = ['Logo Mark', 'Brand Banner', 'Profile Image', 'OG Meta'];
              return r.resultUrl ? (
                <div key={i} className="biz-brandkit-cell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.resultUrl} alt={labels[i]} className="biz-brandkit-img" />
                  <div className="biz-brandkit-footer">
                    <span className="biz-brandkit-label">{labels[i]}</span>
                    <button
                      className="btn-ghost btn-xs"
                      onClick={() => r.resultUrl && handleDownload(r.resultUrl, (i + 1).toString())}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* Single output */}
        {!isBrandKit && jobStatus !== 'idle' && (
          <div className="studio-output-frame">
            {jobStatus === 'running' && (
              <div className="studio-output-loading">
                <div className="studio-spinner" />
                <span>Generating… {(elapsedMs / 1000).toFixed(1)}s</span>
              </div>
            )}
            {displayResult?.resultUrl && jobStatus !== 'running' && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayResult.resultUrl}
                  alt="Generated business asset"
                  className="studio-output-img biz-output-img"
                />
                <div className="studio-output-toolbar">
                  {displayResult.width && displayResult.height && (
                    <span className="studio-output-size">
                      {displayResult.width} × {displayResult.height}
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
                    onClick={() => { if (displayResult.resultUrl) { navigator.clipboard.writeText(displayResult.resultUrl); toastSuccess('URL copied'); } }}
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
            <div className="studio-idle-icon">⬛</div>
            <p className="studio-idle-title">Business Studio</p>
            <p className="studio-idle-desc">
              {TOOLS.find(t => t.id === activeTool)?.desc}
            </p>
            <div className="studio-idle-chips">
              {(['logo', 'social', 'slide', 'web-hero'] as BusinessTool[]).map(t => (
                <button
                  key={t}
                  className="studio-chip"
                  onClick={() => { switchTool(t); setPrompt(EXAMPLE_PROMPTS[t]); }}
                >
                  {EXAMPLE_PROMPTS[t].slice(0, 50)}…
                </button>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ────────────────────────────── HISTORY ─────────────────────────────── */}
      <aside className="studio-history">
        <div className="studio-history-header">
          <span className="studio-history-title">History</span>
        </div>
        <div className="studio-history-list">
          {history.length === 0 && (
            <p className="studio-history-empty">Generated assets appear here</p>
          )}
          {history.map((item, idx) => (
            <button
              key={item.id}
              className={`studio-history-item${selectedHistory === idx ? ' active' : ''}`}
              onClick={() => { setResult({ jobId: item.id, resultUrl: item.resultUrl }); setSelHistory(idx); }}
            >
              {item.resultUrl
                ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.resultUrl} alt="" className="studio-history-thumb biz-history-thumb" />
                  )
                : <div className="studio-history-thumb studio-history-thumb--empty">⬛</div>
              }
              <div className="studio-history-meta">
                <span className="studio-history-tool">{item.tool}</span>
                <span className="studio-history-prompt">{item.prompt.slice(0, 32)}…</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function BusinessStudio() {
  return (
    <Suspense fallback={<div className="studio-layout" />}>
      <BusinessStudioInner />
    </Suspense>
  );
}
