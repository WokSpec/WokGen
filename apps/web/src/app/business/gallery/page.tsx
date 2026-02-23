'use client';




import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface GalleryAsset {
  id: string;
  tool?: string;
  prompt?: string;
  width?: number;
  height?: number;
  resultUrl: string;
  imageUrl: string;
  createdAt: string;
}

interface GalleryResponse {
  assets: GalleryAsset[];
  nextCursor: string | null;
  hasMore: boolean;
}

const TOOL_FILTERS = [
  { id: '',          label: 'All' },
  { id: 'logo',      label: 'Logo' },
  { id: 'brand-kit', label: 'Brand Kit' },
  { id: 'slide',     label: 'Slide' },
  { id: 'social',    label: 'Social' },
  { id: 'web-hero',  label: 'Web Hero' },
];

export default function BusinessGallery() {
  const { data: session } = useSession();
  const [assets, setAssets]         = useState<GalleryAsset[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]       = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState('');
  const [galleryTab, setGalleryTab] = useState<'community' | 'mine'>('community');
  const [selected, setSelected]     = useState<GalleryAsset | null>(null);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  // Initialize filters from URL on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('tool'))   setToolFilter(p.get('tool')!);
    if (p.get('search')) setSearch(p.get('search')!);
    if (p.get('tab') === 'mine') setGalleryTab('mine');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (toolFilter)      p.set('tool', toolFilter);
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (galleryTab === 'mine') p.set('tab', 'mine');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [toolFilter, debouncedSearch, galleryTab]);

  const fetchAssets = useCallback(
    async (cursor: string | null, reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: '24', mode: 'business' });
        if (cursor) params.set('cursor', cursor);
        if (toolFilter) params.set('tool', toolFilter);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (galleryTab === 'mine') params.set('mine', 'true');

        const res  = await fetch(`/api/gallery?${params.toString()}`);
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
    [toolFilter, debouncedSearch, galleryTab],
  );

  useEffect(() => { fetchAssets(null, true); }, [fetchAssets]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) fetchAssets(nextCursor);
  }, [fetchAssets, loadingMore, hasMore, nextCursor]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
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
            <h1 className="gallery-title">Business Gallery</h1>
            <p className="gallery-desc">Logos, brand kits, slides, and marketing assets</p>
          </div>
          <Link href="/business/studio" className="btn-primary btn-sm">
            + New Asset
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="gallery-filters">
        {/* Tab */}
        <div className="gallery-tabs">
          <button
            className={`gallery-tab${galleryTab === 'community' ? ' active' : ''}`}
            onClick={() => setGalleryTab('community')}
          >Community</button>
          {session && (
            <button
              className={`gallery-tab${galleryTab === 'mine' ? ' active' : ''}`}
              onClick={() => setGalleryTab('mine')}
            >Mine</button>
          )}
        </div>

        {/* Tool pills */}
        <div className="gallery-pill-row">
          {TOOL_FILTERS.map(f => (
            <button
              key={f.id}
              className={`gallery-pill${toolFilter === f.id ? ' active' : ''}`}
              onClick={() => setToolFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          className="gallery-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prompts…"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="gallery-grid gallery-grid--natural" style={{ padding: '24px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="gallery-card gallery-card--skeleton" style={{ animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
      ) : error ? (
        <div className="gallery-error">
          <span className="gallery-warn-icon">!</span>
          <p>Failed to load gallery</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Check your connection and try again</p>
          <button className="btn-ghost btn-sm" onClick={() => fetchAssets(null, true)}>Retry</button>
        </div>
      ) : assets.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon"></div>
          <p className="gallery-empty-title">No business assets yet</p>
          <p className="gallery-empty-desc">Generate your first business asset in the Business Studio.</p>
          <Link href="/business/studio" className="btn-primary btn-sm">Go to Business Studio →</Link>
        </div>
      ) : (
        <div className="gallery-grid gallery-grid--natural">
          {assets.map(asset => (
            <button
              key={asset.id}
              className="gallery-card gallery-card--natural"
              onClick={() => setSelected(asset)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.imageUrl}
                alt={asset.prompt ?? 'Business asset'}
                className="gallery-card-img"
                loading="lazy"
              />
              {/* Hover download button */}
              <div className="gallery-card-dl-wrap">
                <a
                  href={asset.imageUrl}
                  download={`wokgen-biz-${asset.id}.png`}
                  onClick={e => e.stopPropagation()}
                  className="gallery-card-download-btn"
                  title="Download"
                  aria-label="Download"
                >
                  ↓
                </a>
              </div>
              <div className="gallery-card-overlay">
                {asset.tool && <span className="gallery-card-badge">{asset.tool}</span>}
                {asset.width && asset.height && (
                  <span className="gallery-card-badge gallery-card-badge--dim">
                    {asset.width}×{asset.height}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Load more sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && (
        <div className="gallery-loading-more"><div className="studio-spinner studio-spinner--sm" /></div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="gallery-lightbox" onClick={() => setSelected(null)}>
          <div className="gallery-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="gallery-lightbox-close" onClick={() => setSelected(null)}>×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.imageUrl}
              alt={selected.prompt ?? ''}
              className="gallery-lightbox-img biz-lightbox-img"
            />
            {selected.prompt && (
              <p className="gallery-lightbox-prompt">{selected.prompt}</p>
            )}
            <div className="gallery-lightbox-actions">
              <a
                href={selected.imageUrl}
                download
                className="btn-ghost btn-sm"
                onClick={e => e.stopPropagation()}
              >
                ↓ Download
              </a>
              <Link href={`/business/studio?prompt=${encodeURIComponent(selected.prompt ?? '')}`} className="btn-primary btn-sm">
                Generate Similar
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
