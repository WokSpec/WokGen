'use client';

import { useState } from 'react';
import { Eraser, Shapes, Download, Copy, ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface PostProcessToolbarProps {
  imageUrl: string;
  prompt?: string;
  mode?: string;
  onResult?: (url: string, tool: string) => void;
}

type ToolState = 'idle' | 'loading' | 'done' | 'error';

interface ToolResult {
  url: string;
  ext: string;
}

// ---------------------------------------------------------------------------
// Individual tool button
// ---------------------------------------------------------------------------

function ToolButton({
  onClick, icon: Icon, label, state, result,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  state: ToolState;
  result?: ToolResult | null;
}) {
  const download = (r: ToolResult) => {
    const a = document.createElement('a');
    a.href = r.url;
    a.download = `wokgen-processed-${Date.now()}.${r.ext}`;
    a.click();
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={state !== 'loading' ? onClick : undefined}
        disabled={state === 'loading'}
        title={state === 'error' ? 'Failed — click to retry' : label}
        className={[
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
          state === 'idle'
            ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20 cursor-pointer'
            : state === 'loading'
            ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
            : state === 'done'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-pointer'
            : 'bg-red-500/10 border-red-500/20 text-red-400 cursor-pointer',
        ].join(' ')}
      >
        {state === 'loading'
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : state === 'done'
          ? <CheckCircle2 className="w-3 h-3" />
          : state === 'error'
          ? <AlertCircle className="w-3 h-3" />
          : <Icon className="w-3 h-3" />}
        {state === 'loading' ? 'Processing…'
          : state === 'error' ? 'Retry'
          : label}
      </button>

      {state === 'done' && result && (
        <button
          onClick={() => download(result)}
          title={`Download ${result.ext.toUpperCase()}`}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
        >
          <Download className="w-3 h-3" />
          {result.ext.toUpperCase()}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main toolbar
// ---------------------------------------------------------------------------

export function PostProcessToolbar({ imageUrl, prompt: _prompt, mode, onResult }: PostProcessToolbarProps) {
  const [bgState, setBgState] = useState<ToolState>('idle');
  const [bgResult, setBgResult] = useState<ToolResult | null>(null);

  const [vecState, setVecState] = useState<ToolState>('idle');
  const [vecResult, setVecResult] = useState<ToolResult | null>(null);

  const [copied, setCopied] = useState(false);

  // ── Background removal ──────────────────────────────────────────────────
  const removeBackground = async () => {
    setBgState('loading');
    setBgResult(null);
    try {
      const res = await fetch('/api/tools/bg-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'bg-remove failed');
      const url: string = data.resultUrl ?? data.url ?? '';
      if (!url) throw new Error('No result URL returned');
      setBgResult({ url, ext: 'png' });
      setBgState('done');
      onResult?.(url, 'bg-remove');
    } catch {
      setBgState('error');
    }
  };

  // ── Vectorize ───────────────────────────────────────────────────────────
  const vectorize = async () => {
    setVecState('loading');
    setVecResult(null);
    try {
      const res = await fetch('/api/tools/vectorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'vectorize failed');
      const url: string = data.svgUrl ?? data.url ?? '';
      if (!url) throw new Error('No SVG URL returned');
      setVecResult({ url, ext: 'svg' });
      setVecState('done');
      onResult?.(url, 'vectorize');
    } catch {
      setVecState('error');
    }
  };

  // ── Copy URL ────────────────────────────────────────────────────────────
  const copyUrl = () => {
    navigator.clipboard.writeText(imageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard access denied — fail silently
    });
  };

  // ── Direct download ─────────────────────────────────────────────────────
  const download = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `wokgen-${mode ?? 'asset'}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="mt-2 p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
      <p className="text-[10px] text-white/20 uppercase tracking-wider mb-2 px-0.5">Post-process</p>
      <div className="flex flex-wrap gap-1.5">

        <ToolButton
          onClick={removeBackground}
          icon={Eraser}
          label="Remove BG"
          state={bgState}
          result={bgResult}
        />

        <ToolButton
          onClick={vectorize}
          icon={Shapes}
          label="Vectorize"
          state={vecState}
          result={vecResult}
        />

        <button
          onClick={download}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20 transition-all"
        >
          <Download className="w-3 h-3" />
          Download
        </button>

        <button
          onClick={copyUrl}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20 transition-all"
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy URL'}
        </button>

        <a
          href={`/studio?type=${mode === 'pixel' ? 'pixel' : mode}&imageUrl=${encodeURIComponent(imageUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Edit in Studio
        </a>

      </div>
    </div>
  );
}
