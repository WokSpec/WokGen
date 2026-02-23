import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voice Generation — WokGen',
  description: 'AI-powered text-to-speech and voice generation.',
  openGraph: {
    title: 'Voice Generation — WokGen',
    description: 'AI-powered text-to-speech and voice generation.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voice Generation — WokGen',
    description: 'AI-powered text-to-speech and voice generation.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

import { redirect } from 'next/navigation';

export default function VoicePage() {
  redirect('/voice/studio');
}
