'use client';




import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommunityAsset {
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
  mode: string | null;
  createdAt: string;
}

interface GalleryResponse {
  assets: CommunityAsset[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_FILTERS = [
  { id: '',         label: 'All Engines', },
  { id: 'pixel',    label: 'Pixel',       },
  { id: 'business', label: 'Business',    },
  { id: 'uiux',     label: 'UI/UX',       },
  { id: 'vector',   label: 'Vector',       },
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
  pollinations: '#a78bfa',
};

const PROVIDER_LABELS: Record<string, string> = {
  replicate:    'Replicate',
  fal:          'fal.ai',
  together:     'Together.ai',
  comfyui:      'ComfyUI',
  huggingface:  'HuggingFace',
  pollinations: 'Pollinations',
};

const RARITY_COLORS: Record<string, string> = {
  common:    '#94B0C2',
  uncommon:  '#38B764',
  rare:      '#41A6F6',
  epic:      '#B06EFF',
  legendary: '#FFCD75',
};

const MODE_COLORS: Record<string, string> = {
  pixel:    '#a78bfa',
  business: '#38B764',
  uiux:     '#41A6F6',
  vector:   '#FF9D00',
  emoji:    '#FFCD75',
};

const MODE_LABELS: Record<string, string> = {
  pixel:    'Pixel',
  business: 'Business',
  uiux:     'UI/UX',
  vector:   'Vector',
  emoji:    'Emoji',
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
      className="community-spinner"
      aria-hidden="true"
    />
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const color = MODE_COLORS[mode] ?? 'var(--text-muted)';
  const label = MODE_LABELS[mode] ?? capitalize(mode);
  return (
    <span
      className="community-mode-badge"
      style={{ '--bc': color, '--bc-bg': `${color}18`, '--bc-border': `${color}40` } as React.CSSProperties}
    >
      {label}
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
  asset: CommunityAsset;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

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
    a.download = `wokgen-${asset.id}.png`;
    a.click();
  };

  const ZOOM_STEPS = [1, 2, 4, 8];
  const nextZoom = ZOOM_STEPS[(ZOOM_STEPS.indexOf(zoom) + 1) % ZOOM_STEPS.length];

  return (
    <div
      className="community-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {hasPrev && (
        <button
          onClick={onPrev}
          className="community-modal-nav-btn community-modal-nav-btn--prev"
          aria-label="Previous"
        >←</button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="community-modal-nav-btn community-modal-nav-btn--next"
          aria-label="Next"
        >→</button>
      )}

      <div className="community-modal-content">
        {/* Header */}
        <div className="community-modal-header">
          <div className="community-modal-header-left">
            {asset.mode && <ModeBadge mode={asset.mode} />}
            <span className="community-modal-tool-name">
              {capitalize(asset.tool)}
            </span>
          </div>
          <div className="community-modal-header-right">
            <button
              onClick={() => setZoom(nextZoom)}
              className="community-modal-btn"
            >
              {zoom}× zoom
            </button>
            <button
              onClick={download}
              className="community-modal-btn"
            >
              ↓ Download
            </button>
            <button
              onClick={onClose}
              className="community-modal-close-btn"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="community-modal-img-container">
          <img
            src={asset.imageUrl}
            alt={asset.title ?? asset.prompt}
            className={`community-modal-img${asset.mode === 'pixel' ? ' community-modal-img--pixel' : ''}`}
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {/* Details */}
        <div className="community-modal-details">
          {/* Prompt */}
          <div>
            <div className="community-modal-prompt-header">
              <span className="community-modal-label">Prompt</span>
              <button
                onClick={copyPrompt}
                className={`community-modal-copy-btn${copied ? ' community-modal-copy-btn--copied' : ''}`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p
              className="community-modal-prompt-text"
              onClick={copyPrompt}
              title="Click to copy"
            >
              {asset.prompt}
            </p>
          </div>

          {/* Tags */}
          {asset.tags?.length > 0 && (
            <div className="community-modal-tags">
              {asset.tags.slice(0, 10).map((tag) => (
                <span key={tag} className="community-modal-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="community-modal-meta">
            {asset.rarity && (
              <span className="community-modal-rarity" style={{ color: RARITY_COLORS[asset.rarity] ?? 'var(--text-muted)' }}>
                {capitalize(asset.rarity)}
              </span>
            )}
            <span className="community-modal-meta-item">{asset.size}px</span>
            <span className="community-modal-meta-item">{timeAgo(asset.createdAt)}</span>
            <span className="community-modal-provider">
              <span className="community-modal-provider-dot" style={{ background: PROVIDER_COLORS[asset.provider] ?? '#666' }} />
              {PROVIDER_LABELS[asset.provider] ?? asset.provider}
            </span>
            <span className="community-modal-id">
              {asset.id.slice(0, 12)}…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Community Card
// ---------------------------------------------------------------------------

function CommunityCard({ asset, index, onClick }: { asset: CommunityAsset; index: number; onClick: () => void }) {
  const rarityColor = asset.rarity ? (RARITY_COLORS[asset.rarity] ?? null) : null;
  const modeColor = asset.mode ? (MODE_COLORS[asset.mode] ?? null) : null;

  return (
    <button
      onClick={onClick}
      className="gallery-card animate-fade-in community-card-btn"
      style={{
        animationDelay: `${Math.min(index * 0.025, 0.5)}s`,
        boxShadow: rarityColor ? `0 0 0 1px ${rarityColor}25` : undefined,
      }}
      aria-label={asset.title ?? asset.prompt}
    >
      {/* Image */}
      <div className="gallery-card-image">
        <Image
          src={asset.thumbUrl ?? asset.imageUrl}
          alt={asset.title ?? asset.prompt}
          width={256}
          height={256}
          unoptimized
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          className={`community-card-img${asset.mode === 'pixel' ? ' community-card-img--pixel' : ''}`}
        />

        {/* Mode badge top-left */}
        {asset.mode && modeColor && (
          <span
            className="community-card-mode-badge"
            style={{ '--mc': modeColor, '--mc-bg': `${modeColor}28`, '--mc-border': `${modeColor}45` } as React.CSSProperties}
          >
            {MODE_LABELS[asset.mode] ?? capitalize(asset.mode)}
          </span>
        )}

        {/* Rarity corner */}
        {rarityColor && (
          <span
            className="community-card-rarity-dot"
            style={{ background: rarityColor, boxShadow: `0 0 6px 1px ${rarityColor}60` }}
            title={capitalize(asset.rarity!)}
          />
        )}
      </div>

      {/* Hover download button */}
      <div className="gallery-card-dl-wrap">
        <a
          href={asset.imageUrl}
          download={`wokgen-${asset.id}.png`}
          onClick={e => e.stopPropagation()}
          className="gallery-card-download-btn"
          title="Download"
          aria-label="Download"
        >
          ↓
        </a>
      </div>

      {/* Hover overlay */}
      <div className="gallery-card-overlay">
        <p className="line-clamp-2 community-card-overlay-text">
          {asset.prompt}
        </p>
        <div className="community-card-overlay-meta">
          <span className="community-card-overlay-size">
            {asset.size}px
          </span>
          <span
            className="community-card-overlay-dot"
            style={{ background: PROVIDER_COLORS[asset.provider] ?? '#666' }}
          />
          <span className="community-card-overlay-time">
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

function EmptyState({ search }: { search: string }) {
  if (search) {
    return (
      <div className="empty-state community-empty-wrap">
        <div className="empty-state-icon community-empty-icon"></div>
        <h3 className="empty-state-title">No results for &ldquo;{search}&rdquo;</h3>
        <p className="empty-state-body">Try a different search term or clear filters.</p>
      </div>
    );
  }
  return (
    <div className="empty-state community-empty-wrap">
      <div className="empty-state-icon community-empty-icon community-empty-icon--lg"></div>
      <h3 className="empty-state-title">Community is just getting started</h3>
      <p className="empty-state-body">
        Be the first to share. Generate something in a studio and enable &ldquo;Share to Gallery&rdquo;.
      </p>
      <div className="community-empty-cta-row">
        <Link href="/pixel/studio" className="community-empty-link community-empty-link--pixel">
          🕹️ Pixel Studio
        </Link>
        <Link href="/business/studio" className="community-empty-link community-empty-link--business">
          📊 Business Studio
        </Link>
        <Link href="/uiux/studio" className="community-empty-link community-empty-link--uiux">
          🖥️ UI/UX Studio
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CommunityPage() {
  const { data: session } = useSession();
  const [assets, setAssets]               = useState<CommunityAsset[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [nextCursor, setNextCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]             = useState(false);
  const [galleryTab, setGalleryTab]       = useState<'community' | 'mine'>('community');

  // Filters
  const [modeFilter, setModeFilter]       = useState('');
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort]                   = useState<'newest' | 'oldest'>('newest');

  // Modal
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Public default
  const [publicDefault, setPublicDefault]     = useState(false);
  const [savingDefault, setSavingDefault]     = useState(false);

  // Fetch user setting
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/user/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPublicDefault(d.publicGenerationsDefault ?? false); })
      .catch(() => null);
  }, [session]);

  const togglePublicDefault = async () => {
    if (!session?.user || savingDefault) return;
    setSavingDefault(true);
    const next = !publicDefault;
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicGenerationsDefault: next }),
      });
      if (res.ok) setPublicDefault(next);
    } catch { /* ignore */ }
    setSavingDefault(false);
  };

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 380);
    return () => clearTimeout(t);
  }, [search]);

  // Initialize filters from URL on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('mode'))   setModeFilter(p.get('mode')!);
    if (p.get('search')) setSearch(p.get('search')!);
    if (p.get('sort') === 'oldest') setSort('oldest');
    if (p.get('tab') === 'mine')    setGalleryTab('mine');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (modeFilter)        p.set('mode', modeFilter);
    if (debouncedSearch)   p.set('search', debouncedSearch);
    if (sort !== 'newest') p.set('sort', sort);
    if (galleryTab === 'mine') p.set('tab', 'mine');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [modeFilter, debouncedSearch, sort, galleryTab]);

  // Fetch on filter change
  useEffect(() => {
    setAssets([]);
    setNextCursor(null);
    setHasMore(false);
    fetchAssets(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, modeFilter, sort, galleryTab]);

  const fetchAssets = useCallback(
    async (cursor: string | null, reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: '36', sort });
        if (cursor)           params.set('cursor', cursor);
        if (modeFilter)       params.set('mode', modeFilter);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (galleryTab === 'mine') params.set('mine', 'true');

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
    [modeFilter, sort, debouncedSearch, galleryTab],
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) fetchAssets(nextCursor, false);
  }, [fetchAssets, loadingMore, hasMore, nextCursor]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: '400px' },
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
    <div className="community-page">
      {/* Modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedIndex(null)}
          onNext={handleModalNext}
          onPrev={handleModalPrev}
          hasNext={selectedIndex !== null && selectedIndex < assets.length - 1}
          hasPrev={selectedIndex !== null && selectedIndex > 0}
        />
      )}

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="community-page-header">
        <div className="community-header-inner">
          {/* Title row */}
          <div className="community-title-row">
            <div className="community-title-left">
              <h1 className="community-heading">
                Community
              </h1>
              <p className="community-subtitle">
                Public generations from all engines — shared by WokGen users
              </p>
            </div>

            <div className="community-actions-row">
              {/* Public-by-default toggle (only for signed-in users) */}
              {session?.user && (
                <button
                  onClick={togglePublicDefault}
                  disabled={savingDefault}
                  className={`community-toggle-btn${publicDefault ? ' community-toggle-btn--active' : ''}${savingDefault ? ' community-toggle-btn--saving' : ''}`}
                  title={publicDefault ? 'Your new generations default to public' : 'Your new generations default to private'}
                >
                  <span className={`community-toggle-track${publicDefault ? ' community-toggle-track--active' : ''}`}>
                    <span className={`community-toggle-thumb${publicDefault ? ' community-toggle-thumb--active' : ''}`} />
                  </span>
                  Public by default
                </button>
              )}

              {/* Studio CTA */}
              <Link
                href="/pixel/studio"
                className="community-create-link"
              >
                ✦ Create
              </Link>
            </div>
          </div>

          {/* Mode tabs + search row */}
          <div className="community-tabs-row">
            {/* Community/Mine tabs */}
            {session?.user && (
              <>
                {(['community', 'mine'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGalleryTab(tab)}
                    className={`community-gallery-tab${galleryTab === tab ? ' community-gallery-tab--active' : ''}`}
                  >
                    {tab === 'community' ? 'Community' : 'My Generations'}
                  </button>
                ))}
                <div className="community-tab-separator" />
              </>
            )}

            {/* Mode filter tabs */}
            {MODE_FILTERS.map(m => (
              <button
                key={m.id}
                onClick={() => setModeFilter(m.id)}
                className={`community-mode-tab${modeFilter === m.id ? ' community-mode-tab--active' : ''}`}
              >
                
                {m.label}
              </button>
            ))}

            {/* Spacer + search + sort */}
            <div className="community-search-row">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search prompts…"
                className="community-search-input"
              />
              <select
                value={sort}
                onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
                className="community-sort-select"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="community-main">
        {error && (
          <div className="community-error-banner">
            <span className="community-error-message">Failed to load: {error}</span>
            <button
              onClick={() => fetchAssets(null, true)}
              className="community-retry-btn"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="gallery-grid community-gallery-grid community-gallery-grid-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="gallery-card gallery-card--skeleton" style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : (
          <>
            <div className="gallery-grid community-gallery-grid">
              {assets.length === 0 ? (
                <EmptyState search={debouncedSearch} />
              ) : (
                assets.map((asset, i) => (
                  <CommunityCard
                    key={asset.id}
                    asset={asset}
                    index={i}
                    onClick={() => setSelectedIndex(i)}
                  />
                ))
              )}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="community-sentinel" />

            {/* Load more indicator */}
            {loadingMore && (
              <div className="community-load-more">
                <Spinner />
                <span className="community-load-more-text">Loading more…</span>
              </div>
            )}

            {/* Stats footer */}
            {assets.length > 0 && !hasMore && (
              <p className="community-stats-footer">
                {assets.length} asset{assets.length !== 1 ? 's' : ''} loaded
                {modeFilter ? ` · ${MODE_FILTERS.find(m => m.id === modeFilter)?.label ?? modeFilter}` : ''}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
