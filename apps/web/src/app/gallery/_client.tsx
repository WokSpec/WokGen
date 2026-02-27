'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { EmptyState } from '@/app/_components/EmptyState';
import { Search } from 'lucide-react';

interface GalleryAsset {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  prompt: string;
  mode: string;
  tool: string;
  createdAt: string;
  rarity?: string;
}

const PAGE_SIZE = 24;
const BLUR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// simple debounce for search input
function useDebounced(value: string, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function GalleryClient() {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounced(searchQuery, 350);
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<GalleryAsset | null>(null);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  const fetchAssets = useCallback(async (opts: { cursor?: string; search: string; mode: string; reset: boolean }) => {
    setLoading(true);
    const params = new URLSearchParams({ mine: 'true', limit: String(PAGE_SIZE) });
    if (opts.cursor) params.set('cursor', opts.cursor);
    if (opts.search.trim()) params.set('search', opts.search.trim());
    if (opts.mode !== 'all') params.set('mode', opts.mode);
    // support new search endpoint if used
    const endpoint = opts.search.trim() ? `/api/gallery/search?${params}` : `/api/gallery?${params}`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const d = await res.json();
      const newAssets: GalleryAsset[] = d.assets ?? [];
      setAssets(prev => opts.reset ? newAssets : [...prev, ...newAssets]);
      setCursor(d.nextCursor ?? null);
      setHasMore(d.hasMore ?? false);
    }
    setLoading(false);
  }, []);

  // Reset and fetch on filter change
  useEffect(() => {
    setCursor(null);
    fetchAssets({ search: debouncedQuery, mode: modeFilter, reset: true });
  }, [debouncedQuery, modeFilter, fetchAssets]);

  // Load more when sentinel is visible
  useEffect(() => {
    if (inView && hasMore && !loading && cursor) {
      fetchAssets({ cursor, search: searchQuery, mode: modeFilter, reset: false });
    }
  }, [inView, hasMore, loading, cursor, searchQuery, modeFilter, fetchAssets]);

  if (loading && assets.length === 0) {
    return <div className="gallery-page"><p style={{ color: 'var(--text-muted, #6b7280)', padding: '2rem' }}>Loading…</p></div>;
  }

  return (
    <div className="gallery-page">
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', color: 'var(--text)' }}>My Gallery</h1>

      {/* Filter + search bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text)]/30" />
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
      </div>

      {assets.length === 0 && !loading ? (
        <EmptyState
          title="No assets yet"
          description="Generated assets you make public will appear here."
          action={{ label: 'Start generating', href: '/studio' }}
        />
      ) : (
        <>
          {/* Masonry responsive grid */}
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
            {assets.map(a => (
              <div
                key={a.id}
                onClick={() => setSelectedAsset(a)}
                className="break-inside-avoid group relative cursor-pointer rounded overflow-hidden border border-white/5 hover:border-white/20 transition-all"
              >
                <Image
                  src={a.thumbUrl ?? a.imageUrl}
                  alt={a.prompt.slice(0, 60)}
                  width={300}
                  height={300}
                  className="w-full"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs text-[var(--text)] line-clamp-2">{a.prompt}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[var(--text)]/40">{a.mode}</span>
                      <button type="button" className="text-xs text-[var(--text)]/60 hover:text-[var(--text)]">View</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} style={{ height: 40, marginTop: 20 }} />
          {loading && <p style={{ color: 'var(--text-muted, #6b7280)', padding: '1rem', textAlign: 'center' }}>Loading more…</p>}
        </>
      )}

      {/* Lightbox */}
      {selectedAsset && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="max-w-2xl w-full rounded overflow-hidden border border-white/10"
              style={{ background: 'var(--bg-elevated)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-square">
              <Image
                src={selectedAsset.imageUrl}
                alt={selectedAsset.prompt || ''}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-4">
              <p className="text-sm text-[var(--text)]/80 mb-3">{selectedAsset.prompt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text)]/30">
                  {selectedAsset.mode} • {new Date(selectedAsset.createdAt).toLocaleDateString()}
                </span>
                <a
                  href={selectedAsset.imageUrl}
                  download
                  className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-white/90"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
