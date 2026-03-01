'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MODES_LIST } from '@/lib/modes';
import type { ModeId } from '@/lib/modes';

interface EnhanceResult {
  original: string;
  enhanced: string;
  suggestions: string[];
  tags: string[];
  provider: string;
  durationMs: number;
}

interface HistoryEntry {
  prompt: string;
  mode: ModeId;
  ts: number;
}

const MAX_CHARS = 500;
const HISTORY_KEY = 'prompt-lab-history';

export function PromptLabClient() {
  const [mode, setMode] = useState<ModeId>('pixel');
  const [style, setStyle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnhanceResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryEntry[]);
    } catch {}
  }, []);

  const saveHistory = useCallback((p: string, m: ModeId) => {
    const entry: HistoryEntry = { prompt: p, mode: m, ts: Date.now() };
    setHistory((prev) => {
      const next = [entry, ...prev.filter((h) => h.prompt !== p)].slice(0, 5);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleEnhance = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/prompt/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, style }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }
      const data = await response.json() as EnhanceResult;
      setResult(data);
      saveHistory(prompt, mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enhance prompt');
    } finally {
      setLoading(false);
    }
  }, [prompt, mode, style, saveHistory]);

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  const modeForResult = MODES_LIST.find((m) => m.id === mode);

  return (
    <div className="prompt-lab">
      <div className="prompt-lab__inner">
        {/* Header */}
        <div className="prompt-lab__header">
          <h1 className="prompt-lab__title">Prompt Lab</h1>
          <p className="prompt-lab__subtitle">AI-powered prompt engineering</p>
        </div>

        {/* Form */}
        <div className="prompt-lab__form">
          {/* Mode selector */}
          <div className="prompt-lab__field-label">Mode</div>
          <div className="prompt-lab__mode-tabs">
            {MODES_LIST.map((m) => (
              <button
                key={m.id}
                className={`prompt-lab__mode-tab${mode === m.id ? ' prompt-lab__mode-tab--active' : ''}`}
                style={mode === m.id ? { background: m.accentColor, color: '#0a0a0a', borderColor: m.accentColor } : { borderColor: m.accentColor + '40', color: m.accentColor }}
                onClick={() => setMode(m.id)}
                type="button"
              >
                {m.shortLabel}
              </button>
            ))}
          </div>

          {/* Style input */}
          <div className="prompt-lab__field-label">Style preset <span className="prompt-lab__optional">(optional)</span></div>
          <input
            className="prompt-lab__input"
            type="text"
            placeholder="cinematic, dark, neon"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />

          {/* Prompt textarea */}
          <div className="prompt-lab__field-label">
            Prompt
            <span className="prompt-lab__charcount">{prompt.length}/{MAX_CHARS}</span>
          </div>
          <textarea
            className="prompt-lab__textarea"
            placeholder="Describe what you want to create..."
            value={prompt}
            maxLength={MAX_CHARS}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
          />

          {/* Error */}
          {error && <div className="prompt-lab__error">{error}</div>}

          {/* Actions */}
          <div className="prompt-lab__actions">
            <button
              className="prompt-lab__btn-primary"
              onClick={handleEnhance}
              disabled={loading || !prompt.trim()}
              type="button"
            >
              {loading ? (
                <>
                  <span className="prompt-lab__spinner" aria-hidden="true" />
                  Enhancing...
                </>
              ) : (
                '✨ Enhance with AI'
              )}
            </button>
            <button
              className="prompt-lab__btn-ghost"
              onClick={() => { setPrompt(''); setResult(null); setError(null); }}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="prompt-lab__result">
            {/* Enhanced prompt */}
            <div className="prompt-lab__enhanced">
              <div className="prompt-lab__result-header">
                <span className="prompt-lab__result-title">Enhanced Prompt</span>
                <div className="prompt-lab__result-actions">
                  <button
                    className="prompt-lab__copy-btn"
                    onClick={() => copyText(result.enhanced, 'enhanced')}
                    type="button"
                  >
                    {copied === 'enhanced' ? '✓ Copied' : 'Copy'}
                  </button>
                  {modeForResult && (
                    <Link href={`/${mode}/studio`} className="prompt-lab__use-btn">
                      Use in Studio →
                    </Link>
                  )}
                </div>
              </div>
              <p className="prompt-lab__enhanced-text">{result.enhanced}</p>
            </div>

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="prompt-lab__suggestions">
                <div className="prompt-lab__section-title">Suggestions</div>
                <div className="prompt-lab__suggestions-grid">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="prompt-lab__suggestion-card">
                      <p className="prompt-lab__suggestion-text">{s}</p>
                      <div className="prompt-lab__suggestion-btns">
                        <button
                          className="prompt-lab__copy-btn"
                          onClick={() => copyText(s, `sug-${i}`)}
                          type="button"
                        >
                          {copied === `sug-${i}` ? '✓' : 'Copy'}
                        </button>
                        <Link href={`/${mode}/studio`} className="prompt-lab__use-btn">
                          Use →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {result.tags.length > 0 && (
              <div className="prompt-lab__tags-section">
                <div className="prompt-lab__section-title">Extracted Tags</div>
                <div className="prompt-lab__tags">
                  {result.tags.map((tag) => (
                    <span key={tag} className="prompt-lab__tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Provider */}
            <p className="prompt-lab__provider">
              Enhanced by {result.provider} · {result.durationMs}ms
            </p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="prompt-lab__history">
            <div className="prompt-lab__section-title">Recent prompts</div>
            <div className="prompt-lab__history-chips">
              {history.map((h, i) => (
                <button
                  key={i}
                  className="prompt-lab__history-chip"
                  onClick={() => { setPrompt(h.prompt); setMode(h.mode); }}
                  type="button"
                  title={h.prompt}
                >
                  {h.prompt.length > 40 ? h.prompt.slice(0, 40) + '…' : h.prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
