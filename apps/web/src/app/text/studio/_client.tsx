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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid var(--surface-border)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>
            WokGen
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: ACCENT, fontWeight: 600 }}>Text mode</span>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem',
            background: `${ACCENT}22`, color: ACCENT,
            border: `1px solid ${ACCENT}44`, fontWeight: 600,
          }}>BETA</span>
        </div>
        <Link
          href="/text/gallery"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}
        >
          Gallery →
        </Link>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="studio-grid-2col">

        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div style={{
          borderRight: '1px solid var(--surface-border)',
          padding: 24,
          display: 'flex', flexDirection: 'column', gap: 20,
          overflowY: 'auto',
        }}>

          {/* Content type grid */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Content Type
            </label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
            }}>
              {CONTENT_TYPES.map(ct => (
                <button type="button"
                  key={ct.id}
                  onClick={() => setContentType(ct.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                    border: `1px solid ${contentType === ct.id ? ACCENT : 'var(--surface-border)'}`,
                    background: contentType === ct.id ? `${ACCENT}18` : 'var(--surface)',
                    color: contentType === ct.id ? ACCENT : 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 3 }}></div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{ct.label}</div>
                  <div style={{ fontSize: 11, color: contentType === ct.id ? `${ACCENT}cc` : 'var(--text-muted)', marginTop: 1 }}>
                    {ct.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone pills */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Tone
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TONES.map(t => (
                <button type="button"
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12,
                    border: `1px solid ${tone === t.id ? ACCENT : 'var(--surface-border)'}`,
                    background: tone === t.id ? `${ACCENT}22` : 'var(--surface)',
                    color: tone === t.id ? ACCENT : 'var(--text)',
                    cursor: 'pointer', fontWeight: tone === t.id ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length pills */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Length
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {LENGTHS.map(l => (
                <button type="button"
                  key={l.id}
                  onClick={() => setLength(l.id)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12,
                    border: `1px solid ${length === l.id ? ACCENT : 'var(--surface-border)'}`,
                    background: length === l.id ? `${ACCENT}22` : 'var(--surface)',
                    color: length === l.id ? ACCENT : 'var(--text)',
                    cursor: 'pointer', fontWeight: length === l.id ? 600 : 400,
                    transition: 'all 0.15s', textAlign: 'center',
                  }}
                >
                  <div>{l.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{l.words}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt textarea */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={EXAMPLE_PROMPTS[contentType]}
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface)', border: '1px solid var(--surface-border)',
                borderRadius: 8, padding: '10px 12px',
                color: 'var(--text)', fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Generate button */}
          <button
            type="button"
            data-generate-btn
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === 'generating'}
            aria-label="Generate text"
            style={{
              width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
              background: !prompt.trim() || status === 'generating' ? 'var(--surface-border)' : ACCENT,
              color: !prompt.trim() || status === 'generating' ? 'var(--text-muted)' : '#fff',
              fontWeight: 700, fontSize: 15,
              cursor: !prompt.trim() || status === 'generating' ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {status === 'generating' ? 'Generating…' : 'Generate Text'}
          </button>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Loading skeleton */}
          {status === 'generating' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: ACCENT, fontSize: 14 }}>
                <span style={{
                  display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                  border: `2px solid ${ACCENT}44`, borderTopColor: ACCENT,
                  animation: 'spin 0.7s linear infinite',
                }} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 4, fontSize: 12,
                  background: `${ACCENT}18`, color: ACCENT, fontWeight: 600,
                }}>
                  {result.wordCount} words
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 4, fontSize: 12,
                  background: 'var(--surface)', border: '1px solid var(--surface-border)',
                  color: 'var(--text-muted)',
                }}>
                  {result.charCount} chars
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 4, fontSize: 12,
                  background: 'var(--surface)', border: '1px solid var(--surface-border)',
                  color: 'var(--text-muted)',
                }}>
                  ~{Math.max(1, Math.ceil(result.wordCount / 200))} min read
                </span>
                {result.model && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: 11,
                    background: 'var(--surface)', border: '1px solid var(--surface-border)',
                    color: 'var(--text-muted)',
                  }}>
                    {result.model.split('/').pop()}
                  </span>
                )}
                <button type="button"
                  onClick={() => setShowRawMarkdown(v => !v)}
                  style={{
                    marginLeft: 'auto', padding: '3px 10px', borderRadius: 4, fontSize: 12,
                    background: showRawMarkdown ? `${ACCENT}22` : 'var(--surface)',
                    border: `1px solid ${showRawMarkdown ? ACCENT : 'var(--surface-border)'}`,
                    color: showRawMarkdown ? ACCENT : 'var(--text-muted)',
                    cursor: 'pointer', fontWeight: showRawMarkdown ? 600 : 400,
                  }}
                >
                  {showRawMarkdown ? '⬤ Raw MD' : '◎ Rendered'}
                </button>
              </div>

              {/* Content area */}
              <div style={{
                padding: 20, borderRadius: 10, minHeight: 240,
                background: 'var(--surface)', border: '1px solid var(--surface-border)',
                fontSize: 15, lineHeight: 1.7, color: 'var(--text)',
                whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: '50vh',
                fontFamily: showRawMarkdown || contentType === 'code-snippet' ? 'monospace' : 'inherit',
              }}>
                {result.content}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button"
                  onClick={handleCopy}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: copied ? `${ACCENT}22` : 'var(--surface-border)',
                    color: copied ? ACCENT : 'var(--text)', fontSize: 13, cursor: 'pointer',
                    fontWeight: copied ? 600 : 400,
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button type="button"
                  onClick={() => downloadText(result.content, `wokgen-text-${Date.now()}.txt`)}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: 'var(--surface-border)', color: 'var(--text)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ⬇ .txt
                </button>
                <button type="button"
                  onClick={() => downloadText(result.content, `wokgen-text-${Date.now()}.md`)}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: 'var(--surface-border)', color: 'var(--text)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ⬇ .md
                </button>
                <button type="button"
                  onClick={() => {
                    setSavedMsg(true);
                    setTimeout(() => setSavedMsg(false), 2000);
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: savedMsg ? `${ACCENT}22` : 'var(--surface-border)',
                    color: savedMsg ? ACCENT : 'var(--text)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {savedMsg ? 'Saved' : 'Save to Gallery'}
                </button>
                <button type="button"
                  onClick={() => { setStatus('idle'); void handleGenerate(); }}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: 'var(--surface-border)', color: 'var(--text)',
                    fontSize: 13, cursor: 'pointer',
                  }}
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
                <strong style={{ color: ACCENT }}>Generate Text</strong>.
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
