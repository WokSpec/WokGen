import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio — WokGen',
  description: 'Create AI-generated assets across every format.',
  openGraph: {
    title: 'Studio — WokGen',
    description: 'Create AI-generated assets across every format.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studio — WokGen',
    description: 'Create AI-generated assets across every format.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

import { redirect } from 'next/navigation';
export default function StudioRedirect() { redirect('/pixel/studio'); }
