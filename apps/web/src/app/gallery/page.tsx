import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery — WokGen',
  description: 'Browse all AI-generated assets on WokGen.',
  openGraph: {
    title: 'Gallery — WokGen',
    description: 'Browse all AI-generated assets on WokGen.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gallery — WokGen',
    description: 'Browse all AI-generated assets on WokGen.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

import GalleryClient from './_client';
export default function GalleryPage() { return <GalleryClient />; }
