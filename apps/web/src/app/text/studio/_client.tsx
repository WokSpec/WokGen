'use client';




import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { parseApiError, type StudioError } from '@/lib/studio-errors';
import { StudioErrorBanner } from '@/app/_components/StudioErrorBanner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ContentType =
  | 'headline' | 'tagline' | 'blog' | 'product-desc' | 'email'
  | 'social' | 'code-snippet' | 'story' | 'essay' | 'ad-copy';
type Tone   = 'professional' | 'casual' | 'creative' | 'technical' | 'persuasive' | 'playful';
type Length = 'micro' | 'short' | 'medium' | 'long';
type Status = 'idle' | 'generating' | 'done' | 'error';

interface TextResult {
  content: string;
  wordCount: number;
  charCount: number;
  model: string;
  creditsUsed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = 'var(--green)';

const TEXT_STAGES = [
  { delay: 0,     message: 'Connecting to Eral...' },
  { delay: 2000,  message: 'Generating your content...' },
  { delay: 10000, message: 'Finalizing...' },
];

const CONTENT_TYPES: { id: ContentType; label: string; desc: string }[] = [
  { id: 'headline',     label: 'Headline',    desc: 'Powerful single-line title' },
  { id: 'tagline',      label: 'Tagline',     desc: 'Memorable brand line' },
  { id: 'blog',         label: 'Blog Post',   desc: 'Structured article' },
  { id: 'product-desc', label: 'Product Desc',desc: 'Conversion copy' },
  { id: 'email',        label: 'Email',       desc: 'Marketing email' },
  { id: 'social',       label: 'Social Post', desc: 'Platform-ready post' },
  { id: 'code-snippet', label: 'Code Snippet',desc: 'Clean code solution' },
  { id: 'story',        label: 'Story',       desc: 'Creative fiction' },
  { id: 'essay',        label: 'Essay',       desc: 'Academic writing' },
  { id: 'ad-copy',      label: 'Ad Copy',     desc: 'Direct response' },
];

const TONES: { id: Tone; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual',       label: 'Casual'       },
  { id: 'creative',     label: 'Creative'     },
  { id: 'technical',    label: 'Technical'    },
  { id: 'persuasive',   label: 'Persuasive'   },
  { id: 'playful',      label: 'Playful'      },
];

const LENGTHS: { id: Length; label: string; words: string }[] = [
  { id: 'micro',  label: 'Micro',  words: '~50w'   },
  { id: 'short',  label: 'Short',  words: '~200w'  },
  { id: 'medium', label: 'Medium', words: '~500w'  },
  { id: 'long',   label: 'Long',   words: '~1000w' },
];

const EXAMPLE_PROMPTS: Record<ContentType, string> = {
  headline:      'Write a headline for a productivity app for remote teams',
  tagline:       'Tagline for an AI art generation tool',
  blog:          'Write a blog post about the future of AI in game development',
  'product-desc':'Describe a mechanical keyboard for professional developers',
  email:         'Promotional email for a new SaaS analytics dashboard',
  social:        'Instagram post announcing a new product feature launch',
  'code-snippet':'A TypeScript function that debounces a callback with a delay',
  story:         'A short story about an AI that discovers it is dreaming',
  essay:         'Essay on the ethical implications of generative AI in creative industries',
  'ad-copy':     'Ad for a premium coffee subscription for busy professionals',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function msToSecs(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TextStudio() {
  const [contentType, setContentType] = useState<ContentType>('headline');
  const [tone, setTone]               = useState<Tone>('professional');
  const [length, setLength]           = useState<Length>('short');
  const [prompt, setPrompt]           = useState('');
  const [status, setStatus]           = useState<Status>('idle');
  const [result, setResult]           = useState<TextResult | null>(null);
  const [studioError, setStudioError] = useState<StudioError | null>(null);
  const [elapsedMs, setElapsedMs]     = useState(0);
  const [loadingMsg, setLoadingMsg]   = useState(TEXT_STAGES[0].message);
  const [copied, setCopied]           = useState(false);
  const [savedMsg, setSavedMsg]       = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => stopTimer(), []);

  // Cycle through loading stage messages while generating
  useEffect(() => {
    if (status !== 'generating') {
      setLoadingMsg(TEXT_STAGES[0].message);
      return;
    }
    const timers = TEXT_STAGES.slice(1).map(s =>
      setTimeout(() => setLoadingMsg(s.message), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [status]);

  // Update placeholder when content type changes
  useEffect(() => {
    setPrompt(EXAMPLE_PROMPTS[contentType]);
  }, [contentType]);

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || status === 'generating') return;

    setStatus('generating');
    setStudioError(null);
    setResult(null);
    setElapsedMs(0);
    startTimer();

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    // Use SSE streaming for real-time token-by-token output
    try {
      const res = await fetch('/api/text/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, contentType, tone, length, stream: true }),
        signal,
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string; code?: string; retryable?: boolean };
        throw parseApiError({ status: res.status, ...data }, data.error);
      }

      // ReadableStream SSE reader
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let wordCount = 0;
      let charCount = 0;
      let model = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(line.slice(6)) as { token?: string; done?: boolean; wordCount?: number; charCount?: number; model?: string; error?: string };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.token) {
                accumulated += parsed.token;
                // Stream into result as it arrives
                setResult(prev => ({ ...(prev ?? { wordCount: 0, charCount: 0, model: '', creditsUsed: 0 }), content: accumulated }));
              }
              if (parsed.done) {
                wordCount = parsed.wordCount ?? 0;
                charCount = parsed.charCount ?? 0;
                model = parsed.model ?? '';
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
                throw parseErr;
              }
            }
          }
        }
      }

      setResult({ content: accumulated, wordCount, charCount, model, creditsUsed: 0 });
      setStatus('done');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (err && typeof err === 'object' && 'code' in err && 'retryable' in err) {
        setStudioError(err as StudioError);
      } else {
        setStudioError(parseApiError({ status: 0 }, err instanceof Error ? err.message : String(err)));
      }
      setStatus('error');
    } finally {
      stopTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, contentType, tone, length, status]);

  const handleCopy = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-studio-layout">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="app-topbar">
        <div className="app-topbar__left">
          <Link href="/" className="app-topbar__wordmark">
            <span className="app-topbar__wordmark-wok">Wok</span>
            <span className="app-topbar__wordmark-gen">Gen</span>
          </Link>
          <span className="app-topbar__sep">/</span>
          <span className="studio-shell__panel-title">Text mode</span>
          <span className="tag tag-purple">BETA</span>
        </div>
        <div className="app-topbar__right">
          <Link href="/text/gallery" className="btn btn-ghost btn-sm">
            Gallery →
          </Link>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="studio-grid-2col">

        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="text-studio-panel-left">

          {/* Content type grid */}
          <div>
            <label className="text-studio__section-label">Content Type</label>
            <div className="text-studio__type-grid">
              {CONTENT_TYPES.map(ct => (
                <button type="button"
                  key={ct.id}
                  onClick={() => setContentType(ct.id)}
                  className={`text-studio__type-btn${contentType === ct.id ? ' active' : ''}`}
                >
                  <div className="text-studio__type-btn__icon"></div>
                  <div className="text-studio__type-btn__name">{ct.label}</div>
                  <div className="text-studio__type-btn__desc">{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone pills */}
          <div>
            <label className="text-studio__section-label">Tone</label>
            <div className="text-studio__pill-row">
              {TONES.map(t => (
                <button type="button"
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`text-studio__pill${tone === t.id ? ' active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length pills */}
          <div>
            <label className="text-studio__section-label">Length</label>
            <div className="text-studio__length-row">
              {LENGTHS.map(l => (
                <button type="button"
                  key={l.id}
                  onClick={() => setLength(l.id)}
                  className={`text-studio__length-btn${length === l.id ? ' active' : ''}`}
                >
                  <div>{l.label}</div>
                  <div className="text-studio__length-btn__hint">{l.words}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt textarea */}
          <div>
            <label className="text-studio__section-label">Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={EXAMPLE_PROMPTS[contentType]}
              rows={5}
              className="studio-textarea"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Generate button */}
          <button
            type="button"
            data-generate-btn
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === 'generating'}
            aria-label="Generate text"
            className="btn btn-generate"
            style={{ width: '100%' }}
          >
            {status === 'generating' ? 'Generating…' : 'Generate Text'}
          </button>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div className="text-studio-panel-right">

          {/* Loading skeleton */}
          {status === 'generating' && (
            <>
              <div className="text-studio__loading-row">
                <span className="text-studio__spinner" />
                {loadingMsg} {msToSecs(elapsedMs)}
              </div>
              <div className="studio-shimmer-wrap">
                <div className="studio-shimmer-block" style={{ height: 18, width: '92%' }} />
                <div className="studio-shimmer-block" style={{ height: 18, width: '78%' }} />
                <div className="studio-shimmer-block" style={{ height: 18, width: '86%' }} />
                <div className="studio-shimmer-block" style={{ height: 18, width: '62%' }} />
                <div className="studio-shimmer-block" style={{ height: 18, width: '80%' }} />
                <div className="studio-shimmer-block" style={{ height: 18, width: '55%' }} />
                <div className="studio-shimmer-block" style={{ height: 18, width: '70%' }} />
                <div className="studio-shimmer-block" style={{ height: 18, width: '88%' }} />
              </div>
            </>
          )}

          {/* Error */}
          <StudioErrorBanner
            error={studioError}
            onDismiss={() => setStudioError(null)}
            onRetry={handleGenerate}
          />

          {/* Result */}
          {result && (
            <div className="text-studio__result">
              {/* Stats row */}
              <div className="text-studio__stats-row">
                <span className="text-studio__stat text-studio__stat--accent">
                  {result.wordCount} words
                </span>
                <span className="text-studio__stat">
                  {result.charCount} chars
                </span>
                <span className="text-studio__stat">
                  ~{Math.max(1, Math.ceil(result.wordCount / 200))} min read
                </span>
                {result.model && (
                  <span className="text-studio__stat text-studio__stat--sm">
                    {result.model.split('/').pop()}
                  </span>
                )}
                <button type="button"
                  onClick={() => setShowRawMarkdown(v => !v)}
                  className={`text-studio__stat text-studio__stat--toggle${showRawMarkdown ? ' active' : ''}`}
                  style={{ marginLeft: 'auto' }}
                >
                  {showRawMarkdown ? '⬤ Raw MD' : '◎ Rendered'}
                </button>
              </div>

              {/* Content area */}
              <div className={`text-studio__content${showRawMarkdown || contentType === 'code-snippet' ? ' mono' : ''}`}>
                {result.content}
              </div>

              {/* Action buttons */}
              <div className="text-studio__actions">
                <button type="button"
                  onClick={handleCopy}
                  className={`btn btn-secondary${copied ? ' btn--active' : ''}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button type="button"
                  onClick={() => downloadText(result.content, `wokgen-text-${Date.now()}.txt`)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  ⬇ .txt
                </button>
                <button type="button"
                  onClick={() => downloadText(result.content, `wokgen-text-${Date.now()}.md`)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  ⬇ .md
                </button>
                <button type="button"
                  onClick={() => {
                    setSavedMsg(true);
                    setTimeout(() => setSavedMsg(false), 2000);
                  }}
                  className={`btn btn-secondary${savedMsg ? ' btn--active' : ''}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  {savedMsg ? 'Saved' : 'Save to Gallery'}
                </button>
                <button type="button"
                  onClick={() => { setStatus('idle'); void handleGenerate(); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  ↻ Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Idle state */}
          {status === 'idle' && !result && (
            <div className="studio-empty-canvas">
              <span className="studio-empty-canvas__icon">T</span>
              <p className="studio-empty-canvas__title">Generate your first text</p>
              <p className="studio-empty-canvas__desc">
                Choose a content type, set your tone and length, then click{' '}
                <strong className="text-studio__strong">Generate Text</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
