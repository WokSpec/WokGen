'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SkeletonGalleryGrid } from '@/app/_components/Skeleton';
// Inline Search icon since lucide-react is not a dependency
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
interface LibraryAsset {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  prompt: string;
  mode: string;
  tool: string;
  createdAt: string;
}

const BLUR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export default function LibraryClient() {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchAssets = useCallback(async (search: string, mode: string, sortBy: string, append = false, afterCursor?: string) => {
    if (!append) setLoading(true);
    const params = new URLSearchParams({ mine: 'true', limit: '48' });
    if (search.trim()) params.set('search', search.trim());
    if (mode !== 'all') params.set('mode', mode);
    if (sortBy === 'oldest') params.set('sort', 'oldest');
    if (afterCursor) params.set('cursor', afterCursor);
    const res = await fetch(`/api/gallery?${params}`);
    if (res.ok) {
      const d = await res.json();
      let fetched: LibraryAsset[] = d.assets ?? [];
      if (sortBy === 'mode') {
        fetched = [...fetched].sort((a, b) => a.mode.localeCompare(b.mode));
      }
      if (append) {
        setAssets(prev => [...prev, ...fetched]);
      } else {
        setAssets(fetched);
      }
      setCursor(d.nextCursor ?? null);
      setHasMore(d.hasMore ?? false);
      setTotal(prev => append ? prev + fetched.length : fetched.length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssets(searchQuery, modeFilter, sort);
  }, [searchQuery, modeFilter, sort, fetchAssets]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(assets.map(a => a.id)));
  }, [assets]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const bulkDelete = useCallback(async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} asset${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    const ids = Array.from(selected);
    await Promise.allSettled(
      ids.map(id => fetch(`/api/gallery?id=${id}`, { method: 'DELETE' }))
    );
    setAssets(prev => prev.filter(a => !selected.has(a.id)));
    setTotal(prev => prev - selected.size);
    setSelected(new Set());
    setDeleting(false);
  }, [selected]);

  const bulkDownload = useCallback(() => {
    const selectedAssets = assets.filter(a => selected.has(a.id));
    for (const asset of selectedAssets) {
      const a = document.createElement('a');
      a.href = asset.imageUrl;
      a.download = `wokgen-${asset.id}.png`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [assets, selected]);

  if (loading && assets.length === 0) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SkeletonGalleryGrid count={12} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Asset Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {total} asset{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/gallery"
          style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          Gallery View
        </Link>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.625rem 1rem', marginBottom: '1rem',
          background: 'var(--accent-subtle)', border: '1px solid var(--accent-glow)',
          borderRadius: '8px', fontSize: '0.875rem',
        }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selected.size} selected</span>
          <button onClick={selectAll} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8125rem', padding: '2px 6px' }}>Select all</button>
          <div style={{ flex: 1 }} />
          <button onClick={bulkDownload} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.375rem 0.875rem', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8125rem' }}>
            Download {selected.size}
          </button>
          <button onClick={bulkDelete} disabled={deleting} style={{ background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', padding: '0.375rem 0.875rem', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8125rem', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? 'Deleting…' : `Delete ${selected.size}`}
          </button>
          <button onClick={clearSelection} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.125rem', padding: '0 4px', lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text)]/30" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by prompt..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded text-sm text-[var(--text)]/80 placeholder:text-[var(--text)]/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <select
          value={modeFilter}
          onChange={e => setModeFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-3 py-2.5 text-sm text-[var(--text)]/60"
        >
          <option value="all">All modes</option>
          <option value="pixel">Pixel</option>
          <option value="vector">Vector</option>
          <option value="uiux">UI/UX</option>
          <option value="business">Business</option>
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-3 py-2.5 text-sm text-[var(--text)]/60"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="mode">By mode</option>
        </select>
      </div>

      {assets.length === 0 && !loading ? (
        /* Designed empty state */
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
          <div style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', borderRadius: '14px', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {searchQuery || modeFilter !== 'all' ? 'No matching assets' : 'Your library is empty'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
            {searchQuery || modeFilter !== 'all'
              ? 'Try a different search or filter.'
              : 'Generated assets will appear here.'}
          </p>
          {!searchQuery && modeFilter === 'all' && (
            <Link href="/studio" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
              Open WokGen Studio
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {assets.map(asset => (
            <div
              key={asset.id}
              className="group relative rounded overflow-hidden border hover:border-white/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: selected.has(asset.id) ? 'var(--accent)' : 'rgba(255,255,255,0.05)' }}
              onClick={() => toggleSelect(asset.id)}
            >
              {/* Checkbox overlay */}
              <div
                style={{
                  position: 'absolute', top: 8, left: 8, zIndex: 10,
                  width: 20, height: 20, borderRadius: 4,
                  background: selected.has(asset.id) ? 'var(--accent)' : 'rgba(0,0,0,0.6)',
                  border: '1.5px solid',
                  borderColor: selected.has(asset.id) ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: selected.has(asset.id) ? 1 : 0,
                  transition: 'opacity 0.1s',
                }}
                className="group-hover:!opacity-100"
              >
                {selected.has(asset.id) && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
              <div style={{ aspectRatio: '1', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', position: 'relative' }}>
                {(asset.thumbUrl ?? asset.imageUrl) && (
                  <Image
                    src={asset.thumbUrl ?? asset.imageUrl}
                    alt={asset.prompt?.slice(0, 60) || 'Asset'}
                    fill
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                  <p className="text-xs text-[var(--text)] line-clamp-3">{asset.prompt}</p>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={asset.imageUrl}
                      download
                      className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[var(--text)]"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      Save
                    </a>
                    <Link
                      href={`/studio?prompt=${encodeURIComponent(asset.prompt)}&mode=${asset.mode}`}
                      className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[var(--text)]"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      Reuse
                    </Link>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0.75rem' }}>
                {asset.prompt && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {asset.prompt}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{asset.mode || 'pixel'}</span>
                  {asset.imageUrl && (
                    <a href={asset.imageUrl} download target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>Download</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <button
            onClick={() => fetchAssets(searchQuery, modeFilter, sort, true, cursor ?? undefined)}
            disabled={loading}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 24px', borderRadius: 8, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Loading…' : `Load more`}
          </button>
        </div>
      )}
    </div>
  );
}
