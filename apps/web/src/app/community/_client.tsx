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
  { id: '',         label: 'All',      icon: '✦' },
  { id: 'pixel',    label: 'Pixel',    icon: 'Px' },
  { id: 'business', label: 'Business', icon: 'Biz' },
  { id: 'vector',   label: 'Vector',   icon: 'Vec' },
  { id: 'uiux',     label: 'UI/UX',    icon: 'host' },
  { id: 'voice',    label: 'Voice',    icon: 'V' },
  { id: 'text',     label: 'Text',     icon: 'Tx' },
] as const;

const SORT_OPTIONS = [
  { id: 'newest',   label: 'Latest'  },
  { id: 'trending', label: 'Popular' },
  { id: 'random',   label: 'Random'  },
] as const;

type SortId = 'newest' | 'trending' | 'random';

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
  voice:    '#f472b6',
  text:     '#34d399',
};

const MODE_LABELS: Record<string, string> = {
  pixel:    'Pixel',
  business: 'Business',
  uiux:     'UI/UX',
  vector:   'Vector',
  voice:    'Voice',
  text:     'Text',
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
  return <span className="community-spinner" aria-hidden="true" />;
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
  const [styleCopied, setStyleCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

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

  const copyStyle = () => {
    try {
      const token = { mode: asset.mode, style: null, prompt: asset.prompt };
      localStorage.setItem('wokgen:style_token', JSON.stringify(token));
      setStyleCopied(true);
      setTimeout(() => setStyleCopied(false), 1800);
    } catch { /* ignore */ }
  };

  const shareAsset = async () => {
    const url = `${window.location.origin}/community?asset=${asset.id}`;
    await navigator.clipboard.writeText(url).catch(() => null);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1800);
  };

  const ZOOM_STEPS = [1, 2, 4, 8];
  const nextZoom = ZOOM_STEPS[(ZOOM_STEPS.indexOf(zoom) + 1) % ZOOM_STEPS.length];

  const remixHref = asset.mode
    ? `/${asset.mode}/studio?prompt=${encodeURIComponent(asset.prompt)}`
    : `/studio?type=pixel&prompt=${encodeURIComponent(asset.prompt)}`;

  return (
    <div
      className="community-modal-overlay gallery-modal-overlay"
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

      <div className="community-modal-content gallery-modal">
        {/* Header */}
        <div className="community-modal-header">
          <div className="community-modal-header-left">
            {asset.mode && <ModeBadge mode={asset.mode} />}
            <span className="community-modal-tool-name">{capitalize(asset.tool)}</span>
          </div>
          <div className="community-modal-header-right">
            <button onClick={() => setZoom(nextZoom)} className="community-modal-btn">
              {zoom}× zoom
            </button>
            <button onClick={download} className="community-modal-btn">
              ↓ Download
            </button>
            <button
              onClick={copyStyle}
              className={`community-modal-btn${styleCopied ? ' community-modal-btn--copied' : ''}`}
            >
              {styleCopied ? 'Style copied' : '⊕ Copy style'}
            </button>
            <button
              onClick={shareAsset}
              className={`community-modal-btn${urlCopied ? ' community-modal-btn--copied' : ''}`}
              title="Copy shareable link"
            >
              {urlCopied ? '✓ Link copied' : '⤴ Share'}
            </button>
            <button onClick={onClose} className="community-modal-close-btn" aria-label="Close">✕</button>
          </div>
        </div>

        {/* Image */}
        <div className="community-modal-img-container">
          <img
            src={asset.imageUrl}
            alt={asset.title ?? asset.prompt}
            loading="lazy"
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
            <p className="community-modal-prompt-text" onClick={copyPrompt} title="Click to copy">
              {asset.prompt}
            </p>
          </div>

          {/* Tags */}
          {asset.tags?.length > 0 && (
            <div className="community-modal-tags">
              {asset.tags.slice(0, 10).map((tag) => (
                <span key={tag} className="community-modal-tag">{tag}</span>
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
            <span className="community-modal-id">{asset.id.slice(0, 12)}…</span>
          </div>

          {/* Remix CTA */}
          <div className="community-modal-remix-row">
            <Link href={remixHref} className="gallery-card-remix-btn community-modal-remix-btn">
              ↻ Remix this in {asset.mode ? MODE_LABELS[asset.mode] ?? capitalize(asset.mode) : 'Studio'}
            </Link>
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
        borderLeft: modeColor ? `3px solid ${modeColor}` : undefined,
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
            className="community-card-mode-badge gallery-card-mode-badge"
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

      {/* Hover download + remix buttons */}
      <div className="gallery-card-dl-wrap">
        <a
          href={asset.imageUrl}
          download={`wokgen-${asset.id}.png`}
          onClick={e => e.stopPropagation()}
          className="gallery-card-download-btn"
          title="Download"
          aria-label="Download"
        >↓</a>
        {asset.mode && (
          <a
            href={`/${asset.mode}/studio?prompt=${encodeURIComponent(asset.prompt)}`}
            onClick={e => e.stopPropagation()}
            className="gallery-card-download-btn gallery-card-remix-btn"
            title="Remix in studio"
            aria-label="Remix"
          >↻</a>
        )}
      </div>

      {/* Hover overlay */}
      <div className="gallery-card-overlay">
        <p className="line-clamp-2 community-card-overlay-text">{asset.prompt}</p>
        <div className="community-card-overlay-meta">
          <span className="community-card-overlay-size">{asset.size}px</span>
          <span className="community-card-overlay-dot" style={{ background: PROVIDER_COLORS[asset.provider] ?? '#666' }} />
          <span className="community-card-overlay-time">{timeAgo(asset.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="gallery-card gallery-skeleton"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ search }: { search: string }) {
  if (search) {
    return (
      <div className="empty-state community-empty-wrap">
        <div className="empty-state-icon community-empty-icon" />
        <h3 className="empty-state-title">No results for &ldquo;{search}&rdquo;</h3>
        <p className="empty-state-body">Try a different search term or clear filters.</p>
      </div>
    );
  }
  return (
    <div className="empty-state community-empty-wrap">
      <div className="empty-state-icon community-empty-icon community-empty-icon--lg" />
      <h3 className="empty-state-title">Community is just getting started</h3>
      <p className="empty-state-body">
        Be the first to share. Generate something in a studio and enable &ldquo;Share to Gallery&rdquo;.
      </p>
      <div className="community-empty-cta-row">
        <Link href="/studio?type=pixel" className="community-empty-link community-empty-link--pixel">Pixel Studio</Link>
        <Link href="/studio?type=business" className="community-empty-link community-empty-link--business">Brand Studio</Link>
        <Link href="/studio?type=uiux" className="community-empty-link community-empty-link--uiux">UI/UX Studio</Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Featured Creators
// ---------------------------------------------------------------------------

function FeaturedCreators() {
  return (
    <section className="community-featured-section">
      <div className="community-featured-header">
        <h2 className="community-featured-title">Featured Creators</h2>
        <p className="community-featured-desc">Community members making incredible things with WokGen.</p>
      </div>
      <div className="community-featured-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="community-featured-card">
            <div className="community-featured-avatar" />
            <div className="community-featured-info">
              <span className="community-featured-name">Be the first featured creator</span>
              <span className="community-featured-count">Share your generations to be featured</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export default function CommunityClient() {
  const { data: session } = useSession();
  const [assets, setAssets]               = useState<CommunityAsset[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [nextCursor, setNextCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]             = useState(false);
  const [galleryTab, setGalleryTab]       = useState<'community' | 'mine'>('community');
  const [statsText, setStatsText]         = useState<string>('');

  // Filters
  const [modeFilter, setModeFilter]       = useState('');
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort]                   = useState<SortId>('newest');

  // Modal
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Public default
  const [publicDefault, setPublicDefault] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);

  // Fetch stats
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.totalGenerations != null) {
          setStatsText(`${d.totalGenerations.toLocaleString()} assets · 6 modes · Community driven`);
        }
      })
      .catch(() => null);
  }, []);

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
    if (p.get('sort') === 'random')   setSort('random');
    if (p.get('sort') === 'trending') setSort('trending');
    if (p.get('tab') === 'mine')      setGalleryTab('mine');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (modeFilter)            p.set('mode', modeFilter);
    if (debouncedSearch)       p.set('search', debouncedSearch);
    if (sort !== 'newest')     p.set('sort', sort);
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
        // "random" sort fetches newest then shuffles client-side
        const apiSort = sort === 'random' ? 'newest' : sort;
        const params = new URLSearchParams({ limit: '24', sort: apiSort });
        if (cursor)                 params.set('cursor', cursor);
        if (modeFilter)             params.set('mode', modeFilter);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (galleryTab === 'mine')  params.set('mine', 'true');

        const res = await fetch(`/api/gallery?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: GalleryResponse = await res.json();
        let incoming = data.assets;
        if (sort === 'random') {
          // Fisher-Yates shuffle
          for (let i = incoming.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [incoming[i], incoming[j]] = [incoming[j], incoming[i]];
          }
        }
        setAssets((prev) => (reset ? incoming : [...prev, ...incoming]));
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
    <div className="community-page gallery-page">
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

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="community-page-header gallery-header">
        <div className="community-header-inner">
          {/* Title row */}
          <div className="community-title-row">
            <div className="community-title-left">
              <h1 className="community-heading">Community Gallery</h1>
              <p className="community-subtitle">Assets created with WokGen — free, public, remixable</p>
              {statsText && (
                <div className="gallery-stats-bar community-stats-bar">
                  <span className="gallery-stats-text">{statsText}</span>
                </div>
              )}
            </div>

            <div className="community-actions-row">
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
              <Link href="/studio" className="community-create-link">✦ Create</Link>
            </div>
          </div>

          {/* Filter row */}
          <div className="community-tabs-row gallery-filters">
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

            {/* Mode filter pills */}
            {MODE_FILTERS.map(m => (
              <button
                key={m.id}
                onClick={() => setModeFilter(m.id)}
                className={`gallery-filter-pill${modeFilter === m.id ? ' gallery-filter-pill--active' : ''}`}
                style={modeFilter === m.id && m.id && MODE_COLORS[m.id]
                  ? { '--pill-color': MODE_COLORS[m.id] } as React.CSSProperties
                  : undefined}
              >
                <span className="gallery-filter-pill-icon">{m.icon}</span>
                {m.label}
              </button>
            ))}

            {/* Sort + Search */}
            <div className="community-search-row">
              <div className="gallery-sort-group">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setSort(o.id as SortId)}
                    className={`gallery-filter-pill gallery-filter-pill--sort${sort === o.id ? ' gallery-filter-pill--active' : ''}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search prompts…"
                className="community-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="community-main">
        {error && (
          <div className="community-error-banner">
            <span className="community-error-message">
              {error.includes('401') || error.includes('403')
                ? 'Please sign in to continue.'
                : error.includes('429') || error.includes('Rate limit')
                ? 'Too many requests. Please wait a moment.'
                : 'Unable to load content. Please try again.'}
            </span>
            <button onClick={() => fetchAssets(null, true)} className="community-retry-btn">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="gallery-masonry community-gallery-grid-loading">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 0.05} />
            ))}
          </div>
        ) : (
          <>
            {assets.length === 0 ? (
              <EmptyState search={debouncedSearch} />
            ) : (
              <div className="gallery-masonry community-gallery-grid">
                {assets.map((asset, i) => (
                  <CommunityCard
                    key={asset.id}
                    asset={asset}
                    index={i}
                    onClick={() => setSelectedIndex(i)}
                  />
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="community-sentinel" />

            {/* Load more */}
            {loadingMore && (
              <div className="community-load-more">
                <Spinner />
                <span className="community-load-more-text">Loading more…</span>
              </div>
            )}

            {/* Explicit load more button when auto-scroll hasn't triggered */}
            {!loadingMore && hasMore && (
              <div className="gallery-load-more-wrap">
                <button onClick={loadMore} className="gallery-load-more">
                  Load more
                </button>
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

        {/* Featured Creators */}
        {!loading && galleryTab === 'community' && <FeaturedCreators />}
      </div>
    </div>
  );
}
