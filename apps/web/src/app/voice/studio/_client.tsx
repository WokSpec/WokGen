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
      
    >
      {/* Main layout */}
      <div
        className="voice-min-height"
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
            <div className="voice-preset-wrap">
              <div className="voice-studio__section-label voice-section-label--sm">
                Character Presets
              </div>
              <div className="voice-preset-chips">
                {CHARACTER_PRESETS.map(p => (
                  <button type="button"
                    key={p.label}
                    onClick={() => setStyle(p.style)}
                    title={p.desc}
                    className={`btn btn--ghost btn--sm voice-preset-btn${style === p.style ? ' active' : ''}`}
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
                  Voice: <strong>{liveVoice.name}</strong>
                  {liveContentType && (
                    <span className="voice-detected-type">
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
                  className={`btn btn-secondary voice-preview-btn${previewPlaying ? ' btn--active' : ''}`}
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
              className={`studio-textarea${isOverLimit ? ' studio-textarea--danger' : ''}`}
            />
          </div>

          {/* Language selector */}
          <div>
            <label className="voice-studio__section-label voice-section-label--block">
              Language
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="studio-select voice-select"
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            {hd && (
              <p className="voice-hd-hint">
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
          <div className="voice-controls-wrap">
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
          <div className="voice-gen-row">
            <button
              type="button"
              data-generate-btn
              onClick={handleGenerate}
              disabled={!text.trim() || generating || isOverLimit}
              aria-label="Generate voice"
              className="btn btn-generate"
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
        <div className="voice-studio-body voice-studio-body--gapped">

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
                className="btn btn-secondary btn-text-sm"
              >
                ↻ Retry
              </button>
            </div>
          )}

          {/* Audio player */}
          {audioUrl && (
            <div className="voice-output-card">
              <div className="voice-output-header">
                <div>
                  <p className="voice-output-title">Generated Audio</p>
                  <p className="voice-output-subtitle">
                    {voiceName && <><strong>{voiceName}</strong> voice</>}
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
                  className="voice-dl-btn"
                >
                  ⬇ Download MP3
                </button>
              </div>

              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="voice-audio-player"
              />
            </div>
          )}

          {/* Idle state */}
          {!audioUrl && !generating && !error && !studioError && (
            <div className="studio-empty-canvas">
              <p className="studio-empty-canvas__title">Generate your first voice</p>
              <p className="studio-empty-canvas__desc">
                Enter text and click{' '}
                <strong className="voice-empty-strong">Generate Voice</strong> to create premium audio.
              </p>
              <p className="voice-footer-hint">
                Powered by ElevenLabs · Near-human quality TTS
              </p>
            </div>
          )}

          {/* Generating skeleton */}
          {generating && (
            <div className="voice-generating-wrap">
              <div className="voice-generating-header">
                <span className="voice-gen-spinner" />
                Synthesizing audio with ElevenLabs…
              </div>
              <div className="studio-shimmer-wrap">
                <div className="studio-shimmer-block voice-shimmer-audio" />
                <div className="studio-shimmer-block" style={{ height: 16, width: '55%' }} />
                <div className="studio-shimmer-block" style={{ height: 16, width: '38%' }} />
              </div>
            </div>
          )}

          {/* Examples */}
          <div className="voice-examples-wrap">
            <div className="voice-examples-label">
              Quick-start examples
            </div>
            <div className="voice-examples-chips">
              {EXAMPLES.map(ex => (
                <button type="button"
                  key={ex.label}
                  onClick={() => loadExample(ex)}
                  className="voice-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Cloning (logged-in users only) */}
          {userId && (
            <div className="voice-cloning-card">
              <div className="voice-cloning-title">Voice Cloning</div>
              {userPlan === 'pro' || userPlan === 'max' ? (
                <div>
                  <p className="voice-cloning-desc">
                    Upload a 10–30 second WAV sample to clone your voice.
                  </p>
                  <div className="voice-cloning-dropzone">
                    WAV upload — coming soon
                  </div>
                </div>
              ) : (
                <div>
                  <p className="voice-cloning-desc">
                    Clone any voice from a short audio sample. Available on Pro plan.
                  </p>
                  <Link href="/pricing" className="voice-upgrade-link">
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
    <Suspense fallback={<div className="studio-loading-fallback" />}>
      <VoiceStudioInner />
    </Suspense>
  );
}
