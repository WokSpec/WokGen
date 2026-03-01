export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import GalleryClient from './_client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Community Gallery — WokGen',
  description: 'Explore all AI-generated assets across every WokGen studio: pixel art, vectors, UI mockups, voice, business assets, and more.',
  openGraph: {
    title: 'Community Gallery — WokGen',
    description: 'Explore generations from all studios.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
};

export default function GalleryPage() {
  return (
    <div className="gallery-page-root">
      <div className="gallery-page-inner">
        <header className="gallery-page-header">
          <h1 className="gallery-page-title">Community Gallery</h1>
          <p className="gallery-page-subtitle">Explore generations from all studios</p>
        </header>
        <ErrorBoundary context="Gallery">
          <GalleryClient />
        </ErrorBoundary>
      </div>

      <style>{`
        .gallery-page-root {
          min-height: 80vh;
          padding: 40px 24px 64px;
        }
        .gallery-page-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .gallery-page-header {
          margin-bottom: 32px;
        }
        .gallery-page-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
          margin: 0 0 6px;
        }
        .gallery-page-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
