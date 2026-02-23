'use client';




import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GalleryAsset {
  id: string;
  title: string | null;
  imageUrl: string;
  thumbUrl: string | null;
  size: number;
  tool: string;
  provider: string;
  prompt: string;
  tags: string[];
  rarity: string | null;
  isPublic: boolean;
  createdAt: string;
}

interface GalleryResponse {
  assets: GalleryAsset[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_FILTERS = [
  { id: '',      label: 'All'          },
  { id: 'emoji', label: 'Single Emoji' },
  { id: 'pack',  label: 'Pack'         },
] as const;

const STYLE_FILTERS = [
  { id: '',            label: 'All Styles' },
  { id: 'expressive',  label: 'Expressive' },
  { id: 'minimal',     label: 'Minimal'    },
  { id: 'blob',        label: 'Blob'       },
  { id: 'pixel_emoji', label: 'Pixel'      },
] as const;

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
] as const;

const PROVIDER_COLORS: Record<string, string> = {
  replicate:    '#0066FF',
  fal:          '#7B2FBE',
  together:     '#00A67D',
  comfyui:      '#E06C00',
  huggingface:  '#FF9D00',
  pollinations: '#fb923c',
};

const PROVIDER_LABELS: Record<string, string> = {
  replicate:    'Replicate',
  fal:          'fal.ai',
  together:     'Together.ai',
  comfyui:      'ComfyUI',
  huggingface:  'HuggingFace',
  pollinations: 'Pollinations',
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid var(--surface-border)',
        borderTopColor: '#fb923c',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Asset Detail Modal
// ---------------------------------------------------------------------------

function AssetModal({
  asset,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: {
  asset: GalleryAsset;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const isPixel = asset.tool === 'pixel_emoji';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(asset.prompt).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = asset.imageUrl;
    a.download = `wokgen-emoji-${asset.id}.png`;
    a.click();
  };

  const ZOOM_STEPS = [1, 2, 4, 8];
  const nextZoom = ZOOM_STEPS[(ZOOM_STEPS.indexOf(zoom) + 1) % ZOOM_STEPS.length];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {hasPrev && (
        <button
          onClick={onPrev}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--surface-overlay)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-secondary)',
            borderRadius: 8,
            width: 40,
            height: 40,
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          aria-label="Previous image"
        >
          ←
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--surface-overlay)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-secondary)',
            borderRadius: 8,
            width: 40,
            height: 40,
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          aria-label="Next image"
        >
          →
        </button>
      )}

      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 640,
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--surface-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {asset.size}×{asset.size}px
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.62rem',
                color: 'var(--text-disabled)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: PROVIDER_COLORS[asset.provider] ?? '#666',
                }}
              />
              {PROVIDER_LABELS[asset.provider] ?? asset.provider}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href={`/emoji/studio?prompt=${encodeURIComponent(asset.prompt)}`}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: 'rgba(251,146,60,0.12)',
                border: '1px solid rgba(251,146,60,0.3)',
                color: '#fb923c',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              ✦ Make similar
            </Link>
            <button
              onClick={download}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: 'var(--surface-overlay)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ↓ Download
            </button>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              background: 'var(--surface-base)',
              minHeight: 240,
              cursor: zoom < 8 ? 'zoom-in' : 'zoom-out',
            }}
            onClick={() => setZoom(nextZoom)}
            title={`Click to zoom (${zoom}×)`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.imageUrl}
              alt={asset.title ?? asset.prompt}
              style={{
                imageRendering: isPixel ? 'pixelated' : 'auto',
                maxWidth: '100%',
                maxHeight: 320,
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.15s ease',
              }}
            />
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: '0.65rem',
              color: 'var(--text-disabled)',
              padding: '4px 0 8px',
              background: 'var(--surface-base)',
            }}
          >
            Click image to zoom ({zoom}×) · ← → to browse
          </div>

          {/* Metadata */}
          <div
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              borderTop: '1px solid var(--surface-border)',
            }}
          >
            {/* Prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-disabled)',
                  }}
                >
                  Prompt
                </span>
                <button
                  onClick={copyPrompt}
                  style={{
                    fontSize: '0.65rem',
                    color: copied ? 'var(--success)' : 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {copied ? '✓ Copied' : '⊕ Copy'}
                </button>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                  padding: '8px 10px',
                  background: 'var(--surface-overlay)',
                  borderRadius: 6,
                  border: '1px solid var(--surface-border)',
                  cursor: 'pointer',
                }}
                onClick={copyPrompt}
                title="Click to copy"
              >
                {asset.prompt}
              </p>
            </div>

            {/* Tags */}
            {asset.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {asset.tags.slice(0, 10).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 7px',
                      borderRadius: 99,
                      background: 'var(--surface-overlay)',
                      border: '1px solid var(--surface-border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                paddingTop: 4,
                borderTop: '1px solid var(--surface-border)',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-disabled)' }}>
                {capitalize(asset.tool)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-disabled)' }}>
                {timeAgo(asset.createdAt)}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-disabled)',
                }}
              >
                {asset.id.slice(0, 12)}…
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery card
// ---------------------------------------------------------------------------

function GalleryCard({
  asset,
  index,
  onClick,
}: {
  asset: GalleryAsset;
  index: number;
  onClick: () => void;
}) {
  const isPixel = asset.tool === 'pixel_emoji';

  return (
    <button
      onClick={onClick}
      className="gallery-card animate-fade-in"
      style={{
        animationDelay: `${Math.min(index * 0.03, 0.4)}s`,
        textAlign: 'left',
        width: '100%',
        padding: 0,
      }}
      aria-label={asset.title ?? asset.prompt}
    >
      <div className="gallery-card-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.thumbUrl ?? asset.imageUrl}
          alt={asset.title ?? asset.prompt}
          loading="lazy"
          style={{
            imageRendering: isPixel ? 'pixelated' : 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Hover download button */}
      <div className="gallery-card-dl-wrap">
        <a
          href={asset.imageUrl}
          download={`wokgen-emoji-${asset.id}.png`}
          onClick={e => e.stopPropagation()}
          className="gallery-card-download-btn"
          title="Download"
          aria-label="Download"
        >
          ↓
        </a>
      </div>

      <div className="gallery-card-overlay">
        <p
          className="line-clamp-2"
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            marginBottom: 4,
          }}
        >
          {asset.prompt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', fontFamily: 'monospace' }}>
            {asset.size}px
          </span>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: PROVIDER_COLORS[asset.provider] ?? '#666',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '0.6rem', color: 'var(--text-disabled)' }}>
            {timeAgo(asset.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const SHOWCASE_EMOJIS = [
  { prompt: 'laughing face with tears of joy, expressive emoji style', tool: 'emoji', size: 64 },
  { prompt: 'fire with sunglasses, cool emoji, bold cartoon', tool: 'emoji', size: 64 },
  { prompt: 'robot waving hello, cute minimal flat design', tool: 'emoji', size: 64 },
  { prompt: 'heart eyes face, love emoji, blob style', tool: 'emoji', size: 64 },
  { prompt: 'party popper confetti, celebration emoji, expressive', tool: 'emoji', size: 64 },
  { prompt: 'crying laughing face, pixel art emoji, 8-bit style', tool: 'emoji', size: 64 },
  { prompt: 'weather emoji pack: sun rain cloud snow', tool: 'pack', size: 64 },
  { prompt: 'cat face with paw up, cute blob emoji, discord style', tool: 'emoji', size: 64 },
] as const;

function ShowcaseCard({ item, index }: { item: typeof SHOWCASE_EMOJIS[number]; index: number }) {
  return (
    <a
      href={`/emoji/studio?prompt=${encodeURIComponent(item.prompt)}`}
      className="gallery-card"
      style={{ textDecoration: 'none', animationDelay: `${index * 0.04}s` }}
    >
      <div className="gallery-card-image">
        <div aria-hidden="true" style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, opacity: 0.18,
        }}>
          😀
        </div>
      </div>
      <div className="gallery-card-overlay" style={{ opacity: 1, background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 60%, transparent 100%)' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
          {item.prompt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.58rem', color: '#fb923c', background: 'rgba(251,146,60,.15)', border: '1px solid rgba(251,146,60,.25)', borderRadius: 3, padding: '1px 5px' }}>
            Try this →
          </span>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-disabled)' }}>{item.size}px</span>
        </div>
      </div>
    </a>
  );
}

function EmptyState({ search }: { search: string }) {
  if (search) {
    return (
      <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '80px 20px' }}>
        <div className="empty-state-icon" style={{ fontSize: '2rem' }}>🔍</div>
        <h3 className="empty-state-title">No results for &ldquo;{search}&rdquo;</h3>
        <p className="empty-state-body">Try a different search term or clear filters.</p>
      </div>
    );
  }
  return (
    <>
      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 0 1.25rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😊</div>
        <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          No emoji assets yet
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Generate your first emoji in the Emoji Studio.
        </p>
        <a
          href="/emoji/studio"
          style={{
            display: 'inline-block',
            padding: '8px 18px',
            borderRadius: 8,
            background: '#fb923c',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.82rem',
            textDecoration: 'none',
          }}
        >
          Open Emoji Studio →
        </a>
      </div>
      {SHOWCASE_EMOJIS.map((item, i) => (
        <ShowcaseCard key={i} item={item} index={i} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EmojiGalleryPage() {
  const { data: session } = useSession();
  const [assets, setAssets]           = useState<GalleryAsset[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [hasMore, setHasMore]         = useState(false);
  const [galleryTab, setGalleryTab]   = useState<'community' | 'mine'>('community');

  const [search, setSearch]                       = useState('');
  const [debouncedSearch, setDebouncedSearch]     = useState('');
  const [toolFilter, setToolFilter]               = useState('');
  const [styleFilter, setStyleFilter]             = useState('');
  const [sort, setSort]                           = useState<'newest' | 'oldest'>('newest');

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Suppress unused session warning — kept for future use
  void session;

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 380);
    return () => clearTimeout(t);
  }, [search]);

  // Initialize filters from URL on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('tool'))   setToolFilter(p.get('tool')!);
    if (p.get('style'))  setStyleFilter(p.get('style')!);
    if (p.get('search')) setSearch(p.get('search')!);
    if (p.get('sort') === 'oldest') setSort('oldest');
    if (p.get('tab') === 'mine')    setGalleryTab('mine');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (toolFilter)        p.set('tool', toolFilter);
    if (styleFilter)       p.set('style', styleFilter);
    if (debouncedSearch)   p.set('search', debouncedSearch);
    if (sort !== 'newest') p.set('sort', sort);
    if (galleryTab === 'mine') p.set('tab', 'mine');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [toolFilter, styleFilter, debouncedSearch, sort, galleryTab]);

  useEffect(() => {
    setAssets([]);
    setNextCursor(null);
    setHasMore(false);
    fetchAssets(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, toolFilter, styleFilter, sort, galleryTab]);

  const fetchAssets = useCallback(
    async (cursor: string | null, reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: '32', sort, mode: 'emoji' });
        if (cursor)                    params.set('cursor', cursor);
        if (toolFilter)                params.set('tool', toolFilter);
        if (styleFilter)               params.set('stylePreset', styleFilter);
        if (debouncedSearch.trim())    params.set('search', debouncedSearch.trim());
        if (galleryTab === 'mine')     params.set('mine', 'true');

        const res = await fetch(`/api/gallery?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: GalleryResponse = await res.json();
        setAssets((prev) => (reset ? data.assets : [...prev, ...data.assets]));
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [toolFilter, styleFilter, sort, debouncedSearch, galleryTab],
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) fetchAssets(nextCursor, false);
  }, [fetchAssets, loadingMore, hasMore, nextCursor]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const handleModalNext = useCallback(() => {
    setSelectedIndex((i) => (i !== null && i < assets.length - 1 ? i + 1 : i));
  }, [assets.length]);

  const handleModalPrev = useCallback(() => {
    setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const selectedAsset = selectedIndex !== null ? assets[selectedIndex] : null;

  return (
    <div style={{ minHeight: 'calc(100dvh - 56px)', background: 'var(--surface-base)' }}>

      {/* Page header */}
      <div
        style={{
          background: 'var(--surface-raised)',
          borderBottom: '1px solid var(--surface-border)',
          padding: '20px 24px 0',
          position: 'sticky',
          top: 56,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
            <div>
              <h1
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Emoji Gallery
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Custom emoji packs, reactions, and icon sets
              </p>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Mine / Community tabs */}
              <div style={{ display: 'flex', gap: 2 }}>
                {(['community', 'mine'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGalleryTab(tab)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: galleryTab === tab ? 'rgba(251,146,60,0.12)' : 'var(--surface-overlay)',
                      border: `1px solid ${galleryTab === tab ? 'rgba(251,146,60,0.4)' : 'var(--surface-border)'}`,
                      color: galleryTab === tab ? '#fb923c' : 'var(--text-muted)',
                    }}
                  >
                    {capitalize(tab)}
                  </button>
                ))}
              </div>
              <a
                href="/emoji/studio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 6,
                  background: '#fb923c',
                  color: '#0d0d14',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                ✦ New Emoji
              </a>
            </div>
          </div>

          {/* Filter bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              paddingBottom: 16,
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: 180, maxWidth: 280 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-disabled)',
                  fontSize: 13,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              >
                ⌕
              </span>
              <input
                type="search"
                className="input"
                placeholder="Search prompts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 28, height: 34, fontSize: '0.8rem' }}
                aria-label="Search gallery"
              />
            </div>

            {/* Tool filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {TOOL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setToolFilter(f.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    background: toolFilter === f.id ? 'rgba(251,146,60,0.12)' : 'var(--surface-overlay)',
                    border: `1px solid ${toolFilter === f.id ? 'rgba(251,146,60,0.4)' : 'var(--surface-border)'}`,
                    color: toolFilter === f.id ? '#fb923c' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Style filter */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {STYLE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStyleFilter(f.id)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    background: styleFilter === f.id ? 'rgba(251,146,60,0.12)' : 'var(--surface-overlay)',
                    border: `1px solid ${styleFilter === f.id ? 'rgba(251,146,60,0.4)' : 'var(--surface-border)'}`,
                    color: styleFilter === f.id ? '#fb923c' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
              style={{ height: 34, fontSize: '0.78rem', minWidth: 130, marginLeft: 'auto' }}
              aria-label="Sort order"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: 'var(--danger-muted)',
              border: '1px solid var(--danger)',
              color: 'var(--danger-hover)',
              fontSize: '0.82rem',
              marginBottom: 16,
            }}
          >
            Failed to load gallery: {error}
          </div>
        )}

        {loading && (
          <div className="gallery-grid">
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ aspectRatio: '1', borderRadius: 8, animationDelay: `${i * 0.04}s` }}
              />
            ))}
          </div>
        )}

        {!loading && (
          <div className="gallery-grid">
            {assets.length === 0 ? (
              <EmptyState search={debouncedSearch} />
            ) : (
              assets.map((asset, i) => (
                <GalleryCard
                  key={asset.id}
                  asset={asset}
                  index={i}
                  onClick={() => setSelectedIndex(i)}
                />
              ))
            )}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

        {loadingMore && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              padding: '20px 0',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
            }}
          >
            <Spinner />
            Loading more…
          </div>
        )}

        {!loading && !hasMore && assets.length > 0 && (
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-disabled)',
              padding: '20px 0',
            }}
          >
            {assets.length} emoji{assets.length !== 1 ? 's' : ''} · end of gallery
          </p>
        )}
      </div>

      {/* Modal */}
      {selectedAsset && selectedIndex !== null && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedIndex(null)}
          onNext={handleModalNext}
          onPrev={handleModalPrev}
          hasNext={selectedIndex < assets.length - 1}
          hasPrev={selectedIndex > 0}
        />
      )}
    </div>
  );
}
