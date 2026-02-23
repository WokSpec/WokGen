'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  { id: '',         label: 'All Engines', icon: '✦' },
  { id: 'pixel',    label: 'Pixel',       icon: '🕹️' },
  { id: 'business', label: 'Business',    icon: '📊' },
  { id: 'uiux',     label: 'UI/UX',       icon: '🖥️' },
  { id: 'vector',   label: 'Vector',      icon: '⬡'  },
  { id: 'emoji',    label: 'Emoji',       icon: '😊' },
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
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid var(--surface-border)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const color = MODE_COLORS[mode] ?? 'var(--text-muted)';
  const label = MODE_LABELS[mode] ?? capitalize(mode);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        lineHeight: 1,
      }}
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.85)',
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
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', borderRadius: 8, width: 40, height: 40, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          aria-label="Previous"
        >←</button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', borderRadius: 8, width: 40, height: 40, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          aria-label="Next"
        >→</button>
      )}

      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 760,
          maxHeight: 'calc(100dvh - 64px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {asset.mode && <ModeBadge mode={asset.mode} />}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {capitalize(asset.tool)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setZoom(nextZoom)}
              style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 5, background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              {zoom}× zoom
            </button>
            <button
              onClick={download}
              style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 5, background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              ↓ Download
            </button>
            <button
              onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image */}
        <div
          style={{
            background: 'repeating-conic-gradient(#1a1a24 0% 25%, #13131b 0% 50%) 0 0 / 16px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            minHeight: 260,
          }}
        >
          <img
            src={asset.imageUrl}
            alt={asset.title ?? asset.prompt}
            style={{
              maxWidth: '100%',
              maxHeight: 480,
              objectFit: 'contain',
              imageRendering: asset.mode === 'pixel' ? 'pixelated' : 'auto',
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              transition: 'transform 0.15s ease',
            }}
          />
        </div>

        {/* Details */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Prompt */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)' }}>Prompt</span>
              <button
                onClick={copyPrompt}
                style={{ fontSize: '0.65rem', color: copied ? 'var(--success)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {copied ? '✓ Copied' : '⊕ Copy'}
              </button>
            </div>
            <p
              style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, padding: '8px 10px', background: 'var(--surface-overlay)', borderRadius: 6, border: '1px solid var(--surface-border)', cursor: 'pointer' }}
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
                <span key={tag} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 99, background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--surface-border)' }}>
            {asset.rarity && (
              <span style={{ fontSize: '0.65rem', color: RARITY_COLORS[asset.rarity] ?? 'var(--text-muted)', fontWeight: 600 }}>
                {capitalize(asset.rarity)}
              </span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-disabled)' }}>{asset.size}px</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-disabled)' }}>{timeAgo(asset.createdAt)}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-disabled)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PROVIDER_COLORS[asset.provider] ?? '#666' }} />
              {PROVIDER_LABELS[asset.provider] ?? asset.provider}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-disabled)' }}>
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
      className="gallery-card animate-fade-in"
      style={{
        animationDelay: `${Math.min(index * 0.025, 0.5)}s`,
        boxShadow: rarityColor ? `0 0 0 1px ${rarityColor}25` : undefined,
        textAlign: 'left',
        width: '100%',
        padding: 0,
        position: 'relative',
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
          style={{
            imageRendering: asset.mode === 'pixel' ? 'pixelated' : 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            width: '100%',
            height: 'auto',
          }}
        />

        {/* Mode badge top-left */}
        {asset.mode && modeColor && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              fontSize: '0.52rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '2px 5px',
              borderRadius: 3,
              background: `${modeColor}28`,
              color: modeColor,
              border: `1px solid ${modeColor}45`,
              lineHeight: 1,
              backdropFilter: 'blur(4px)',
            }}
          >
            {MODE_LABELS[asset.mode] ?? capitalize(asset.mode)}
          </span>
        )}

        {/* Rarity corner */}
        {rarityColor && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: 2,
              background: rarityColor,
              boxShadow: `0 0 6px 1px ${rarityColor}60`,
            }}
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
    <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '80px 20px' }}>
      <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>✦</div>
      <h3 className="empty-state-title">Community is just getting started</h3>
      <p className="empty-state-body">
        Be the first to share. Generate something in a studio and enable &ldquo;Share to Gallery&rdquo;.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
        <Link href="/pixel/studio" style={{ padding: '8px 16px', borderRadius: 6, background: 'rgba(167,139,250,.15)', border: '1px solid rgba(167,139,250,.3)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
          🕹️ Pixel Studio
        </Link>
        <Link href="/business/studio" style={{ padding: '8px 16px', borderRadius: 6, background: 'rgba(56,183,100,.1)', border: '1px solid rgba(56,183,100,.25)', color: '#38B764', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
          📊 Business Studio
        </Link>
        <Link href="/uiux/studio" style={{ padding: '8px 16px', borderRadius: 6, background: 'rgba(65,166,246,.1)', border: '1px solid rgba(65,166,246,.25)', color: '#41A6F6', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
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
    <div style={{ minHeight: 'calc(100dvh - 56px)', background: 'var(--surface-base)' }}>
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
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                Community
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3, marginBottom: 0 }}>
                Public generations from all engines — shared by WokGen users
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {/* Public-by-default toggle (only for signed-in users) */}
              {session?.user && (
                <button
                  onClick={togglePublicDefault}
                  disabled={savingDefault}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--surface-border)',
                    background: publicDefault ? 'rgba(167,139,250,.12)' : 'var(--surface-overlay)',
                    color: publicDefault ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: savingDefault ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title={publicDefault ? 'Your new generations default to public' : 'Your new generations default to private'}
                >
                  <span
                    style={{
                      width: 28,
                      height: 16,
                      borderRadius: 8,
                      background: publicDefault ? 'var(--accent)' : 'var(--surface-border)',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: publicDefault ? 14 : 2,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </span>
                  Public by default
                </button>
              )}

              {/* Studio CTA */}
              <Link
                href="/pixel/studio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 6,
                  background: 'var(--accent)',
                  color: '#0d0d14',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                ✦ Create
              </Link>
            </div>
          </div>

          {/* Mode tabs + search row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              borderTop: '1px solid var(--surface-border)',
              marginLeft: -24,
              marginRight: -24,
              paddingLeft: 24,
            }}
          >
            {/* Community/Mine tabs */}
            {session?.user && (
              <>
                {(['community', 'mine'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGalleryTab(tab)}
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: galleryTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                      color: galleryTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s ease',
                      marginBottom: -1,
                    }}
                  >
                    {tab === 'community' ? '🌐 Community' : '🔒 My Generations'}
                  </button>
                ))}
                <div style={{ width: 1, height: 20, background: 'var(--surface-border)', margin: '0 8px', flexShrink: 0 }} />
              </>
            )}

            {/* Mode filter tabs */}
            {MODE_FILTERS.map(m => (
              <button
                key={m.id}
                onClick={() => setModeFilter(m.id)}
                style={{
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  fontWeight: modeFilter === m.id ? 600 : 400,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: modeFilter === m.id ? '2px solid var(--accent)' : '2px solid transparent',
                  color: modeFilter === m.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease',
                  marginBottom: -1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span style={{ fontSize: '0.9em' }}>{m.icon}</span>
                {m.label}
              </button>
            ))}

            {/* Spacer + search + sort */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 24, paddingBottom: 2, paddingTop: 2, flexShrink: 0 }}>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search prompts…"
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-overlay)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  width: 180,
                  outline: 'none',
                }}
              />
              <select
                value={sort}
                onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-overlay)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
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
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 80px' }}>
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,.1)',
            border: '1px solid rgba(239,68,68,.25)', color: '#f87171', fontSize: '0.85rem',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ flex: 1 }}>⚠️ Failed to load: {error}</span>
            <button
              onClick={() => fetchAssets(null, true)}
              style={{
                fontSize: 12, color: '#818cf8', background: 'none',
                border: '1px solid #818cf8', borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div
            className="gallery-grid"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', padding: '24px' }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="gallery-card gallery-card--skeleton" style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : (
          <>
            <div
              className="gallery-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
            >
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
            <div ref={sentinelRef} style={{ height: 1 }} />

            {/* Load more indicator */}
            {loadingMore && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', gap: 8, alignItems: 'center' }}>
                <Spinner />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading more…</span>
              </div>
            )}

            {/* Stats footer */}
            {assets.length > 0 && !hasMore && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-disabled)', marginTop: 32 }}>
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
