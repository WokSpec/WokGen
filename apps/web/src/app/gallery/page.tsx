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
    </div>
  );
}
