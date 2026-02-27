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
  { id: '',             label: 'All Tools'     },
  { id: 'icon',         label: 'Icon'          },
  { id: 'illustration', label: 'Illustration'  },
] as const;

const STYLE_FILTERS = [
  { id: '',        label: 'All'      },
  { id: 'outline', label: 'Outline'  },
  { id: 'filled',  label: 'Filled'   },
  { id: 'rounded', label: 'Rounded'  },
  { id: 'sharp',   label: 'Sharp'    },
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
  pollinations: '#34d399',
};

const PROVIDER_LABELS: Record<string, string> = {
  replicate:    'Replicate',
  fal:          'fal.ai',
  together:     'Together.ai',
  comfyui:      'ComfyUI',
  huggingface:  'HuggingFace',
  pollinations: 'Pollinations',
};

const ACCENT = '#34d399';

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
        borderTopColor: ACCENT,
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

function ProviderDot({ provider }: { provider: string }) {
  return (
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
          background: PROVIDER_COLORS[provider] ?? '#666',
          flexShrink: 0,
        }}
      />
      {PROVIDER_LABELS[provider] ?? provider}
    </span>
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft'  && hasPrev) onPrev();
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
    a.download = `wokgen-vector-${asset.id}.png`;
    a.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--overlay-80)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Prev */}
      {hasPrev && (
        <button type="button"
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
            transition: 'all 0.15s ease',
          }}
          aria-label="Previous image"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-overlay)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        >
          ←
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button type="button"
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
            transition: 'all 0.15s ease',
          }}
          aria-label="Next image"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-overlay)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        >
          →
        </button>
      )}

      {/* Modal card */}
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 680,
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px var(--overlay-70)',
          animation: 'scale-in 0.18s ease-out both',
        }}
        onClick={e => e.stopPropagation()}
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
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--accent-subtle)',
                color: ACCENT,
                border: '1px solid var(--accent-glow)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {capitalize(asset.tool)}
            </span>
            <ProviderDot provider={asset.provider} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href={`/studio?prompt=${encodeURIComponent(asset.prompt)}`}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-glow)',
                color: ACCENT,
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              ✦ Make similar
            </Link>
            <button type="button"
              onClick={download}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: 'var(--surface-overlay)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-overlay)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              ↓ Download
            </button>
            <button type="button"
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
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Canvas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              background: 'var(--surface-base)',
              backgroundImage: 'linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              minHeight: 240,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.imageUrl}
              alt={asset.title ?? asset.prompt}
              style={{
                imageRendering: 'auto',
                maxWidth: '100%',
                maxHeight: 400,
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Metadata */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--surface-border)' }}>
            {asset.title && (
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {asset.title}
              </h2>
            )}

            {/* Prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)' }}>
                  Prompt
                </span>
                <button type="button"
                  onClick={copyPrompt}
                  style={{ fontSize: '0.65rem', color: copied ? 'var(--success)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s ease' }}
                >
                  {copied ? 'Copied' : 'Copy'}
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
                  fontFamily: 'inherit',
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
                {asset.tags.slice(0, 10).map(tag => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--surface-border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-disabled)' }}>{capitalize(asset.tool)}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-disabled)' }}>{timeAgo(asset.createdAt)}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-disabled)' }}>
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

function GalleryCard({ asset, index, onClick }: { asset: GalleryAsset; index: number; onClick: () => void }) {
  return (
    <button type="button"
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
            imageRendering: 'auto',
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
          download={`wokgen-vector-${asset.id}.png`}
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
          style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 4 }}
        >
          {asset.prompt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', fontFamily: 'monospace' }}>
            {asset.size}px
          </span>
          <span
            style={{
              width: 4, height: 4, borderRadius: '50%',
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
// Showcase (empty state)
// ---------------------------------------------------------------------------

const SHOWCASE_PROMPTS = [
  { prompt: 'Settings gear icon, outline style, minimal', tool: 'icon' },
  { prompt: 'Shopping cart icon, filled style, flat design', tool: 'icon' },
  { prompt: 'Bell notification icon, rounded corners', tool: 'icon' },
  { prompt: 'Search magnifier icon, sharp geometric', tool: 'icon' },
  { prompt: 'Flat illustration of a team collaborating', tool: 'illustration' },
  { prompt: 'Vector illustration of a rocket launching', tool: 'illustration' },
  { prompt: 'User profile icon, outlined, minimal', tool: 'icon' },
  { prompt: 'Lock security icon, filled, flat', tool: 'icon' },
] as const;

function ShowcaseCard({ item, index }: { item: typeof SHOWCASE_PROMPTS[number]; index: number }) {
  return (
    <a
      href={`/studio?prompt=${encodeURIComponent(item.prompt)}&tool=${item.tool}`}
      className="gallery-card"
      style={{ textDecoration: 'none', animationDelay: `${index * 0.04}s` }}
    >
      <div className="gallery-card-image">
        <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
          <span style={{ fontSize: 48, color: ACCENT }}>
            {''}
          </span>
        </div>
      </div>
      <div className="gallery-card-overlay" style={{ opacity: 1, background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 60%, transparent 100%)' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
          {item.prompt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.58rem', color: ACCENT, background: 'var(--accent-subtle)', border: '1px solid var(--accent-glow)', borderRadius: 3, padding: '1px 5px' }}>
            Try this →
          </span>
        </div>
      </div>
    </a>
  );
}

function EmptyState({ search }: { search: string }) {
  if (search) {
    return (
      <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '80px 20px' }}>
        <div className="empty-state-icon"></div>
        <h3 className="empty-state-title">No results for &ldquo;{search}&rdquo;</h3>
        <p className="empty-state-body">Try a different search term or clear filters.</p>
      </div>
    );
  }
  return (
    <>
      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16, color: 'var(--text-disabled)' }}>⬡</div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          No vector assets yet
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          Generate your first vector in Vector mode.
        </p>
        <a
          href="/studio"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 6,
            background: '#FF9D00',
            color: '#0d0d14',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ✦ Open Vector mode
        </a>
      </div>
      {SHOWCASE_PROMPTS.map((item, i) => (
        <ShowcaseCard key={i} item={item} index={i} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function VectorGalleryPage() {
  const { data: session } = useSession();
  const [assets, setAssets]               = useState<GalleryAsset[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [nextCursor, setNextCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]             = useState(false);
  const [galleryTab, setGalleryTab]       = useState<'community' | 'mine'>('community');

  // Filters
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [toolFilter, setToolFilter]       = useState('');
  const [styleFilter, setStyleFilter]     = useState('');
  const [sort, setSort]                   = useState<'newest' | 'oldest'>('newest');

  // Modal
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 380);
    return () => clearTimeout(t);
  }, [search]);

  // Initialize filters from URL on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('search'))     setSearch(p.get('search')!);
    if (p.get('tool'))       setToolFilter(p.get('tool')!);
    if (p.get('style'))      setStyleFilter(p.get('style')!);
    if (p.get('sort') === 'oldest') setSort('oldest');
    if (p.get('tab') === 'mine')    setGalleryTab('mine');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (search)                  p.set('search', search);
    if (toolFilter)              p.set('tool', toolFilter);
    if (styleFilter)             p.set('style', styleFilter);
    if (sort !== 'newest')       p.set('sort', sort);
    if (galleryTab !== 'community') p.set('tab', galleryTab);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [search, toolFilter, styleFilter, sort, galleryTab]);

  // Fetch on filter change
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
        const params = new URLSearchParams({ limit: '32', sort, mode: 'vector' });
        if (cursor)           params.set('cursor', cursor);
        if (toolFilter)       params.set('tool', toolFilter);
        if (styleFilter)      params.set('tags', styleFilter);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (galleryTab === 'mine') params.set('mine', 'true');

        const res = await fetch(`/api/gallery?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: GalleryResponse = await res.json();

        setAssets(prev => (reset ? data.assets : [...prev, ...data.assets]));
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

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // Modal navigation
  const handleModalNext = useCallback(() => {
    setSelectedIndex(i => (i !== null && i < assets.length - 1 ? i + 1 : i));
  }, [assets.length]);

  const handleModalPrev = useCallback(() => {
    setSelectedIndex(i => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const selectedAsset = selectedIndex !== null ? assets[selectedIndex] ?? null : null;

  // Suppress unused session warning — kept for potential future auth-gating
  void session;

  return (
    <div style={{ minHeight: 'calc(100dvh - 56px)', background: 'var(--surface-base)' }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
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
                Vector Gallery
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Vector-style icons, illustrations, and design system components
              </p>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Community / Mine tabs */}
              <div style={{ display: 'flex', gap: 2 }}>
                {(['community', 'mine'] as const).map(tab => (
                  <button type="button"
                    key={tab}
                    onClick={() => setGalleryTab(tab)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.14s ease',
                      background: galleryTab === tab ? 'var(--accent-subtle)' : 'var(--surface-overlay)',
                      border: `1px solid ${galleryTab === tab ? ACCENT + '50' : 'var(--surface-border)'}`,
                      color: galleryTab === tab ? ACCENT : 'var(--text-muted)',
                    }}
                  >
                    {tab === 'community' ? 'Community' : 'My Assets'}
                  </button>
                ))}
              </div>

              <a
                href="/studio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 6,
                  background: ACCENT,
                  color: '#0d0d14',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                ✦ New Asset
              </a>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: 180, maxWidth: 300 }}>
              <span
                style={{
                  position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-disabled)', fontSize: 13, pointerEvents: 'none',
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
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 28, height: 34, fontSize: '0.8rem' }}
                aria-label="Search gallery"
              />
            </div>

            {/* Tool filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {TOOL_FILTERS.map(f => (
                <button type="button"
                  key={f.id}
                  onClick={() => setToolFilter(f.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    background: toolFilter === f.id ? 'var(--accent-subtle)' : 'var(--surface-overlay)',
                    border: `1px solid ${toolFilter === f.id ? ACCENT + '50' : 'var(--surface-border)'}`,
                    color: toolFilter === f.id ? ACCENT : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Style filter */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {STYLE_FILTERS.map(f => (
                <button type="button"
                  key={f.id}
                  onClick={() => setStyleFilter(f.id)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    background: styleFilter === f.id ? 'var(--accent-subtle)' : 'var(--surface-overlay)',
                    border: `1px solid ${styleFilter === f.id ? ACCENT + '50' : 'var(--surface-border)'}`,
                    color: styleFilter === f.id ? ACCENT : 'var(--text-muted)',
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
              onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
              style={{ height: 34, fontSize: '0.78rem', minWidth: 130, marginLeft: 'auto' }}
              aria-label="Sort order"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
        {/* Error */}
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

        {/* Loading skeleton */}
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

        {/* Asset grid */}
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

        {/* Sentinel */}
        <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <Spinner />
            Loading more…
          </div>
        )}

        {!loading && !hasMore && assets.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-disabled)', padding: '20px 0' }}>
            {assets.length} asset{assets.length !== 1 ? 's' : ''} · end of gallery
          </p>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
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
