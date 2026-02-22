'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Framework = 'html-tailwind' | 'react-tsx' | 'next-tsx' | 'vanilla-css';
type ComponentType =
  | 'hero' | 'pricing' | 'navbar' | 'card' | 'form' | 'dashboard'
  | 'landing' | 'auth' | 'settings' | 'table' | 'modal' | 'sidebar'
  | 'footer' | 'faq' | 'testimonials' | 'features' | 'cta' | 'custom';
type StylePreset =
  | 'saas-dark' | 'minimal-light' | 'bold-consumer' | 'corporate-clean'
  | 'dev-terminal' | 'warm-brand' | 'glassmorphism' | 'brutalist';
type OutputTab = 'preview' | 'code';

interface GenerationResult {
  code: string;
  framework: Framework;
  componentType: ComponentType;
  style: StylePreset;
  modelUsed: string;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPONENT_TYPES: { id: ComponentType; label: string; icon: string; category: string }[] = [
  { id: 'hero',         label: 'Hero Section',   icon: '◈', category: 'Sections'   },
  { id: 'features',     label: 'Features',        icon: '◆', category: 'Sections'   },
  { id: 'pricing',      label: 'Pricing',         icon: '◉', category: 'Sections'   },
  { id: 'testimonials', label: 'Testimonials',    icon: '◎', category: 'Sections'   },
  { id: 'faq',          label: 'FAQ',             icon: '◌', category: 'Sections'   },
  { id: 'cta',          label: 'CTA',             icon: '▶', category: 'Sections'   },
  { id: 'footer',       label: 'Footer',          icon: '▬', category: 'Sections'   },
  { id: 'navbar',       label: 'Navbar',          icon: '≡',  category: 'Navigation' },
  { id: 'sidebar',      label: 'Sidebar',         icon: '⊟', category: 'Navigation' },
  { id: 'card',         label: 'Card',            icon: '▭', category: 'Components' },
  { id: 'form',         label: 'Form',            icon: '⊞', category: 'Components' },
  { id: 'modal',        label: 'Modal',           icon: '⊡', category: 'Components' },
  { id: 'table',        label: 'Data Table',      icon: '⊟', category: 'Components' },
  { id: 'dashboard',    label: 'Dashboard',       icon: '⊞', category: 'Pages'      },
  { id: 'landing',      label: 'Landing Page',    icon: '◈', category: 'Pages'      },
  { id: 'auth',         label: 'Auth Page',       icon: '⊙', category: 'Pages'      },
  { id: 'settings',     label: 'Settings Page',   icon: '⊛', category: 'Pages'      },
  { id: 'custom',       label: 'Custom',          icon: '✦', category: 'Advanced'   },
];

const COMPONENT_CATEGORIES = ['Sections', 'Navigation', 'Components', 'Pages', 'Advanced'];

const FRAMEWORKS: { id: Framework; label: string; ext: string; desc: string }[] = [
  { id: 'html-tailwind', label: 'HTML + Tailwind', ext: 'html', desc: 'Self-contained, no build step' },
  { id: 'react-tsx',     label: 'React / TSX',     ext: 'tsx',  desc: 'Component for React projects' },
  { id: 'next-tsx',      label: 'Next.js / TSX',   ext: 'tsx',  desc: 'Next.js 14 App Router' },
  { id: 'vanilla-css',   label: 'Vanilla CSS',     ext: 'html', desc: 'Pure HTML + CSS, no deps' },
];

const STYLE_PRESETS: { id: StylePreset; label: string; colors: string[]; desc: string }[] = [
  { id: 'saas-dark',      label: 'SaaS Dark',       colors: ['#0f0f10', '#1a1a1b', '#6366f1'], desc: 'Dark SaaS product aesthetic' },
  { id: 'minimal-light',  label: 'Minimal Light',   colors: ['#ffffff', '#f9fafb', '#6366f1'], desc: 'Clean, lots of white space' },
  { id: 'bold-consumer',  label: 'Bold Consumer',   colors: ['#fbbf24', '#ef4444', '#1f2937'], desc: 'Vibrant, high energy' },
  { id: 'corporate-clean',label: 'Corporate Clean', colors: ['#1e3a5f', '#f8fafc', '#3b82f6'], desc: 'Professional enterprise' },
  { id: 'dev-terminal',   label: 'Dev Terminal',    colors: ['#0d1117', '#161b22', '#22c55e'], desc: 'Code editor inspired' },
  { id: 'warm-brand',     label: 'Warm Brand',      colors: ['#fffbeb', '#fef3c7', '#f59e0b'], desc: 'Friendly community tone' },
  { id: 'glassmorphism',  label: 'Glassmorphism',   colors: ['#667eea', '#764ba2', 'rgba(255,255,255,0.1)'], desc: 'Frosted glass effect' },
  { id: 'brutalist',      label: 'Brutalist',       colors: ['#000000', '#ffffff', '#ff0000'], desc: 'Raw, bold, no-nonsense' },
];

const EXAMPLE_PROMPTS: Partial<Record<ComponentType, string>> = {
  hero: 'SaaS analytics platform called "Chartly" — headline: "Turn your data into decisions", subtitle about real-time dashboards, two CTAs: Start Free and Watch Demo',
  pricing: 'Three tiers: Free (limited), Pro ($29/mo), Enterprise (contact us). Features: API access, custom dashboards, team seats, priority support',
  navbar: 'Company "Nexus" — logo on left, links: Product, Pricing, Docs, Blog — Sign In and Get Started buttons on right',
  dashboard: 'Admin dashboard for an e-commerce platform — sidebar with Orders, Products, Customers, Analytics — stat cards at top, recent orders table',
  auth: 'Sign in page for a developer tool called "DevKit" — sign in with GitHub, sign in with Google, or email/password form below a divider',
  landing: 'Full landing page for an AI writing tool called "Quill" — hero, 3-feature grid, social proof numbers, pricing table, footer',
  form: 'User profile settings form — avatar upload, display name, email (read-only), bio textarea, notification preferences toggles, save button',
};

// ---------------------------------------------------------------------------
// Syntax highlight helper (minimal, no deps)
// ---------------------------------------------------------------------------

function highlightCode(code: string, ext: string): string {
  if (ext === 'tsx' || ext === 'jsx') {
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/(\/\/[^\n]*)/g, '<span class="code-comment">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="code-string">$1</span>')
      .replace(/\b(import|export|default|from|const|let|var|function|return|if|else|for|while|class|extends|interface|type|async|await|new|null|undefined|true|false)\b/g, '<span class="code-keyword">$1</span>')
      .replace(/\b(React|useState|useEffect|useRef|useCallback|NextRequest|NextResponse)\b/g, '<span class="code-builtin">$1</span>');
  }
  // HTML
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(&lt;\/?[\w-]+)/g, '<span class="code-tag">$1</span>')
    .replace(/([\w-]+=)("(?:[^"\\]|\\.)*")/g, '<span class="code-attr">$1</span><span class="code-string">$2</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>');
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function UIUXStudio() {
  const { data: session } = useSession();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('');
  const [componentType, setComponentType] = useState<ComponentType>('hero');
  const [framework, setFramework] = useState<Framework>('html-tailwind');
  const [style, setStyle] = useState<StylePreset>('saas-dark');
  const [colorScheme, setColorScheme] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [responsive, setResponsive] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('Sections');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Generation state ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<OutputTab>('preview');
  const [copied, setCopied] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-set dark mode when style changes
  useEffect(() => {
    const darkStyles: StylePreset[] = ['saas-dark', 'dev-terminal', 'glassmorphism'];
    setDarkMode(darkStyles.includes(style));
  }, [style]);

  // Auto-fill example prompt when component type changes (only if prompt is empty)
  useEffect(() => {
    if (!prompt && EXAMPLE_PROMPTS[componentType]) {
      // don't auto-fill — let user see placeholder instead
    }
  }, [componentType, prompt]);

  const startLoadingTimers = useCallback(() => {
    const stages = [
      'Analyzing prompt…',
      'Designing layout…',
      'Generating code…',
      'Applying styles…',
      'Finalizing output…',
    ];
    let i = 0;
    setLoadingStage(stages[0]);
    const next = () => {
      i++;
      if (i < stages.length) {
        setLoadingStage(stages[i]);
        stageTimerRef.current = setTimeout(next, 3500);
      }
    };
    stageTimerRef.current = setTimeout(next, 3500);

    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 200);
  }, []);

  const stopLoadingTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (stageTimerRef.current) { clearTimeout(stageTimerRef.current); stageTimerRef.current = null; }
    setElapsedMs(0);
    setLoadingStage('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      const el = document.getElementById('uiux-prompt');
      el?.classList.add('shake');
      setTimeout(() => el?.classList.remove('shake'), 400);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    startLoadingTimers();

    try {
      const res = await fetch('/api/uiux/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          prompt: prompt.trim(),
          componentType,
          framework,
          style,
          colorScheme: colorScheme.trim() || undefined,
          darkMode,
          responsive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Generation failed');
        return;
      }

      setResult(data as GenerationResult);
      setOutputTab('preview');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      stopLoadingTimers();
    }
  }, [prompt, componentType, framework, style, colorScheme, darkMode, responsive, startLoadingTimers, stopLoadingTimers]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    stopLoadingTimers();
  }, [stopLoadingTimers]);

  const handleCopyCode = useCallback(() => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result?.code) return;
    const fw = FRAMEWORKS.find((f) => f.id === result.framework);
    const ext = fw?.ext ?? 'html';
    const slug = prompt.slice(0, 30).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const filename = `wokgen-uiux-${result.componentType}-${slug}.${ext}`;
    const blob = new Blob([result.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, [result, prompt]);

  const handleUseExample = useCallback(() => {
    const ex = EXAMPLE_PROMPTS[componentType];
    if (ex) setPrompt(ex);
  }, [componentType]);

  const isHTML = framework === 'html-tailwind' || framework === 'vanilla-css';

  return (
    <div className="studio-root">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="studio-sidebar">
        {/* Header */}
        <div className="studio-sidebar-header">
          <div className="studio-mode-label" style={{ color: '#f472b6' }}>
            <span>✦</span> WokGen UI/UX
          </div>
          <Link href="/" className="btn-ghost btn-xs" style={{ fontSize: '0.7rem' }}>← Platform</Link>
        </div>

        <div className="studio-sidebar-scroll">
          {/* Component Type */}
          <div className="sidebar-section">
            <div className="sidebar-label">Component</div>
            <div className="flex gap-1 flex-wrap mb-2">
              {COMPONENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className="btn-ghost btn-xs"
                  style={{
                    background: categoryFilter === cat ? 'var(--accent-dim)' : 'transparent',
                    color: categoryFilter === cat ? 'var(--accent)' : 'var(--text-muted)',
                    border: categoryFilter === cat ? '1px solid var(--accent-muted)' : '1px solid transparent',
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                  }}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {COMPONENT_TYPES.filter((c) => c.category === categoryFilter).map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setComponentType(ct.id)}
                  className="uiux-type-btn"
                  style={{
                    background: componentType === ct.id ? 'var(--accent-dim)' : 'var(--surface-raised)',
                    border: componentType === ct.id ? '1px solid var(--accent-muted)' : '1px solid var(--surface-border)',
                    color: componentType === ct.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{ct.icon}</span>
                  <span style={{ fontSize: '0.72rem' }}>{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Framework */}
          <div className="sidebar-section">
            <div className="sidebar-label">Framework</div>
            <div className="flex flex-col gap-1">
              {FRAMEWORKS.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setFramework(fw.id)}
                  className="uiux-fw-btn"
                  style={{
                    background: framework === fw.id ? 'var(--accent-dim)' : 'var(--surface-raised)',
                    border: framework === fw.id ? '1px solid var(--accent-muted)' : '1px solid var(--surface-border)',
                  }}
                >
                  <span className="uiux-fw-label" style={{ color: framework === fw.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {fw.label}
                  </span>
                  <span className="uiux-fw-desc">{fw.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Preset */}
          <div className="sidebar-section">
            <div className="sidebar-label">Style</div>
            <div className="grid grid-cols-2 gap-1">
              {STYLE_PRESETS.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setStyle(sp.id)}
                  className="uiux-style-btn"
                  style={{
                    border: style === sp.id ? '1px solid var(--accent-muted)' : '1px solid var(--surface-border)',
                    background: style === sp.id ? 'var(--accent-dim)' : 'var(--surface-raised)',
                  }}
                >
                  <div className="uiux-style-swatches">
                    {sp.colors.map((c, i) => (
                      <div key={i} className="uiux-style-swatch" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="uiux-style-name" style={{ color: style === sp.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {sp.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="sidebar-section">
            <div className="sidebar-label-row">
              <span className="sidebar-label">Describe what to build</span>
              {EXAMPLE_PROMPTS[componentType] && (
                <button
                  className="btn-ghost"
                  style={{ fontSize: '0.68rem', padding: '2px 6px', color: 'var(--accent)' }}
                  onClick={handleUseExample}
                >
                  Use example ↗
                </button>
              )}
            </div>
            <textarea
              id="uiux-prompt"
              className="studio-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={EXAMPLE_PROMPTS[componentType] ?? 'Describe the component you want to generate…'}
              rows={5}
              maxLength={600}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
              }}
            />
            <div
              className="prompt-counter"
              style={{
                color: prompt.length > 540 ? '#ef4444' : prompt.length > 480 ? '#f59e0b' : 'var(--text-disabled)',
              }}
            >
              {prompt.length}/600
            </div>
          </div>

          {/* Advanced */}
          <div className="sidebar-section">
            <button
              className="sidebar-advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <span>Advanced</span>
              <span style={{ fontSize: '0.7rem' }}>{showAdvanced ? '▲' : '▼'}</span>
            </button>
            {showAdvanced && (
              <div className="flex flex-col gap-3 mt-2">
                <div>
                  <div className="sidebar-label" style={{ marginBottom: '0.35rem' }}>Color scheme</div>
                  <input
                    type="text"
                    className="studio-input"
                    value={colorScheme}
                    onChange={(e) => setColorScheme(e.target.value)}
                    placeholder="e.g. indigo and slate"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="accent-purple-500"
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Dark mode</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={responsive}
                      onChange={(e) => setResponsive(e.target.checked)}
                      className="accent-purple-500"
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Responsive</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="studio-sidebar-footer">
          {error && (
            <div className="uiux-error-msg">{error}</div>
          )}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {loadingStage}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-disabled)', fontFamily: 'monospace' }}>
                  {(elapsedMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill progress-indeterminate" />
              </div>
              <button className="btn-secondary btn-sm w-full" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn-primary w-full"
              onClick={handleGenerate}
              disabled={isLoading}
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', border: 'none' }}
            >
              ✦ Generate {FRAMEWORKS.find((f) => f.id === framework)?.label ?? 'Code'}
              <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: 6 }}>⌘↵</span>
            </button>
          )}
          <div style={{ fontSize: '0.68rem', textAlign: 'center', color: 'var(--text-disabled)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>∞</span> Free code generation
          </div>
        </div>
      </aside>

      {/* ── Output Panel ────────────────────────────────────────────────────── */}
      <main className="studio-main flex flex-col overflow-hidden">
        {/* Output Toolbar */}
        <div
          className="flex items-center gap-2 px-4 py-2 flex-shrink-0 flex-wrap"
          style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-raised)' }}
        >
          {/* Tabs */}
          <div className="flex gap-1">
            {(['preview', 'code'] as OutputTab[]).map((tab) => (
              <button
                key={tab}
                className="btn-ghost btn-sm"
                style={{
                  background: outputTab === tab ? 'var(--accent-dim)' : 'transparent',
                  color: outputTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  border: outputTab === tab ? '1px solid var(--accent-muted)' : '1px solid transparent',
                  textTransform: 'capitalize',
                }}
                onClick={() => setOutputTab(tab)}
                disabled={!result}
              >
                {tab === 'preview' ? '◈ Preview' : '{ } Code'}
              </button>
            ))}
          </div>

          {result && (
            <>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'var(--surface-overlay)', color: 'var(--text-muted)', border: '1px solid var(--surface-border)' }}
              >
                {FRAMEWORKS.find((f) => f.id === result.framework)?.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'var(--surface-overlay)', color: 'var(--text-muted)', border: '1px solid var(--surface-border)' }}
              >
                {COMPONENT_TYPES.find((c) => c.id === result.componentType)?.label}
              </span>
            </>
          )}

          <div className="flex-1" />

          {result && (
            <>
              {result.durationMs && (
                <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
                  {(result.durationMs / 1000).toFixed(1)}s
                </span>
              )}
              <button className="btn-ghost btn-sm" onClick={handleCopyCode}>
                {copied ? '✓ Copied' : '⎘ Copy Code'}
              </button>
              <button className="btn-secondary btn-sm" onClick={handleDownload}>
                ↓ Download
              </button>
            </>
          )}
        </div>

        {/* Output Content */}
        <div className="flex-1 overflow-hidden relative">
          {!result && !isLoading && (
            <UIUXEmptyState
              onSelect={(ct) => { setComponentType(ct); setCategoryFilter(COMPONENT_TYPES.find((c) => c.id === ct)?.category ?? 'Sections'); }}
            />
          )}

          {isLoading && (
            <div className="uiux-loading-state">
              <div className="uiux-loading-icon">✦</div>
              <div className="uiux-loading-text">{loadingStage || 'Generating…'}</div>
              <div className="uiux-loading-sub">
                Crafting {COMPONENT_TYPES.find((c) => c.id === componentType)?.label ?? 'component'} in {FRAMEWORKS.find((f) => f.id === framework)?.label}
              </div>
              <div style={{ color: 'var(--text-disabled)', fontSize: '0.72rem', fontFamily: 'monospace', marginTop: 8 }}>
                {(elapsedMs / 1000).toFixed(1)}s
              </div>
            </div>
          )}

          {result && outputTab === 'preview' && (
            <UIUXPreview code={result.code} isHTML={isHTML} />
          )}

          {result && outputTab === 'code' && (
            <UIUXCodePane
              code={result.code}
              ext={FRAMEWORKS.find((f) => f.id === result.framework)?.ext ?? 'html'}
              onCopy={handleCopyCode}
              copied={copied}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview component
// ---------------------------------------------------------------------------

function UIUXPreview({ code, isHTML }: { code: string; isHTML: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setIframeKey((k) => k + 1);
  }, [code]);

  if (!isHTML) {
    return (
      <div className="uiux-preview-unavailable">
        <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>◈</div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
          Preview unavailable for {isHTML ? 'HTML' : 'React/Next.js'} components
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          Switch to &quot;Code&quot; tab to copy and use in your project
        </div>
      </div>
    );
  }

  return (
    <div className="uiux-preview-frame">
      {/* Toolbar */}
      <div className="uiux-preview-toolbar">
        <div className="uiux-browser-dots">
          <span style={{ background: '#ef4444' }} />
          <span style={{ background: '#f59e0b' }} />
          <span style={{ background: '#22c55e' }} />
        </div>
        <div className="uiux-browser-bar">localhost / preview</div>
        <button
          className="btn-ghost btn-xs"
          onClick={() => setIframeKey((k) => k + 1)}
          title="Reload preview"
        >↺</button>
      </div>
      <iframe
        key={iframeKey}
        ref={iframeRef}
        srcDoc={code}
        title="Component preview"
        className="uiux-iframe"
        sandbox="allow-scripts allow-same-origin"
        style={{ border: 'none', width: '100%', flex: 1, background: '#fff' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code pane component
// ---------------------------------------------------------------------------

function UIUXCodePane({
  code, ext, onCopy, copied,
}: {
  code: string;
  ext: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const highlighted = highlightCode(code, ext);

  return (
    <div className="uiux-code-pane">
      <div className="uiux-code-header">
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          component.{ext}
        </span>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '0.68rem', color: 'var(--text-disabled)' }}>
            {code.split('\n').length} lines
          </span>
          <button className="btn-ghost btn-xs" onClick={onCopy}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
      </div>
      <pre
        className="uiux-code-content"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function UIUXEmptyState({ onSelect }: { onSelect: (ct: ComponentType) => void }) {
  const featured: ComponentType[] = ['hero', 'pricing', 'dashboard', 'auth', 'landing', 'navbar'];

  return (
    <div className="uiux-empty-state">
      <div className="uiux-empty-icon">✦</div>
      <h2 className="uiux-empty-title">WokGen UI/UX</h2>
      <p className="uiux-empty-desc">
        Generate production-ready front-end components from a prompt.
        Preview HTML instantly. Copy React/TSX for your project.
      </p>
      <div className="uiux-empty-chips">
        {featured.map((ct) => {
          const item = COMPONENT_TYPES.find((c) => c.id === ct);
          return (
            <button
              key={ct}
              className="uiux-empty-chip"
              onClick={() => onSelect(ct)}
            >
              {item?.icon} {item?.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
