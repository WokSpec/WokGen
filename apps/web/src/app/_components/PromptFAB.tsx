'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface EnhanceResponse {
  variations?: string[];
  error?: string;
}

const MODE_FROM_PATH: Record<string, string> = {
  pixel: 'pixel',
  vector: 'vector',
  business: 'business',
  uiux: 'uiux',
  voice: 'voice',
  code: 'code',
  audio: 'voice',
  text: 'pixel',
};

function getMode(pathname: string): string {
  const segment = pathname.split('/')[1] ?? '';
  return MODE_FROM_PATH[segment] ?? 'pixel';
}

export function PromptFAB() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Only render on studio pages
  if (!pathname?.includes('/studio')) return null;

  const mode = getMode(pathname);

  const enhance = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setVariations([]);
    setEnhancedPrompt('');
    try {
      const res = await fetch('/api/prompt/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), mode }),
      });
      const data = await res.json() as EnhanceResponse;
      if (!res.ok || data.error) throw new Error(data.error ?? 'Enhancement failed');
      const vars = data.variations ?? [];
      setVariations(vars);
      setEnhancedPrompt(vars[0] ?? prompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enhancement unavailable');
    } finally {
      setLoading(false);
    }
  }, [prompt, mode]);

  const usePrompt = (p: string) => {
    navigator.clipboard.writeText(p).then(() => {
      toast.success('Prompt copied to clipboard!');
      setOpen(false);
    }).catch(() => toast.error('Copy failed'));
  };

  return (
    <div className={`prompt-fab${open ? ' prompt-fab--open' : ''}`}>
      {open && (
        <div className="prompt-fab__panel" role="dialog" aria-label="Prompt Lab">
          <div className="prompt-fab__panel-header">
            <span className="prompt-fab__title">✨ Prompt Lab</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="prompt-fab__close"
              aria-label="Close Prompt Lab"
            >
              ×
            </button>
          </div>

          <div className="prompt-fab__panel-body">
            <label className="prompt-fab__mode-label">
              Mode: <strong className="prompt-fab__mode-name">{mode}</strong>
            </label>
            <textarea
              className="studio-textarea"
              placeholder="Enter a prompt to enhance…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              style={{ width: '100%', fontSize: '0.8rem', marginTop: 4 }}
            />

            <button
              type="button"
              className="btn btn-generate"
              onClick={enhance}
              disabled={loading || !prompt.trim()}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? 'Enhancing…' : '✨ Enhance'}
            </button>

            {error && (
              <div className="prompt-fab__error">
                {error}
              </div>
            )}

            {enhancedPrompt && !error && (
              <div className="prompt-fab__result">
                <div className="prompt-fab__result-label">Enhanced:</div>
                <div className="prompt-fab__result-text">
                  {enhancedPrompt}
                </div>
                <button
                  type="button"
                  className="btn btn-generate"
                  style={{ width: '100%', fontSize: '0.75rem' }}
                  onClick={() => usePrompt(enhancedPrompt)}
                >
                  Use this prompt ↗
                </button>
              </div>
            )}

            {variations.length > 1 && (
              <div className="prompt-fab__variations">
                <div className="prompt-fab__variations-label">Suggestions:</div>
                <div className="prompt-fab__variations-list">
                  {variations.slice(1, 4).map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => usePrompt(v)}
                      className="prompt-fab__variation-btn"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="prompt-fab__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Prompt Lab"
        title="Prompt Lab"
      >
        ✨
      </button>
    </div>
  );
}
