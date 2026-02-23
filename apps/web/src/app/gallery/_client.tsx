'use client';

import { useEffect, useState, useCallback } from 'react';
import { EmptyState } from '@/app/_components/EmptyState';

interface GalleryAsset {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  prompt: string;
  tool: string;
  createdAt: string;
}

export default function GalleryClient() {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/gallery?mine=true&limit=24');
    if (res.ok) {
      const d = await res.json();
      setAssets(d.assets ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {assets.map(a => (
            <div key={a.id} style={{ background: '#1a1a2e', borderRadius: 8, overflow: 'hidden' }}>
              <img src={a.thumbUrl ?? a.imageUrl} alt={a.prompt.slice(0, 60)} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
