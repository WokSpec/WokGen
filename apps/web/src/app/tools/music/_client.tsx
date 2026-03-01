'use client';

import { useState, useCallback, useEffect } from 'react';

interface MusicResult {
  audioUrl: string;
  duration: number;
  prompt: string;
  durationMs: number;
}

interface HistoryEntry {
  prompt: string;
  audioUrl: string;
  duration: number;
  ts: number;
}

const EXAMPLES = ['upbeat electronic', 'calm ambient piano', 'epic orchestral', 'lo-fi hip hop', 'dark synthwave'];
const MIN_SEC = 5;
const MAX_SEC = 30;
const MUSIC_HISTORY_KEY = 'music-gen-history';

export function MusicClient() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MusicResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MUSIC_HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryEntry[]);
    } catch {}
  }, []);

  const saveHistory = useCallback((r: MusicResult) => {
    const entry: HistoryEntry = { prompt: r.prompt, audioUrl: r.audioUrl, duration: r.duration, ts: Date.now() };
    setHistory((prev) => {
      const next = [entry, ...prev.filter((h) => h.audioUrl !== r.audioUrl)].slice(0, 3);
      try { localStorage.setItem(MUSIC_HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }
      const data = await response.json() as MusicResult;
      setResult(data);
      saveHistory(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Music generation failed');
    } finally {
      setLoading(false);
    }
  }, [prompt, duration, saveHistory]);

  return (
    <div className="tool-music">
      <div className="tool-page__inner">
        <div className="tool-page__header">
          <h1 className="tool-page__title">AI Music Generator</h1>
          <p className="tool-page__subtitle">Generate background music from text descriptions</p>
        </div>

        <div className="tool-page__card">
          <label className="tool-page__label">Describe the music</label>
          <textarea
            className="tool-page__textarea"
            placeholder="Describe the music..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />

          {/* Example chips */}
          <div className="tool-music__examples">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="tool-music__example-chip"
                onClick={() => setPrompt(ex)}
                type="button"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Duration slider */}
          <div style={{ marginTop: 16 }}>
            <label className="tool-page__label">
              Duration: <strong>{duration}s</strong>
            </label>
            <input
              type="range"
              min={MIN_SEC}
              max={MAX_SEC}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="tool-music__slider"
            />
            <div className="tool-music__slider-labels">
              <span>{MIN_SEC}s</span><span>{MAX_SEC}s</span>
            </div>
          </div>

          {error && <div className="tool-page__error">{error}</div>}

          <button
            className="tool-page__btn-primary"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            type="button"
            style={{ marginTop: 16 }}
          >
            {loading ? (
              <span className="tool-music__loading">
                <span className="waveform-bars" aria-hidden="true">
                  <span /><span /><span /><span /><span /><span /><span />
                </span>
                Composing…
              </span>
            ) : 'Generate Music'}
          </button>
        </div>

        {result && (
          <div className="tool-page__card tool-music__player">
            <div className="tool-page__result-header">
              <span className="tool-page__result-title">{result.prompt}</span>
              <span className="tool-page__confidence-badge">{result.duration}s</span>
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={result.audioUrl} className="tool-music__audio" />
            <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
              <a
                href={result.audioUrl}
                download="music.wav"
                className="tool-page__btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex' }}
              >
                ↓ Download
              </a>
              <span className="tool-page__note" style={{ margin: 0 }}>{result.durationMs}ms</span>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="tool-page__card">
            <div className="tool-page__result-title" style={{ marginBottom: 12 }}>Recent tracks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((h, i) => (
                <div key={i} className="tool-music__history-item">
                  <div>
                    <span className="tool-music__history-prompt">{h.prompt}</span>
                    <span className="tool-page__note" style={{ marginLeft: 8 }}>{h.duration}s</span>
                  </div>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={h.audioUrl} style={{ height: 28 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="tool-page__note">
          Powered by MusicGen (Meta) via HuggingFace — Free, ~30s generation time
        </p>
      </div>
    </div>
  );
}
