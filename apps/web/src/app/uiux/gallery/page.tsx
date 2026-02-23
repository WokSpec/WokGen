'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface GalleryAsset {
  id: string;
  tool?: string;       // component type: hero, pricing, navbar, etc.
  prompt?: string;
  resultUrl?: string;
  imageUrl?: string;
  createdAt: string;
  framework?: string;  // html-tailwind, react-tsx, next-tsx
}

interface GalleryResponse {
  assets: GalleryAsset[];
  nextCursor: string | null;
  hasMore: boolean;
}

const COMPONENT_FILTERS = [
  { id: '',          label: 'All' },
  { id: 'hero',      label: 'Hero' },
  { id: 'pricing',   label: 'Pricing' },
  { id: 'navbar',    label: 'Navbar' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'card',      label: 'Card' },
  { id: 'form',      label: 'Form' },
  { id: 'landing',   label: 'Landing' },
  { id: 'auth',      label: 'Auth' },
  { id: 'other',     label: 'Other' },
];

const FRAMEWORK_FILTERS = [
  { id: '',              label: 'All' },
  { id: 'html-tailwind', label: 'HTML+Tailwind' },
  { id: 'react-tsx',     label: 'React TSX' },
  { id: 'next-tsx',      label: 'Next TSX' },
];

const COMPONENT_ICONS: Record<string, string> = {
  hero:         '🏠',
  pricing:      '💰',
  navbar:       '☰',
  card:         '🃏',
  form:         '📝',
  dashboard:    '📊',
  landing:      '🚀',
  auth:         '🔐',
  settings:     '⚙️',
  table:        '📋',
  modal:        '📦',
  sidebar:      '◫',
  footer:       '🔻',
  faq:          '❓',
  testimonials: '💬',
  features:     '✨',
  cta:          '🎯',
  custom:       '🎨',
};

function getComponentIcon(tool?: string): string {
  if (!tool) return '🎨';
  return COMPONENT_ICONS[tool.toLowerCase()] ?? '🎨';
}

function getFrameworkLabel(framework?: string): string {
  switch (framework) {
    case 'html-tailwind': return 'HTML+Tailwind';
    case 'react-tsx':     return 'React TSX';
    case 'next-tsx':      return 'Next TSX';
    default:              return framework ?? '';
  }
}

export default function UIUXGallery() {
  const { data: session } = useSession();
  const [assets, setAssets]                   = useState<GalleryAsset[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [hasMore, setHasMore]                 = useState(false);
  const [nextCursor, setNextCursor]           = useState<string | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [componentFilter, setComponentFilter] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('');
  const [galleryTab, setGalleryTab]           = useState<'community' | 'mine'>('community');
  const [selected, setSelected]               = useState<GalleryAsset | null>(null);
  const [search, setSearch]                   = useState('');
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
    if (p.get('tool'))      setComponentFilter(p.get('tool')!);
    if (p.get('framework')) setFrameworkFilter(p.get('framework')!);
    if (p.get('search'))    setSearch(p.get('search')!);
    if (p.get('tab') === 'mine') setGalleryTab('mine');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (componentFilter) p.set('tool', componentFilter);
    if (frameworkFilter) p.set('framework', frameworkFilter);
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (galleryTab === 'mine') p.set('tab', 'mine');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [componentFilter, frameworkFilter, debouncedSearch, galleryTab]);

  const fetchAssets = useCallback(
    async (cursor: string | null, reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: '24', mode: 'uiux' });
        if (cursor) params.set('cursor', cursor);
        if (componentFilter) params.set('tool', componentFilter);
        if (frameworkFilter) params.set('framework', frameworkFilter);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (galleryTab === 'mine') params.set('mine', 'true');

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
    [componentFilter, frameworkFilter, debouncedSearch, galleryTab],
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
            <h1 className="gallery-title">UI/UX Component Gallery</h1>
            <p className="gallery-desc">Hero sections, pricing tables, navbars, and more</p>
          </div>
          <Link href="/uiux/studio" className="btn-primary btn-sm">
            + New Component
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="gallery-filters">
        {/* Tabs */}
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

        {/* Component type pills */}
        <div className="gallery-pill-row">
          {COMPONENT_FILTERS.map(f => (
            <button
              key={f.id}
              className={`gallery-pill${componentFilter === f.id ? ' active' : ''}`}
              onClick={() => setComponentFilter(f.id)}
            >
              {f.id ? `${getComponentIcon(f.id)} ${f.label}` : f.label}
            </button>
          ))}
        </div>

        {/* Framework pills */}
        <div className="gallery-pill-row">
          {FRAMEWORK_FILTERS.map(f => (
            <button
              key={f.id}
              className={`gallery-pill gallery-pill--sm${frameworkFilter === f.id ? ' active' : ''}`}
              onClick={() => setFrameworkFilter(f.id)}
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
        <div className="gallery-grid gallery-grid--uiux" style={{ padding: '24px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="gallery-card--skeleton-tall" style={{ animationDelay: `${i * 0.07}s`, minHeight: 160 }} />
          ))}
        </div>
      ) : error ? (
        <div className="gallery-error">
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <p>Failed to load gallery</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Check your connection and try again</p>
          <button className="btn-ghost btn-sm" onClick={() => fetchAssets(null, true)}>Retry</button>
        </div>
      ) : assets.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">🖥️</div>
          <p className="gallery-empty-title">No UI/UX components yet</p>
          <p className="gallery-empty-desc">Generate your first UI component in the UI/UX Studio.</p>
          <Link href="/uiux/studio" className="btn-primary btn-sm">Go to UI/UX Studio →</Link>
        </div>
      ) : (
        <div className="gallery-grid gallery-grid--uiux">
          {assets.map(asset => (
            <button
              key={asset.id}
              className="gallery-card gallery-card--uiux"
              onClick={() => setSelected(asset)}
            >
              {/* Preview: image if available, else code-preview placeholder */}
              {asset.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.imageUrl}
                  alt={asset.prompt ?? 'UI component preview'}
                  className="gallery-card-img"
                  loading="lazy"
                />
              ) : (
                <div className="gallery-card-code-preview">
                  <span className="gallery-card-code-icon">{getComponentIcon(asset.tool)}</span>
                  <span className="gallery-card-code-type">{asset.tool ?? 'component'}</span>
                  <span className="gallery-card-code-hint">{'</>  code'}</span>
                </div>
              )}

              {/* Overlay badges */}
              <div className="gallery-card-overlay">
                {asset.tool && (
                  <span className="gallery-card-badge gallery-card-badge--component">
                    {getComponentIcon(asset.tool)} {asset.tool}
                  </span>
                )}
                {asset.framework && (
                  <span className="gallery-card-badge gallery-card-badge--framework">
                    {getFrameworkLabel(asset.framework)}
                  </span>
                )}
              </div>

              {/* Prompt excerpt + date */}
              {asset.prompt && (
                <div className="gallery-card-caption">
                  <p className="gallery-card-prompt">{asset.prompt}</p>
                  <span className="gallery-card-date">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Load more sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && (
        <div className="gallery-loading-more"><div className="studio-spinner studio-spinner--sm" /></div>
      )}

      {/* Modal */}
      {selected && (
        <div className="gallery-lightbox" onClick={() => setSelected(null)}>
          <div className="gallery-lightbox-inner gallery-lightbox-inner--uiux" onClick={e => e.stopPropagation()}>
            <button className="gallery-lightbox-close" onClick={() => setSelected(null)}>✕</button>

            {/* Preview area */}
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt={selected.prompt ?? ''}
                className="gallery-lightbox-img"
              />
            ) : (
              <div className="gallery-lightbox-code-preview">
                <span className="gallery-lightbox-code-icon">{getComponentIcon(selected.tool)}</span>
                <span className="gallery-lightbox-code-type">{selected.tool ?? 'component'}</span>
              </div>
            )}

            {/* Meta badges */}
            <div className="gallery-lightbox-badges">
              {selected.tool && (
                <span className="gallery-card-badge gallery-card-badge--component">
                  {getComponentIcon(selected.tool)} {selected.tool}
                </span>
              )}
              {selected.framework && (
                <span className="gallery-card-badge gallery-card-badge--framework">
                  {getFrameworkLabel(selected.framework)}
                </span>
              )}
            </div>

            {/* Full prompt */}
            {selected.prompt && (
              <p className="gallery-lightbox-prompt">{selected.prompt}</p>
            )}

            {/* Actions */}
            <div className="gallery-lightbox-actions">
              <Link
                href={`/uiux/studio?prompt=${encodeURIComponent(selected.prompt ?? '')}`}
                className="btn-primary btn-sm"
                onClick={() => setSelected(null)}
              >
                Generate Similar
              </Link>
              {selected.resultUrl && (
                <a
                  href={selected.resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-sm"
                  onClick={e => e.stopPropagation()}
                >
                  View Code ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
