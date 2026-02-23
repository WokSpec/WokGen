'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type VoiceType = 'natural' | 'character' | 'whisper' | 'energetic' | 'news' | 'deep';
type Language  = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'zh';
type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';

interface VoiceResult {
  audioBase64?: string;
  format?: 'wav' | 'mp3';
  durationEstimate?: number;
  fallback?: boolean;
  text?: string;
  speed?: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = '#f59e0b';

const VOICES: { id: VoiceType; label: string; emoji: string }[] = [
  { id: 'natural',   label: 'Natural',   emoji: '🎙️' },
  { id: 'character', label: 'Character', emoji: '🎭' },
  { id: 'whisper',   label: 'Whisper',   emoji: '🤫' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'news',      label: 'News',      emoji: '📺' },
  { id: 'deep',      label: 'Deep',      emoji: '🎯' },
];

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English'    },
  { id: 'es', label: 'Spanish'    },
  { id: 'fr', label: 'French'     },
  { id: 'de', label: 'German'     },
  { id: 'ja', label: 'Japanese'   },
  { id: 'pt', label: 'Portuguese' },
  { id: 'zh', label: 'Chinese'    },
];

const EXAMPLES: { text: string; voice: VoiceType; label: string }[] = [
  {
    label: 'Welcome',
    text:  'Welcome to WokGen, the future of AI asset generation.',
    voice: 'natural',
  },
  {
    label: 'Adventure',
    text:  'Your quest begins now, brave adventurer!',
    voice: 'character',
  },
  {
    label: 'Breaking News',
    text:  'Breaking news: AI generates unlimited creative assets for teams worldwide.',
    voice: 'news',
  },
];

const SPEED_STOPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function msToSecs(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

// ---------------------------------------------------------------------------
// Audio Player component
// ---------------------------------------------------------------------------
function AudioPlayer({
  src,
  format,
  accent,
}: {
  src: string;
  format: string;
  accent: string;
}) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume]     = useState(1);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else         { void el.play(); setPlaying(true); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const val = Number(e.target.value);
    el.currentTime = val;
    setCurrent(val);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        preload="auto"
      />

      {/* Waveform bars (animated when playing) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, padding: '0 4px' }}>
        {Array.from({ length: 24 }, (_, i) => {
          const h = 10 + ((i % 5) * 6) + ((i % 3) * 4);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: playing ? h : h * 0.4,
                background: accent,
                borderRadius: 2,
                opacity: playing ? 0.85 : 0.35,
                transition: playing
                  ? `height ${0.3 + (i % 4) * 0.1}s ease-in-out ${(i % 5) * 0.05}s`
                  : 'height 0.3s ease',
                animation: playing ? `waveBar${i % 4} ${0.6 + (i % 3) * 0.2}s ease-in-out infinite alternate` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={toggle}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: accent, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: '#000', fontSize: 16,
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 36 }}>
          {formatTime(current)}
        </span>

        <input
          type="range" min={0} max={duration || 1} step={0.01} value={current}
          onChange={handleSeek}
          style={{ flex: 1, accentColor: accent }}
        />

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 36 }}>
          {formatTime(duration)}
        </span>

        {/* Volume */}
        <span style={{ fontSize: 14 }}>🔊</span>
        <input
          type="range" min={0} max={1} step={0.05} value={volume}
          onChange={handleVolume}
          style={{ width: 60, accentColor: accent }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function VoiceStudio() {
  const [text, setText]           = useState('');
  const [voice, setVoice]         = useState<VoiceType>('natural');
  const [language, setLanguage]   = useState<Language>('en');
  const [speed, setSpeed]         = useState(1.0);
  const [useHD, setUseHD]         = useState(false);
  const [status, setStatus]       = useState<GenerationStatus>('idle');
  const [result, setResult]       = useState<VoiceResult | null>(null);
  const [audioSrc, setAudioSrc]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [usingBrowserTTS, setUsingBrowserTTS] = useState(false);
  const [copied, setCopied]       = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  useEffect(() => () => stopTimer(), []);

  const handleGenerate = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || status === 'generating') return;

    setStatus('generating');
    setError(null);
    setResult(null);
    setAudioSrc(null);
    setUsingBrowserTTS(false);
    setElapsedMs(0);
    startTimer();

    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          voice,
          language,
          speed,
          tier: useHD ? 'hd' : 'standard',
        }),
      });

      const data: VoiceResult = await res.json();

      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      setResult(data);

      if (data.fallback) {
        // Use Web Speech API
        setUsingBrowserTTS(true);
        const utterance = new SpeechSynthesisUtterance(data.text ?? trimmed);
        utterance.rate  = data.speed ?? speed;
        utterance.lang  = language;
        window.speechSynthesis.speak(utterance);
        setStatus('done');
      } else if (data.audioBase64 && data.format) {
        const mimeType = data.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
        const blob = new Blob(
          [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
          { type: mimeType },
        );
        setAudioSrc(URL.createObjectURL(blob));
        setStatus('done');
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      stopTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, voice, language, speed, useHD, status]);

  const handleDownload = () => {
    if (!audioSrc || !result?.format) return;
    const a = document.createElement('a');
    a.href = audioSrc;
    a.download = `wokgen-voice-${Date.now()}.${result.format}`;
    a.click();
  };

  const handleRegenerate = () => {
    setStatus('idle');
    void handleGenerate();
  };

  const loadExample = (ex: (typeof EXAMPLES)[number]) => {
    setText(ex.text);
    setVoice(ex.voice);
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
          <span style={{ color: ACCENT, fontWeight: 600 }}>Voice Studio</span>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem',
            background: `${ACCENT}22`, color: ACCENT,
            border: `1px solid ${ACCENT}44`, fontWeight: 600,
          }}>
            BETA
          </span>
        </div>
        <Link
          href="/voice/gallery"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}
        >
          Gallery →
        </Link>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 460px) 1fr',
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

          {/* Text input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Text to convert</label>
              <span style={{
                fontSize: 12,
                color: text.length > 450 ? '#ef4444' : 'var(--text-muted)',
              }}>
                {text.length}/500
              </span>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              placeholder="Enter text to convert to speech..."
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface)', border: '1px solid var(--surface-border)',
                borderRadius: 8, padding: '10px 12px',
                color: 'var(--text)', fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Voice selector */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Voice
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VOICES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13,
                    border: `1px solid ${voice === v.id ? ACCENT : 'var(--surface-border)'}`,
                    background: voice === v.id ? `${ACCENT}22` : 'var(--surface)',
                    color: voice === v.id ? ACCENT : 'var(--text)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    fontWeight: voice === v.id ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{v.emoji}</span> {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Language
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as Language)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: 'var(--surface)', border: '1px solid var(--surface-border)',
                color: 'var(--text)', fontSize: 13, cursor: 'pointer',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Speed slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Speed</label>
              <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>{speed.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={0} max={SPEED_STOPS.length - 1} step={1}
              value={SPEED_STOPS.indexOf(speed) === -1 ? 2 : SPEED_STOPS.indexOf(speed)}
              onChange={e => setSpeed(SPEED_STOPS[Number(e.target.value)])}
              style={{ width: '100%', accentColor: ACCENT }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {SPEED_STOPS.map(s => (
                <span key={s} style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s}×</span>
              ))}
            </div>
          </div>

          {/* HD toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 8,
            background: 'var(--surface)', border: `1px solid ${useHD ? ACCENT + '55' : 'var(--surface-border)'}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>HD Quality</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Powered by Replicate Bark · costs 1 credit
              </div>
            </div>
            <button
              onClick={() => setUseHD(h => !h)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: useHD ? ACCENT : 'var(--surface-border)',
                position: 'relative', transition: 'background 0.2s',
              }}
              aria-label="Toggle HD"
            >
              <span style={{
                position: 'absolute', top: 3, left: useHD ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!text.trim() || status === 'generating'}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
              background: !text.trim() || status === 'generating' ? 'var(--surface-border)' : ACCENT,
              color: !text.trim() || status === 'generating' ? 'var(--text-muted)' : '#000',
              fontWeight: 700, fontSize: 15, cursor: !text.trim() || status === 'generating' ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {status === 'generating' ? '⚡ Generating…' : '⚡ Generate Voice'}
          </button>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Elapsed timer */}
          {status === 'generating' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              color: ACCENT, fontSize: 14,
            }}>
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
              padding: '12px 16px', borderRadius: 8, background: '#ef444422',
              border: '1px solid #ef4444', color: '#ef4444', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Browser TTS note */}
          {usingBrowserTTS && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: `${ACCENT}15`, border: `1px solid ${ACCENT}44`,
              color: ACCENT, fontSize: 13,
            }}>
              🔊 Using browser voice (standard quality)
            </div>
          )}

          {/* Audio player */}
          {audioSrc && result && (
            <div style={{
              padding: 20, borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--surface-border)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                Audio Output
                {result.durationEstimate && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                    ~{result.durationEstimate}s
                  </span>
                )}
              </div>
              <AudioPlayer src={audioSrc} format={result.format ?? 'wav'} accent={ACCENT} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '8px 16px', borderRadius: 6,
                    background: 'var(--surface-border)', border: 'none',
                    color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ⬇ Download WAV
                </button>
                <button
                  onClick={handleRegenerate}
                  style={{
                    padding: '8px 16px', borderRadius: 6,
                    background: 'var(--surface-border)', border: 'none',
                    color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ↻ Regenerate
                </button>
                <button
                  onClick={() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: 6,
                    background: copied ? `${ACCENT}22` : 'var(--surface-border)',
                    border: `1px solid ${copied ? ACCENT : 'transparent'}`,
                    color: copied ? ACCENT : 'var(--text)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {copied ? '✓ Saved' : '☆ Save to Gallery'}
                </button>
              </div>
            </div>
          )}

          {/* Idle state */}
          {status === 'idle' && !result && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 12, color: 'var(--text-muted)',
              minHeight: 240,
            }}>
              <span style={{ fontSize: 48, opacity: 0.3 }}>🎙️</span>
              <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
                Enter text and click <strong style={{ color: ACCENT }}>Generate Voice</strong> to create audio.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Examples panel ─────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--surface-border)',
        padding: '20px 24px',
        background: 'var(--surface)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
          Quick-start examples
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              style={{
                padding: '10px 16px', borderRadius: 8, textAlign: 'left',
                background: 'var(--bg)', border: '1px solid var(--surface-border)',
                color: 'var(--text)', cursor: 'pointer', maxWidth: 280,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--surface-border)')}
            >
              <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, marginBottom: 4 }}>
                {ex.label} · {VOICES.find(v => v.id === ex.voice)?.emoji} {ex.voice}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                &ldquo;{ex.text}&rdquo;
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
