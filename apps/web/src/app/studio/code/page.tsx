'use client';

import { useState } from 'react';

// Inline SVG icons — lucide-react is not a project dependency
const IconSparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  </svg>
);
const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);
const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);
const IconCode2 = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>
  </svg>
);
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconRefreshCw = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
);
const IconLoader2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const TEMPLATES = [
  { label: 'Pricing Card', prompt: 'A pricing card component with 3 tiers (Free, Pro, Enterprise), monthly/annual toggle, feature list with checkmarks, and a CTA button. Dark theme.' },
  { label: 'Auth Form', prompt: 'A sign in form with email and password inputs, "Remember me" checkbox, forgot password link, Google OAuth button with divider, and sign up link. Dark theme.' },
  { label: 'Dashboard Stats', prompt: 'A row of 4 stat cards showing metrics like Total Users, Revenue, Active Projects, API Calls. Each has an icon, big number, percentage change indicator with color. Dark theme.' },
  { label: 'Navigation Bar', prompt: 'A top navigation bar with logo on left, nav links in center (Home, Products, Docs, Pricing), auth buttons on right (Sign In, Get Started). Dark theme with subtle border.' },
  { label: 'Feature Grid', prompt: 'A 3-column feature grid with 6 features. Each feature has a colored icon, title, and 2-line description. For a developer tool SaaS. Dark theme.' },
  { label: 'Command Palette', prompt: 'A command palette modal with search input at top, grouped results below (Recent, Actions, Pages), keyboard shortcut hints on right. Dark glass morphism style.' },
  { label: 'Settings Panel', prompt: 'A settings panel with sections: Profile, Notifications, API Keys, Danger Zone. Each section has relevant form fields and toggle switches. Dark theme.' },
  { label: 'File Upload Zone', prompt: 'A file upload drop zone with dashed border, upload icon, "Drag and drop or click to browse" text, file type hints, and upload progress bar. Dark theme.' },
];

export default function CodeStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);

  const generate = async (p?: string) => {
    const usePrompt = p ?? prompt;
    if (!usePrompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setCode('');

    try {
      const res = await fetch('/api/studio/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: usePrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setCode(data.code);
      setView('code');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard access denied — fail silently
    });
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component.tsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build iframe preview HTML
  const previewHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"><\/script>
<script>
  tailwind.config = { darkMode: 'class', theme: { extend: { colors: { zinc: { 950: '#09090b' } } } } }
<\/script>
<style>body { background: var(--bg); }<\/style>
</head>
<body class="dark p-8">
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script type="text/babel">
const { useState, useEffect, useRef } = React;
${code
  .replace(/^import.*$/gm, '')
  .replace(/export default /g, '')
  .replace(/export /g, '')}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(typeof Component !== 'undefined' ? Component : () => React.createElement('div', { className: 'text-[var(--text)] p-4' }, 'Component could not be rendered')));
<\/script>
</body>
</html>`;

  return (
    <div className="min-h-screen text-[var(--text)]" style={{ background: 'var(--bg)' }}>
      <div className="app-topbar">
        <div className="app-topbar__left">
          <span style={{ color: 'var(--blue, #60a5fa)' }}><IconCode2 size={16} /></span>
          <span className="app-topbar__wordmark-gen" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Code Studio</span>
          <span className="app-topbar__sep">·</span>
          <span className="text-xs text-[var(--text)]/40">React + Tailwind</span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-61px)]">
        {/* Left panel — input */}
        <div className="w-80 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="p-4 flex-1 flex flex-col">
            <label className="text-xs text-[var(--text)]/40 mb-2">Describe your component</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="A pricing table with 3 tiers, feature comparison, and CTA buttons..."
              className="flex-1 border p-3 text-sm resize-none focus:outline-none min-h-32"
              style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate();
              }}
            />
            <p className="text-[10px] text-[var(--text)]/20 mt-1 mb-3">⌘+Enter to generate</p>

            <button type="button"
              onClick={() => generate()}
              disabled={isGenerating || !prompt.trim()}
              className="btn btn-generate w-full"
            >
              {isGenerating ? (
                <><IconLoader2 /> Generating...</>
              ) : (
                <><IconSparkles /> Generate Component</>
              )}
            </button>

            {error && (
              <div className="mt-3 p-3" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px' }}>
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] text-[var(--text)]/30 uppercase tracking-wider mb-2">Templates</p>
            <div className="space-y-1">
              {TEMPLATES.map(t => (
                <button type="button"
                  key={t.label}
                  onClick={() => { setPrompt(t.prompt); generate(t.prompt); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--text)]/50 hover:text-[var(--text)]/80 hover:bg-white/5 rounded-lg transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — output */}
        <div className="flex-1 flex flex-col">
          {code ? (
            <>
              {/* Toolbar */}
              <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <button type="button"
                    onClick={() => setView('code')}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${view === 'code' ? 'bg-white/10 text-[var(--text)]' : 'text-[var(--text)]/40 hover:text-[var(--text)]/60'}`}
                  >
                    <IconCode2 size={12} /> Code
                  </button>
                  <button type="button"
                    onClick={() => setView('preview')}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${view === 'preview' ? 'bg-white/10 text-[var(--text)]' : 'text-[var(--text)]/40 hover:text-[var(--text)]/60'}`}
                  >
                    <IconEye /> Preview
                  </button>
                </div>
                <div className="ml-auto flex gap-2">
                  <button type="button" onClick={copyCode} className="text-xs text-[var(--text)]/40 hover:text-[var(--text)]/70 flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/5">
                    <IconCopy /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button type="button" onClick={downloadCode} className="text-xs text-[var(--text)]/40 hover:text-[var(--text)]/70 flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/5">
                    <IconDownload /> .tsx
                  </button>
                  <button type="button" onClick={() => generate()} className="text-xs text-[var(--text)]/40 hover:text-[var(--text)]/70 flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/5">
                    <IconRefreshCw /> Regenerate
                  </button>
                </div>
              </div>

              {view === 'code' ? (
                <div className="flex-1 overflow-auto">
                  <div className="flex h-full">
                    {/* Line numbers */}
                    <div className="text-[var(--text)]/20 px-3 py-4 text-right select-none min-w-[3rem] font-mono text-xs leading-5" style={{ background: 'var(--surface-muted, var(--bg-elevated))', borderRight: '1px solid var(--border)' }}>
                      {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                    </div>
                    <pre className="flex-1 p-4 text-xs font-mono text-[var(--text)]/80 leading-5 overflow-x-auto whitespace-pre">
                      {code}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1" style={{ background: 'var(--bg-surface)' }}>
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                    title="Component Preview"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <span className="text-[var(--text)]/10 mb-4"><IconCode2 size={48} /></span>
              <p className="text-[var(--text)]/30 text-sm mb-1">No component generated yet</p>
              <p className="text-[var(--text)]/15 text-xs">Describe a component or pick a template</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
