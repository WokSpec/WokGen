'use client';




import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TextAsset {
  id: string;
  tool?: string;      // contentType stored in tool field
  prompt?: string;    // the original prompt
  imageUrl: string;   // content stored in imageUrl for consistency
  tags?: string;      // JSON: { tone, contentType, wordCount }
  createdAt: string;
  mode?: string;
}

interface GalleryResponse {
  assets: TextAsset[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCENT = '#10b981';

const CONTENT_FILTERS = [
  { id: '',             label: 'All'          },
  { id: 'headline',     label: 'Headline'     },
  { id: 'tagline',      label: 'Tagline'      },
  { id: 'blog',         label: 'Blog'         },
  { id: 'product-desc', label: 'Product'      },
  { id: 'email',        label: 'Email'        },
  { id: 'social',       label: 'Social'       },
  { id: 'code-snippet', label: 'Code'         },
  { id: 'story',        label: 'Story'        },
  { id: 'essay',        label: 'Essay'        },
  { id: 'ad-copy',      label: 'Ad Copy'      },
];



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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------
function TextCard({ asset }: { asset: TextAsset }) {
  const [copied, setCopied] = useState(false);
  const tags        = parseTags(asset.tags);
  const contentType = asset.tool ?? tags.contentType ?? 'headline';
  const tone        = tags.tone ?? '';
  // imageUrl holds the generated text content for text mode
  const content     = asset.imageUrl ?? '';
  const excerpt     = content.slice(0, 100) + (content.length > 100 ? '…' : '');
  const words       = tags.wordCount ? Number(tags.wordCount) : countWords(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      padding: 16, borderRadius: 10,
      background: 'var(--surface)', border: '1px solid var(--surface-border)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16 }}></span>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11,
            background: `${ACCENT}22`, color: ACCENT, fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            {contentType.replace('-', ' ')}
          </span>
          {tone && (
            <span style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 11,
              background: 'var(--surface-border)', color: 'var(--text-muted)',
            }}>
              {tone}
            </span>
          )}
          <span style={{
            padding: '2px 6px', borderRadius: 4, fontSize: 11,
            background: 'var(--surface-border)', color: 'var(--text-muted)',
          }}>
            {words}w
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
          {timeAgo(asset.createdAt)}
        </span>
      </div>

      {/* Content excerpt */}
      <p style={{
        fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
        margin: 0,
        fontFamily: contentType === 'code-snippet' ? 'monospace' : 'inherit',
      }}>
        {excerpt || <em style={{ color: 'var(--text-muted)' }}>No content</em>}
      </p>

      {/* Copy button */}
      <button type="button"
        onClick={handleCopy}
        style={{
          alignSelf: 'flex-start',
          padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12,
          background: copied ? `${ACCENT}22` : 'var(--surface-border)',
          color: copied ? ACCENT : 'var(--text)', cursor: 'pointer',
          fontWeight: copied ? 600 : 400,
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main gallery page
// ---------------------------------------------------------------------------
export default function TextGallery() {
  const [assets, setAssets]           = useState<TextAsset[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [typeFilter, setTypeFilter]   = useState('');
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
    if (p.get('type'))   setTypeFilter(p.get('type')!);
    if (p.get('search')) setSearch(p.get('search')!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with active filters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (typeFilter)      p.set('type', typeFilter);
    if (debouncedSearch) p.set('search', debouncedSearch);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [typeFilter, debouncedSearch]);

  const fetchAssets = useCallback(
    async (cursor: string | null, reset = false) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: '24', mode: 'text' });
        if (cursor)                  params.set('cursor', cursor);
        if (typeFilter)              params.set('tool', typeFilter);
        if (debouncedSearch.trim())  params.set('search', debouncedSearch.trim());

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
    [typeFilter, debouncedSearch],
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
            <h1 className="gallery-title">Text Gallery</h1>
            <p className="gallery-desc">Headlines, copy, blogs, and creative writing</p>
          </div>
          <Link href="/text/studio" className="btn-primary btn-sm">
            + New Text
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="gallery-filters">
        <div className="gallery-pill-row" style={{ flexWrap: 'wrap' }}>
          {CONTENT_FILTERS.map(f => (
            <button type="button"
              key={f.id}
              className={`gallery-pill${typeFilter === f.id ? ' active' : ''}`}
              onClick={() => setTypeFilter(f.id)}
              style={typeFilter === f.id ? { borderColor: ACCENT, color: ACCENT, background: `${ACCENT}18` } : {}}
            >
              {f.id ? `$ ` : ''}{f.label}
            </button>
          ))}
        </div>
        <input
          className="gallery-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search text assets…"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          padding: '24px',
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="gallery-card--skeleton-tall" style={{ animationDelay: `${i * 0.07}s`, minHeight: 130 }} />
          ))}
        </div>
      ) : error ? (
        <div className="gallery-error">
          <span>!</span>
          <p>Failed to load gallery</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Check your connection and try again</p>
          <button type="button" className="btn-ghost btn-sm" onClick={() => void fetchAssets(null, true)}>
            Retry
          </button>
        </div>
      ) : assets.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon"></div>
          <p className="gallery-empty-title">No text assets yet</p>
          <p className="gallery-empty-desc">
            Generate your first piece of content in Text mode.
          </p>
          <Link href="/text/studio" className="btn-primary btn-sm">
            Go to Text mode →
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          padding: '24px',
        }}>
          {assets.map(asset => (
            <TextCard key={asset.id} asset={asset} />
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
