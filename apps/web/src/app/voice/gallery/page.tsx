'use client';




import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface VoiceAsset {
  id: string;
  tool?: string;       // voice type
  prompt?: string;     // text
  imageUrl: string;    // audio URL (stored in imageUrl field)
  tags?: string;       // JSON tags — includes language, voice
  createdAt: string;
  mode?: string;
}

interface GalleryResponse {
  assets: VoiceAsset[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = '#f59e0b';

const VOICE_FILTERS = [
  { id: '',          label: 'All'       },
  { id: 'natural',   label: 'Natural'   },
  { id: 'character', label: 'Character' },
  { id: 'whisper',   label: 'Whisper'   },
  { id: 'energetic', label: 'Energetic' },
  { id: 'news',      label: 'News'      },
  { id: 'deep',      label: 'Deep'      },
];

const VOICE_EMOJI: Record<string, string> = {
  natural: '🎙️', character: '🎭', whisper: '🤫',
  energetic: '⚡', news: '📺', deep: '🎯',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function parseTags(raw?: string): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; }
}

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------
function VoiceCard({ asset }: { asset: VoiceAsset }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const tags = parseTags(asset.tags);
  const voiceType = asset.tool ?? tags.voice ?? 'natural';
  const language  = tags.language ?? 'en';
  const text      = asset.prompt ?? '';

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else         { void el.play(); setPlaying(true); }
  };

  return (
    <div style={{
      padding: 16, borderRadius: 10,
      background: 'var(--surface)', border: '1px solid var(--surface-border)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{VOICE_EMOJI[voiceType] ?? '🎙️'}</span>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11,
            background: `${ACCENT}22`, color: ACCENT, fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            {voiceType}
          </span>
          <span style={{
            padding: '2px 6px', borderRadius: 4, fontSize: 11,
            background: 'var(--surface-border)', color: 'var(--text-muted)',
          }}>
            {language.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(asset.createdAt)}</span>
      </div>

      {/* Text excerpt */}
      <p style={{
        fontSize: 13, color: 'var(--text)', lineHeight: 1.4,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        margin: 0,
      }}>
        {text || <em style={{ color: 'var(--text-muted)' }}>No text</em>}
      </p>

      {/* Audio player */}
      {asset.imageUrl ? (
        <>
          <audio
            ref={audioRef}
            src={asset.imageUrl}
            onEnded={() => setPlaying(false)}
            preload="none"
          />
          <button
            onClick={togglePlay}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 6, border: 'none',
              background: playing ? `${ACCENT}22` : 'var(--surface-border)',
              color: playing ? ACCENT : 'var(--text)',
              fontSize: 13, cursor: 'pointer', width: 'fit-content',
              fontWeight: 600,
            }}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
        </>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audio unavailable</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main gallery page
// ---------------------------------------------------------------------------
export default function VoiceGallery() {
  const [assets, setAssets]           = useState<VoiceAsset[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebounced(search), 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  // Initialize filters from URL on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('voice'))  setVoiceFilter(p.get('voice')!);
    if (p.get('search')) setSearch(p.get('search')!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (voiceFilter)      p.set('voice', voiceFilter);
    if (debouncedSearch)  p.set('search', debouncedSearch);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [voiceFilter, debouncedSearch]);

  const fetchAssets = useCallback(
    async (cursor: string | null, reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: '24', mode: 'voice' });
        if (cursor)                    params.set('cursor', cursor);
        if (voiceFilter)               params.set('tool', voiceFilter);
        if (debouncedSearch.trim())    params.set('search', debouncedSearch.trim());

        const res = await fetch(`/api/gallery?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: GalleryResponse = await res.json();

        setAssets(prev => reset ? data.assets : [...prev, ...data.assets]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [voiceFilter, debouncedSearch],
  );

  useEffect(() => { void fetchAssets(null, true); }, [fetchAssets]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) void fetchAssets(nextCursor);
  }, [fetchAssets, loadingMore, hasMore, nextCursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="gallery-page">

      {/* Header */}
      <div className="gallery-header">
        <div className="gallery-header-inner">
          <div>
            <h1 className="gallery-title">Voice Gallery</h1>
            <p className="gallery-desc">AI-generated speech and character voices</p>
          </div>
          <Link href="/voice/studio" className="btn-primary btn-sm">
            + New Clip
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="gallery-filters">
        <div className="gallery-pill-row">
          {VOICE_FILTERS.map(f => (
            <button
              key={f.id}
              className={`gallery-pill${voiceFilter === f.id ? ' active' : ''}`}
              onClick={() => setVoiceFilter(f.id)}
              style={voiceFilter === f.id ? { borderColor: ACCENT, color: ACCENT, background: `${ACCENT}18` } : {}}
            >
              {f.id ? `${VOICE_EMOJI[f.id] ?? ''} ` : ''}{f.label}
            </button>
          ))}
        </div>
        <input
          className="gallery-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search voice clips…"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          padding: '24px',
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="gallery-card--skeleton-tall" style={{ animationDelay: `${i * 0.07}s`, minHeight: 140 }} />
          ))}
        </div>
      ) : error ? (
        <div className="gallery-error">
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <p>Failed to load gallery</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Check your connection and try again</p>
          <button className="btn-ghost btn-sm" onClick={() => void fetchAssets(null, true)}>
            Retry
          </button>
        </div>
      ) : assets.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">🎙️</div>
          <p className="gallery-empty-title">No voice clips yet</p>
          <p className="gallery-empty-desc">
            Generate your first audio in the Voice Studio.
          </p>
          <Link href="/voice/studio" className="btn-primary btn-sm">
            Go to Voice Studio →
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          padding: '24px',
        }}>
          {assets.map(asset => (
            <VoiceCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {loadingMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <div className="studio-spinner" />
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
