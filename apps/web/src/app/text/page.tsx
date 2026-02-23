import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Generation — WokGen',
  description: 'AI-powered copy and brand messaging generator.',
  openGraph: {
    title: 'Text Generation — WokGen',
    description: 'AI-powered copy and brand messaging generator.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text Generation — WokGen',
    description: 'AI-powered copy and brand messaging generator.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

import { redirect } from 'next/navigation';

export default function TextPage() {
  redirect('/text/studio');
}
