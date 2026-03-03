'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PixelClient = dynamic(() => import('@/app/pixel/studio/_client'), { ssr: false });

export default function UnifiedStudioClient() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 20, height: 20, border: '2px solid #333', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PixelClient />
    </Suspense>
  );
}

