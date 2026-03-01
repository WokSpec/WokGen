'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EmptyState } from '@/app/_components/EmptyState';

// ── Types ─────────────────────────────────────────────────────────────────

interface GalleryAsset {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  prompt: string;
  mode: string | null;
  tool: string;
  provider: string;
  createdAt: string;
  rarity: string | null;
  user?: { name: string | null; image: string | null } | null;
}

interface GalleryResponse {
  assets: GalleryAsset[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

// ── Constants ─────────────────────────────────────────────────────────────

const MODE_FILTERS = [
  { id: '',         label: 'All',      color: 'var(--accent)'  },
  { id: 'pixel',    label: 'Pixel',    color: '#B06EFF'        },
  { id: 'vector',   label: 'Vector',   color: '#41A6F6'        },
  { id: 'uiux',     label: 'UI/UX',    color: '#73EFF7'        },
  { id: 'business', label: 'Business', color: '#FFCD75'        },
  { id: 'voice',    label: 'Voice',    color: '#38B764'        },
  { id: 'code',     label: 'Code',     color: '#FF9D00'        },
] as const;

const SORT_OPTIONS = [
  { id: 'newest', label: 'Latest'   },
  { id: 'oldest', label: 'Oldest'   },
] as const;

const DATE_FILTERS = [
  { id: '',       label: 'All Time'   },
  { id: 'today',  label: 'Today'      },
  { id: 'week',   label: 'This Week'  },
  { id: 'month',  label: 'This Month' },
] as const;

const BLUR_PH = 'data:image/png;base64,iVBORw0KGgoAAAANSUBEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function modeColor(mode: string | null): string {
  return MODE_FILTERS.find((m) => m.id === (mode ?? ''))?.color ?? 'var(--text-muted)';
}

function modeLabel(mode: string | null): string {
  if (!mode) return 'Unknown';
  return MODE_FILTERS.find((m) => m.id === mode)?.label ?? mode;
}

// ── GalleryCard ───────────────────────────────────────────────────────────

function GalleryCard({ asset }: { asset: GalleryAsset }) {
  const img = asset.thumbUrl ?? asset.imageUrl;
  const color = modeColor(asset.mode);
  return (
    <div className="gallery-card break-inside-avoid">
      <div className="gallery-card__img-wrap">
        <Image
          src={img}
          alt={asset.prompt.slice(0, 60)}
          width={400}
          height={400}
          className="gallery-card__img"
          placeholder="blur"
          blurDataURL={BLUR_PH}
        />
        <div className="gallery-card__hover-overlay">
          <Link href={`/gallery/${asset.id}`} className="gallery-card__view-btn">View Full</Link>
        </div>
      </div>
      <div className="gallery-card__body">
        <div className="gallery-card__mode-badge" style={{ '--mode-color': color } as React.CSSProperties}>
          <span className="gallery-card__mode-dot" />
          {modeLabel(asset.mode)}
        </div>
        <p className="gallery-card__prompt">{asset.prompt}</p>
        <div className="gallery-card__footer">
          <div className="gallery-card__user">
            {asset.user?.image ? (
              <Image src={asset.user.image} alt="" width={20} height={20} className="gallery-card__avatar" />
            ) : (
              <div className="gallery-card__avatar gallery-card__avatar--default" />
            )}
            <span className="gallery-card__username">{asset.user?.name ?? 'anon'}</span>
          </div>
          <span className="gallery-card__time">{timeAgo(asset.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────

function useDebounced(value: string, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function GalleryClient() {
  const [mode,      setMode]      = useState('');
  const [sort,      setSort]      = useState<'newest' | 'oldest'>('newest');
  const [search,    setSearch]    = useState('');
  const [dateRange, setDateRange] = useState('');
  const [assets,    setAssets]    = useState<GalleryAsset[]>([]);
  const [cursor,    setCursor]    = useState<string | null>(null);
  const [hasMore,   setHasMore]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (reset: boolean, overrideCursor?: string | null) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort, limit: '24' });
      if (mode)                       params.set('mode',   mode);
      if (debouncedSearch.trim())     params.set('search', debouncedSearch.trim());
      if (!reset && overrideCursor)   params.set('cursor', overrideCursor);
      const res = await fetch(`/api/gallery?${params}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`Gallery fetch failed (${res.status})`);
      const data: GalleryResponse = await res.json();
      setAssets((prev) => reset ? data.assets : [...prev, ...data.assets]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, [mode, sort, debouncedSearch]);

  useEffect(() => {
    setCursor(null);
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sort, debouncedSearch, dateRange]);

  function handleLoadMore() {
    load(false, cursor);
  }

  function handleReset() {
    setMode('');
    setSearch('');
    setDateRange('');
    setSort('newest');
  }

  return (
    <div className="gallery-universal">
      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="gallery-filters">
        <div className="gallery-filters__modes">
          {MODE_FILTERS.map((m) => (
            <button
              key={m.id}
              className={`gallery-mode-pill${mode === m.id ? ' gallery-mode-pill--active' : ''}`}
              style={{ '--pill-color': m.color } as React.CSSProperties}
              onClick={() => setMode(m.id)}
            >
              {m.id && <span className="gallery-mode-pill__dot" />}
              {m.label}
            </button>
          ))}
        </div>
        <div className="gallery-filters__controls">
          <input
            type="search"
            placeholder="Search prompts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="gallery-search"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="gallery-select">
            {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="gallery-select">
            {DATE_FILTERS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      {error ? (
        <p className="gallery-state gallery-state--error">⚠ {error}</p>
      ) : assets.length === 0 && !loading ? (
        <EmptyState
          title="No generations found"
          description="Try adjusting your filters or check back later."
          action={{ label: 'Clear filters', href: '#' }}
        />
      ) : (
        <div className="gallery-grid">
          {assets.map((a) => <GalleryCard key={a.id} asset={a} />)}
        </div>
      )}

      {loading && <p className="gallery-loading">Loading…</p>}

      {!loading && hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="gallery-load-more" onClick={handleLoadMore}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
