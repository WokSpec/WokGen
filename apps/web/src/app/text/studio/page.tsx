'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

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
const ACCENT = '#10b981';

const CONTENT_TYPES: { id: ContentType; label: string; emoji: string; desc: string }[] = [
  { id: 'headline',     label: 'Headline',     emoji: '✍️',  desc: 'Powerful single-line title' },
  { id: 'tagline',      label: 'Tagline',      emoji: '💡',  desc: 'Memorable brand line' },
  { id: 'blog',         label: 'Blog Post',    emoji: '📝',  desc: 'Structured article' },
  { id: 'product-desc', label: 'Product Desc', emoji: '🛍️',  desc: 'Conversion copy' },
  { id: 'email',        label: 'Email',        emoji: '✉️',  desc: 'Marketing email' },
  { id: 'social',       label: 'Social Post',  emoji: '📱',  desc: 'Platform-ready post' },
  { id: 'code-snippet', label: 'Code Snippet', emoji: '💻',  desc: 'Clean code solution' },
  { id: 'story',        label: 'Story',        emoji: '📖',  desc: 'Creative fiction' },
  { id: 'essay',        label: 'Essay',        emoji: '🎓',  desc: 'Academic writing' },
  { id: 'ad-copy',      label: 'Ad Copy',      emoji: '📢',  desc: 'Direct response' },
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
  const [error, setError]             = useState<string | null>(null);
  const [elapsedMs, setElapsedMs]     = useState(0);
  const [copied, setCopied]           = useState(false);
  const [savedMsg, setSavedMsg]       = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => stopTimer(), []);

  // Update placeholder when content type changes
  useEffect(() => {
    setPrompt(EXAMPLE_PROMPTS[contentType]);
  }, [contentType]);

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || status === 'generating') return;

    setStatus('generating');
    setError(null);
    setResult(null);
    setElapsedMs(0);
    startTimer();

    try {
      const res = await fetch('/api/text/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, contentType, tone, length }),
      });

      const data = await res.json() as TextResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setResult(data);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
          <span style={{ color: ACCENT, fontWeight: 600 }}>Text Studio</span>
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 480px) 1fr',
        gap: 0,
        minHeight: 'calc(100vh - 57px)',
      }}>

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
                <button
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
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{ct.emoji}</div>
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
                <button
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
                <button
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
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === 'generating'}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
              background: !prompt.trim() || status === 'generating' ? 'var(--surface-border)' : ACCENT,
              color: !prompt.trim() || status === 'generating' ? 'var(--text-muted)' : '#fff',
              fontWeight: 700, fontSize: 15,
              cursor: !prompt.trim() || status === 'generating' ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {status === 'generating' ? '✦ Generating…' : '✦ Generate Text'}
          </button>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Elapsed timer */}
          {status === 'generating' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: ACCENT, fontSize: 14 }}>
              <span style={{
                display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${ACCENT}44`, borderTopColor: ACCENT,
                animation: 'spin 0.7s linear infinite',
              }} />
              Generating… {msToSecs(elapsedMs)}
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: '#ef444422', border: '1px solid #ef4444',
              color: '#ef4444', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
                {result.model && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: 11,
                    background: 'var(--surface)', border: '1px solid var(--surface-border)',
                    color: 'var(--text-muted)',
                  }}>
                    {result.model.split('/').pop()}
                  </span>
                )}
              </div>

              {/* Content area */}
              <div style={{
                padding: 20, borderRadius: 10, minHeight: 240,
                background: 'var(--surface)', border: '1px solid var(--surface-border)',
                fontSize: 15, lineHeight: 1.7, color: 'var(--text)',
                whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: '50vh',
                fontFamily: contentType === 'code-snippet' ? 'monospace' : 'inherit',
              }}>
                {result.content}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: copied ? `${ACCENT}22` : 'var(--surface-border)',
                    color: copied ? ACCENT : 'var(--text)', fontSize: 13, cursor: 'pointer',
                    fontWeight: copied ? 600 : 400,
                  }}
                >
                  {copied ? '✓ Copied!' : '⎘ Copy'}
                </button>
                <button
                  onClick={() => downloadText(result.content, `wokgen-text-${Date.now()}.txt`)}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: 'var(--surface-border)', color: 'var(--text)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ⬇ .txt
                </button>
                <button
                  onClick={() => downloadText(result.content, `wokgen-text-${Date.now()}.md`)}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: 'var(--surface-border)', color: 'var(--text)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ⬇ .md
                </button>
                <button
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
                  {savedMsg ? '✓ Saved' : '☆ Save to Gallery'}
                </button>
                <button
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
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, color: 'var(--text-muted)', minHeight: 240,
            }}>
              <span style={{ fontSize: 48, opacity: 0.3 }}>✦</span>
              <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
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
