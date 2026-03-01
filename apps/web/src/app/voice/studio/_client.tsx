'use client';




import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { parseApiError, type StudioError } from '@/lib/studio-errors';
import { StudioErrorBanner } from '@/app/_components/StudioErrorBanner';
import { preprocessTextForTTS, detectContentType, selectOptimalVoice } from '@/lib/tts-intelligence';
import type { VoiceStyle, ContentType } from '@/lib/tts-intelligence';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VOICE_STYLES: { id: VoiceStyle; label: string; icon?: string; desc: string }[] = [
  { id: 'natural',   label: 'Natural',   desc: 'Warm and conversational' },
  { id: 'character', label: 'Character', desc: 'Expressive and animated' },
  { id: 'whisper',   label: 'Whisper',   desc: 'Soft and intimate' },
  { id: 'energetic', label: 'Energetic', desc: 'Dynamic and exciting' },
  { id: 'news',      label: 'News',      desc: 'Clear and authoritative' },
  { id: 'asmr',      label: 'ASMR',      desc: 'Gentle and soothing' },
  { id: 'narrative', label: 'Narrative', desc: 'Rich storytelling' },
  { id: 'deep',      label: 'Deep',      desc: 'Powerful baritone' },
];

// Character presets — map to existing VoiceStyle values with descriptive labels
const CHARACTER_PRESETS: { label: string; style: VoiceStyle; desc: string }[] = [
  { label: 'Brand Voice',  style: 'natural',   desc: 'Stable, confident' },
  { label: 'Narrator',     style: 'narrative', desc: 'Measured, authoritative' },
  { label: 'Demo Host',    style: 'energetic', desc: 'Energetic, direct' },
  { label: 'News Anchor',  style: 'news',      desc: 'Neutral, formal' },
  { label: 'Deep Voice',   style: 'deep',      desc: 'Low, resonant' },
  { label: 'ASMR',         style: 'asmr',      desc: 'Soft, close' },
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
  narrative: 'var(--accent)',
  technical: 'var(--blue)',
  marketing: 'var(--orange)',
  dialogue:  'var(--green)',
  news:      'var(--yellow)',
  casual:    'var(--pink)',
};

const PROVIDER_LABELS: Record<string, string> = {
  elevenlabs:  'ElevenLabs',
  openai:      'OpenAI TTS',
  huggingface: 'Kokoro',
};

const PROVIDER_COLORS: Record<string, string> = {
  elevenlabs:  'var(--yellow)',
  openai:      'var(--green)',
  huggingface: 'var(--blue)',
};

const ACCENT = 'var(--accent)';
const ACCENT_HEX = 'var(--accent)'; // fallback for alpha compositing
const MAX_CHARS = 10000; // shown in UI; actual server limit depends on tier

const EXAMPLES = [
  {
    label: 'Product Intro',
    text: "Welcome to WokGen — the world's most powerful AI asset generation platform. Generate stunning pixel art, professional brand kits, and production-ready UI components in seconds.",
    style: 'natural' as VoiceStyle,
  },
  {
    label: 'Game Narration',
    text: "The ancient dragon unfurled its wings across the crimson sky. You've been chosen, young warrior. Your quest begins... now.",
    style: 'narrative' as VoiceStyle,
  },
  {
    label: 'News Script',
    text: "Breaking: WokSpec announces Eral — an AI companion that doesn't just answer questions, it controls your entire creative workflow.",
    style: 'news' as VoiceStyle,
  },
  {
    label: 'Notification',
    text: "Hey! Your new asset pack just finished generating! Check out these amazing pixel art characters — they turned out incredible!",
    style: 'energetic' as VoiceStyle,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function VoiceStudioInner() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const userPlan: string = (session?.user as { plan?: string } | undefined)?.plan ?? 'free';
  const searchParams = useSearchParams();

  const [text, setText]             = useState(() => searchParams.get('text') ?? '');
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
  // Track blob URLs for cleanup to prevent memory leaks
  const blobUrlRef = useRef<string | null>(null);

  // Revoke previous blob URL when a new audio URL is set or on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

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
        // Revoke previous blob URL before creating new one
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
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
    // Revoke blob URL to free memory
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
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
    // Revoke blob URL on example load
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
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
    <div className="text-studio-layout"
      style={{ fontFamily: 'var(--font-sans, system-ui)' }}
    >
      {/* Main layout */}
      <div
        style={{ minHeight: 'calc(100vh - 60px)' }}
        className="studio-grid-2col"
      >
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="studio-sidebar">
          {/* Panel header */}
          <div className="studio-shell__panel-header">
            <span className="studio-shell__panel-title">Voice Studio</span>
            <div className="studio-shell__panel-actions" />
          </div>
          <div className="voice-studio-body">
          {/* Voice style selector */}
          <div>
            <div className="voice-studio__section-label">Voice Style</div>
            <div className="voice-studio__style-grid">
              {VOICE_STYLES.map(v => (
                <button type="button"
                  key={v.id}
                  onClick={() => setStyle(v.id)}
                  title={v.desc}
                  className={`voice-studio__style-btn${style === v.id ? ' active' : ''}`}
                >
                  <span className="voice-studio__style-btn__icon">{v.icon}</span>
                  <span className="voice-studio__style-btn__label">{v.label}</span>
                </button>
              ))}
            </div>

            {/* Character presets — quick access shortcuts for common use cases */}
            <div style={{ marginTop: 12 }}>
              <div className="voice-studio__section-label" style={{ marginBottom: 6, fontSize: '0.68rem' }}>
                Character Presets
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CHARACTER_PRESETS.map(p => (
                  <button type="button"
                    key={p.label}
                    onClick={() => setStyle(p.style)}
                    title={p.desc}
                    className="btn btn--ghost btn--sm"
                    style={{
                      fontSize: 11,
                      borderColor: style === p.style ? ACCENT : 'var(--surface-border)',
                      color: style === p.style ? ACCENT : 'var(--text-muted)',
                      background: style === p.style ? 'var(--accent-subtle)' : 'transparent',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected voice preview */}
            {liveVoice && (
              <div className="voice-studio__voice-preview">
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
                <button type="button"
                  onClick={handleVoicePreview}
                  title={previewPlaying ? 'Stop preview' : 'Preview voice'}
                  className={`btn btn-secondary${previewPlaying ? ' btn--active' : ''}`}
                  style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.68rem', flexShrink: 0 }}
                >
                  {previewPlaying ? '■ Stop' : '▶ Preview'}
                </button>
              </div>
            )}
          </div>

          {/* Text input */}
          <div>
            <div className="voice-studio__text-header">
              <span>Text</span>
              <span className={`voice-studio__char-count${isOverLimit ? ' voice-studio__char-count--danger' : charsLeft < 500 ? ' voice-studio__char-count--warn' : ''}`}>
                {isOverLimit ? `${Math.abs(charsLeft)} over limit` : `${charsLeft.toLocaleString()} left`}
              </span>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter text to synthesize… (Markdown is stripped automatically)"
              rows={7}
              className="studio-textarea"
              style={{
                width: '100%', boxSizing: 'border-box',
                borderColor: isOverLimit ? 'var(--danger)' : undefined,
              }}
            />
          </div>

          {/* Language selector */}
          <div>
            <label className="voice-studio__section-label" style={{ display: 'block' }}>
              Language
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="studio-select"
              style={{ width: '100%' }}
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            {hd && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                HD uses ElevenLabs multilingual v2 — all languages supported
              </p>
            )}
          </div>

          {/* HD toggle */}
          <div className={`voice-studio__toggle-row${hd ? ' active' : ''}`}>
            <div>
              <div className="voice-studio__toggle-title">HD Quality</div>
              <div className="voice-studio__toggle-desc">
                ElevenLabs multilingual v2 · costs 1 credit
              </div>
            </div>
            <button type="button"
              onClick={() => setHd(h => !h)}
              aria-label="Toggle HD"
              className={`voice-studio__toggle-switch${hd ? ' on' : ' off'}`}
            />
          </div>

          {/* Emotion controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="voice-studio__section-label">Voice Controls</div>

            {/* Emotion Intensity */}
            <div className="voice-studio__range-row">
              <div className="voice-studio__range-header">
                <span className="voice-studio__range-label">Emotion Intensity</span>
                <span className="voice-studio__range-val">{emotionIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={emotionIntensity}
                onChange={e => setEmotionIntensity(Number(e.target.value))}
                className="studio-range"
              />
              <div className="voice-studio__range-hints">
                <span>Neutral</span><span>Expressive</span>
              </div>
            </div>

            {/* Voice Clarity */}
            <div className="voice-studio__range-row">
              <div className="voice-studio__range-header">
                <span className="voice-studio__range-label">Voice Clarity</span>
                <span className="voice-studio__range-val">{voiceClarity.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={voiceClarity}
                onChange={e => setVoiceClarity(Number(e.target.value))}
                className="studio-range"
              />
              <div className="voice-studio__range-hints">
                <span>Warm</span><span>Crisp</span>
              </div>
            </div>

            {/* Natural Pauses toggle */}
            <div className={`voice-studio__toggle-row${naturalPauses ? ' active' : ''}`}>
              <div>
                <div className="voice-studio__toggle-title">Natural Pauses</div>
                <div className="voice-studio__toggle-desc">
                  Auto-insert pauses at punctuation
                </div>
              </div>
              <button type="button"
                onClick={() => setNaturalPauses(p => !p)}
                aria-label="Toggle natural pauses"
                className={`voice-studio__toggle-switch${naturalPauses ? ' on' : ' off'}`}
              />
            </div>
          </div>

          {/* Generate + Clear */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              data-generate-btn
              onClick={handleGenerate}
              disabled={!text.trim() || generating || isOverLimit}
              aria-label="Generate voice"
              className="btn btn-generate"
              style={{ flex: 1 }}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="studio-spinner studio-spinner--sm" />
                  Generating…
                </span>
              ) : (
                'Generate Voice'
              )}
            </button>
            {(text || audioUrl) && (
              <button type="button"
                onClick={handleClear}
                className="btn btn-secondary"
                title="Clear all"
              >
                ✕
              </button>
            )}
          </div>
          </div>{/* voice-studio-body */}
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div className="voice-studio-body" style={{ gap: '1.25rem' }}>

          {/* Error banners */}
          <StudioErrorBanner
            error={studioError}
            onDismiss={() => setStudioError(null)}
            onRetry={handleGenerate}
          />
          {error && !studioError && (
            <div className="studio-error-card">
              <p className="studio-error-card__title">Generation failed</p>
              <p className="studio-error-card__msg">{error}</p>
              <button type="button"
                onClick={handleGenerate}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                ↻ Retry
              </button>
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
                <button type="button"
                  onClick={handleDownload}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    background: 'var(--accent-dim)',
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
          {!audioUrl && !generating && !error && !studioError && (
            <div className="studio-empty-canvas">
              <p className="studio-empty-canvas__title">Generate your first voice</p>
              <p className="studio-empty-canvas__desc">
                Enter text and click{' '}
                <strong style={{ color: ACCENT }}>Generate Voice</strong> to create premium audio.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, opacity: 0.6 }}>
                Powered by ElevenLabs · Near-human quality TTS
              </p>
            </div>
          )}

          {/* Generating skeleton */}
          {generating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 160 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: ACCENT, fontSize: 14, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid var(--accent-glow)', borderTopColor: ACCENT,
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Synthesizing audio with ElevenLabs…
              </div>
              <div className="studio-shimmer-wrap">
                <div className="studio-shimmer-block" style={{ height: 64, borderRadius: 8 }} />
                <div className="studio-shimmer-block" style={{ height: 16, width: '55%' }} />
                <div className="studio-shimmer-block" style={{ height: 16, width: '38%' }} />
              </div>
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
                <button type="button"
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
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Voice Cloning</div>
              {userPlan === 'pro' || userPlan === 'max' ? (
                <div>
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
                      background: 'var(--accent-subtle)',
                      border: '1px solid var(--accent-glow)',
                      color: ACCENT,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Upgrade to Pro →
                  </Link>
                </div>
              )}
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

export default function VoiceStudioPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <VoiceStudioInner />
    </Suspense>
  );
}
