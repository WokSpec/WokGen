'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { parseApiError, type StudioError } from '@/lib/studio-errors';
import { StudioErrorBanner } from '@/app/_components/StudioErrorBanner';
import { preprocessTextForTTS, detectContentType, selectOptimalVoice } from '@/lib/tts-intelligence';
import type { VoiceStyle, ContentType } from '@/lib/tts-intelligence';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VOICE_STYLES: { id: VoiceStyle; label: string; icon: string; desc: string }[] = [
  { id: 'natural',   label: 'Natural',   icon: '🎙️', desc: 'Warm and conversational' },
  { id: 'character', label: 'Character', icon: '🎭', desc: 'Expressive and animated' },
  { id: 'whisper',   label: 'Whisper',   icon: '🤫', desc: 'Soft and intimate' },
  { id: 'energetic', label: 'Energetic', icon: '⚡', desc: 'Dynamic and exciting' },
  { id: 'news',      label: 'News',      icon: '📰', desc: 'Clear and authoritative' },
  { id: 'asmr',      label: 'ASMR',      icon: '✨', desc: 'Gentle and soothing' },
  { id: 'narrative', label: 'Narrative', icon: '📖', desc: 'Rich storytelling' },
  { id: 'deep',      label: 'Deep',      icon: '🎸', desc: 'Powerful baritone' },
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' },
  { id: 'it', label: 'Italian' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'pl', label: 'Polish' },
  { id: 'ja', label: 'Japanese' },
  { id: 'ko', label: 'Korean' },
  { id: 'zh', label: 'Chinese' },
  { id: 'hi', label: 'Hindi' },
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  narrative: 'Narrative',
  technical: 'Technical',
  marketing: 'Marketing',
  dialogue:  'Dialogue',
  news:      'News',
  casual:    'Casual',
};

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  narrative: '#a78bfa',
  technical: '#60a5fa',
  marketing: '#fb923c',
  dialogue:  '#34d399',
  news:      '#f59e0b',
  casual:    '#f472b6',
};

const PROVIDER_LABELS: Record<string, string> = {
  elevenlabs:  'ElevenLabs ✦',
  openai:      'OpenAI TTS',
  huggingface: 'Kokoro',
};

const PROVIDER_COLORS: Record<string, string> = {
  elevenlabs:  '#f59e0b',
  openai:      '#22c55e',
  huggingface: '#60a5fa',
};

const ACCENT = '#f59e0b';
const MAX_CHARS = 10000; // shown in UI; actual server limit depends on tier

const EXAMPLES = [
  {
    label: '🎙️ Product Intro',
    text: "Welcome to WokGen — the world's most powerful AI asset generation platform. Generate stunning pixel art, professional brand kits, and production-ready UI components in seconds.",
    style: 'natural' as VoiceStyle,
  },
  {
    label: '🐉 Game Narration',
    text: "The ancient dragon unfurled its wings across the crimson sky. You've been chosen, young warrior. Your quest begins... now.",
    style: 'narrative' as VoiceStyle,
  },
  {
    label: '📰 News Script',
    text: "Breaking: WokSpec announces Eral 7c — an AI companion that doesn't just answer questions, it controls your entire creative workflow.",
    style: 'news' as VoiceStyle,
  },
  {
    label: '⚡ Notification',
    text: "Hey! Your new asset pack just finished generating! Check out these amazing pixel art characters — they turned out incredible!",
    style: 'energetic' as VoiceStyle,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function VoiceStudioPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const userPlan: string = (session?.user as { plan?: string } | undefined)?.plan ?? 'free';

  const [text, setText]             = useState('');
  const [style, setStyle]           = useState<VoiceStyle>('natural');
  const [hd, setHd]                 = useState(false);
  const [language, setLanguage]     = useState('en');
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl]     = useState<string | null>(null);
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'wav'>('mp3');
  const [voiceName, setVoiceName]   = useState('');
  const [provider, setProvider]     = useState('');
  const [contentType, setContentType] = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [studioError, setStudioError] = useState<StudioError | null>(null);

  // Emotion controls
  const [emotionIntensity, setEmotionIntensity] = useState(0.3);
  const [voiceClarity, setVoiceClarity]         = useState(0.75);
  const [naturalPauses, setNaturalPauses]       = useState(true);

  // Voice preview
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const charsLeft = MAX_CHARS - text.length;
  const isOverLimit = charsLeft < 0;

  // Live content-type preview (client-side only for UX feedback)
  const liveContentType = text.trim()
    ? detectContentType(preprocessTextForTTS(text))
    : null;
  const liveVoice = text.trim()
    ? selectOptimalVoice(style, liveContentType!)
    : null;

  async function handleGenerate() {
    if (!text.trim() || generating || isOverLimit) return;
    setGenerating(true);
    setError(null);
    setStudioError(null);
    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style, hd, language, emotionIntensity, voiceClarity, naturalPauses }),
      });

      // ElevenLabs streaming: content-type is audio/mpeg, not JSON
      const ct = res.headers.get('Content-Type') ?? '';
      if (ct.startsWith('audio/')) {
        if (!res.ok) {
          setError('Audio generation failed');
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioFormat('mp3');
        setProvider(res.headers.get('X-Provider') ?? 'elevenlabs');
        setVoiceName(res.headers.get('X-Voice-Id') ? 'ElevenLabs' : 'ElevenLabs');
        setContentType('');
        return;
      }

      const data = await res.json() as {
        audio?: string;
        format?: string;
        provider?: string;
        voice?: string;
        contentType?: string;
        charCount?: number;
        error?: string;
        code?: string;
        limit?: number;
      };
      if (!res.ok) {
        const parsed = parseApiError({ status: res.status, error: data.error });
        setStudioError(parsed);
        return;
      }
      setAudioUrl(data.audio ?? null);
      setAudioFormat((data.format ?? 'mp3') as 'mp3' | 'wav');
      setVoiceName(data.voice ?? '');
      setProvider(data.provider ?? '');
      setContentType(data.contentType ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `wokgen-voice-${Date.now()}.${audioFormat}`;
    a.click();
  }

  function handleClear() {
    setText('');
    setAudioUrl(null);
    setAudioFormat('mp3');
    setVoiceName('');
    setProvider('');
    setContentType('');
    setError(null);
    setStudioError(null);
  }

  function loadExample(ex: typeof EXAMPLES[number]) {
    setText(ex.text);
    setStyle(ex.style);
    setAudioUrl(null);
    setError(null);
    setStudioError(null);
  }

  async function handleVoicePreview() {
    if (previewPlaying) {
      previewAudioRef.current?.pause();
      setPreviewPlaying(false);
      return;
    }
    try {
      const res = await fetch('/api/voice/voices');
      const { voices } = await res.json() as { voices: Array<{ id: string; preview_url: string | null }> };
      const voice = voices.find(v => v.id === liveVoice?.id);
      if (!voice?.preview_url) return;
      const audio = new Audio(voice.preview_url);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewPlaying(false);
      audio.onerror = () => setPreviewPlaying(false);
      setPreviewPlaying(true);
      await audio.play();
    } catch {
      setPreviewPlaying(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans, system-ui)',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--surface-border)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/voice" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>
            ← Voice
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Voice Studio</span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 4,
              background: `${ACCENT}22`,
              border: `1px solid ${ACCENT}44`,
              color: ACCENT,
              fontWeight: 600,
            }}
          >
            ElevenLabs
          </span>
        </div>
        <Link
          href="/voice/gallery"
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--surface-border)',
          }}
        >
          Gallery →
        </Link>
      </div>

      {/* Main layout */}
      <div
        style={{ minHeight: 'calc(100vh - 60px)' }}
        className="studio-grid-2col"
      >
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div
          style={{
            borderRight: '1px solid var(--surface-border)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
          }}
        >
          {/* Voice style selector */}
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 10,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Voice Style
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              {VOICE_STYLES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setStyle(v.id)}
                  title={v.desc}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 8,
                    border: `1px solid ${style === v.id ? ACCENT : 'var(--surface-border)'}`,
                    background: style === v.id ? `${ACCENT}18` : 'var(--surface)',
                    color: style === v.id ? ACCENT : 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{v.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{v.label}</span>
                </button>
              ))}
            </div>

            {/* Selected voice preview */}
            {liveVoice && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🎤</span>
                <span>
                  Voice: <strong style={{ color: 'var(--text)' }}>{liveVoice.name}</strong>
                  {liveContentType && (
                    <span style={{ marginLeft: 6 }}>
                      · detected{' '}
                      <strong style={{ color: CONTENT_TYPE_COLORS[liveContentType] }}>
                        {CONTENT_TYPE_LABELS[liveContentType]}
                      </strong>
                    </span>
                  )}
                </span>
                <button
                  onClick={handleVoicePreview}
                  title={previewPlaying ? 'Stop preview' : 'Preview voice'}
                  style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--surface-border)',
                    background: previewPlaying ? `${ACCENT}22` : 'transparent',
                    color: previewPlaying ? ACCENT : 'var(--text-muted)',
                    fontSize: 11,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {previewPlaying ? '■ Stop' : '▶ Preview'}
                </button>
              </div>
            )}
          </div>

          {/* Text input */}
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Text</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: isOverLimit ? '#f87171' : charsLeft < 500 ? ACCENT : 'var(--text-muted)',
                }}
              >
                {isOverLimit ? `${Math.abs(charsLeft)} over limit` : `${charsLeft.toLocaleString()} left`}
              </span>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter text to synthesize… (Markdown is stripped automatically)"
              rows={7}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                background: 'var(--surface)',
                border: `1px solid ${isOverLimit ? '#f87171' : 'var(--surface-border)'}`,
                color: 'var(--text)',
                fontSize: 13,
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Language selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Language
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            {hd && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                ✦ HD uses ElevenLabs multilingual v2 — all languages supported
              </p>
            )}
          </div>

          {/* HD toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 8,
              background: 'var(--surface)',
              border: `1px solid ${hd ? ACCENT + '55' : 'var(--surface-border)'}`,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>HD Quality</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                ElevenLabs multilingual v2 · costs 1 credit
              </div>
            </div>
            <button
              onClick={() => setHd(h => !h)}
              aria-label="Toggle HD"
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: hd ? ACCENT : 'var(--surface-border)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: hd ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          {/* Emotion controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Voice Controls
            </div>

            {/* Emotion Intensity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Emotion Intensity</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emotionIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={emotionIntensity}
                onChange={e => setEmotionIntensity(Number(e.target.value))}
                style={{ width: '100%', accentColor: ACCENT }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Neutral</span><span>Expressive</span>
              </div>
            </div>

            {/* Voice Clarity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Voice Clarity</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{voiceClarity.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={voiceClarity}
                onChange={e => setVoiceClarity(Number(e.target.value))}
                style={{ width: '100%', accentColor: ACCENT }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Warm</span><span>Crisp</span>
              </div>
            </div>

            {/* Natural Pauses toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--surface)',
                border: `1px solid ${naturalPauses ? ACCENT + '55' : 'var(--surface-border)'}`,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Natural Pauses</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  Auto-insert pauses at punctuation
                </div>
              </div>
              <button
                onClick={() => setNaturalPauses(p => !p)}
                aria-label="Toggle natural pauses"
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: naturalPauses ? ACCENT : 'var(--surface-border)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 2,
                  left: naturalPauses ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </div>

          {/* Generate + Clear */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleGenerate}
              disabled={!text.trim() || generating || isOverLimit}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 8,
                border: 'none',
                background:
                  !text.trim() || generating || isOverLimit
                    ? 'var(--surface-border)'
                    : ACCENT,
                color:
                  !text.trim() || generating || isOverLimit
                    ? 'var(--text-muted)'
                    : '#000',
                fontWeight: 700,
                fontSize: 14,
                cursor:
                  !text.trim() || generating || isOverLimit
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: `2px solid #00000044`,
                      borderTopColor: '#000',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Generating…
                </span>
              ) : (
                '⚡ Generate Voice'
              )}
            </button>
            {(text || audioUrl) && (
              <button
                onClick={handleClear}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface)',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                title="Clear all"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Error banners */}
          <StudioErrorBanner
            error={studioError}
            onDismiss={() => setStudioError(null)}
            onRetry={handleGenerate}
          />
          {error && !studioError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#f871711a',
                border: '1px solid #f8717155',
                color: '#f87171',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* Audio player */}
          {audioUrl && (
            <div
              style={{
                borderRadius: 12,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Generated Audio</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    {voiceName && <><strong style={{ color: 'var(--text)' }}>{voiceName}</strong> voice</>}
                    {provider && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: `${PROVIDER_COLORS[provider] ?? '#aaa'}22`,
                          border: `1px solid ${PROVIDER_COLORS[provider] ?? '#aaa'}44`,
                          color: PROVIDER_COLORS[provider] ?? 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        {PROVIDER_LABELS[provider] ?? provider}
                      </span>
                    )}
                    {contentType && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: `${CONTENT_TYPE_COLORS[contentType as ContentType] ?? '#aaa'}22`,
                          border: `1px solid ${CONTENT_TYPE_COLORS[contentType as ContentType] ?? '#aaa'}44`,
                          color: CONTENT_TYPE_COLORS[contentType as ContentType] ?? 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        {CONTENT_TYPE_LABELS[contentType as ContentType] ?? contentType}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    background: '#4f46e5',
                    border: 'none',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  ⬇ Download MP3
                </button>
              </div>

              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                style={{ width: '100%', borderRadius: 8 }}
              />
            </div>
          )}

          {/* Idle state */}
          {!audioUrl && !generating && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                color: 'var(--text-muted)',
                minHeight: 240,
              }}
            >
              <span style={{ fontSize: 52, opacity: 0.25 }}>🎙️</span>
              <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 1.6, margin: 0 }}>
                Enter text and click{' '}
                <strong style={{ color: ACCENT }}>Generate Voice</strong> to create
                premium audio.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, opacity: 0.6 }}>
                Powered by ElevenLabs · Near-human quality TTS
              </p>
            </div>
          )}

          {/* Generating state */}
          {generating && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                minHeight: 240,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `3px solid ${ACCENT}33`,
                  borderTopColor: ACCENT,
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Synthesizing audio with ElevenLabs…
              </p>
            </div>
          )}

          {/* Examples */}
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Quick-start examples
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => loadExample(ex)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--surface-border)')}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Cloning (logged-in users only) */}
          {userId && (
            <div
              style={{
                borderRadius: 10,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface)',
                padding: 20,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🎤 Voice Cloning</div>
              {userPlan === 'pro' || userPlan === 'max' ? (
                <div>
                  {/* TODO: Implement voice cloning — upload WAV (10–30s), call /api/voice/clone */}
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                    Upload a 10–30 second WAV sample to clone your voice.
                  </p>
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: 8,
                      border: '2px dashed var(--surface-border)',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                    }}
                  >
                    WAV upload — coming soon
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                    Clone any voice from a short audio sample. Available on Pro plan.
                  </p>
                  <Link
                    href="/pricing"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 7,
                      background: `${ACCENT}18`,
                      border: `1px solid ${ACCENT}55`,
                      color: ACCENT,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    🔒 Upgrade to Pro →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .studio-grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
