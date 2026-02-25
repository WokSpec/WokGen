'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { EmptyState } from '@/app/_components/EmptyState';

interface GalleryAsset {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  prompt: string;
  tool: string;
  createdAt: string;
}

const PAGE_SIZE = 24;

export default function GalleryClient() {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    const res = await fetch(`/api/gallery?mine=true&limit=${PAGE_SIZE}&offset=${(pageNum - 1) * PAGE_SIZE}`);
    if (res.ok) {
      const d = await res.json();
      const newAssets: GalleryAsset[] = d.assets ?? [];
      setAssets(prev => pageNum === 1 ? newAssets : [...prev, ...newAssets]);
      setHasMore(newAssets.length >= PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => { fetchPage(1); }, [fetchPage]);

  // Load next page when page state increments
  useEffect(() => {
    if (page === 1) return;
    fetchPage(page);
  }, [page, fetchPage]);

  // Trigger load more when sentinel is visible
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [inView, hasMore, loading]);

  if (loading && assets.length === 0) {
    return <div className="gallery-page"><p style={{ color: 'var(--text-muted, #6b7280)', padding: '2rem' }}>Loading…</p></div>;
  }

  return (
    <div className="gallery-page">
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', color: '#e2e8f0' }}>My Gallery</h1>

      {assets.length === 0 ? (
        <EmptyState
          title="No assets yet"
          description="Generated assets you make public will appear here."
          action={{ label: 'Start generating', href: '/pixel/studio' }}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {assets.map(a => (
              <div key={a.id} style={{ background: '#1a1a2e', borderRadius: 8, overflow: 'hidden', position: 'relative', aspectRatio: '1' }}>
                <Image src={a.thumbUrl ?? a.imageUrl} alt={a.prompt.slice(0, 60)} fill className="object-cover" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 160px" />
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="gallery-sentinel" style={{ height: 40, marginTop: 20 }} />
          {loading && <p style={{ color: 'var(--text-muted, #6b7280)', padding: '1rem', textAlign: 'center' }}>Loading more…</p>}
        </>
      )}
    </div>
  );
}
