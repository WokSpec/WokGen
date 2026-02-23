import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UI/UX Generation — WokGen',
  description: 'AI-powered UI component and design system generator.',
  openGraph: {
    title: 'UI/UX Generation — WokGen',
    description: 'AI-powered UI component and design system generator.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI/UX Generation — WokGen',
    description: 'AI-powered UI component and design system generator.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

import { redirect } from 'next/navigation';

export default function UIUXPage() {
  redirect('/uiux/studio');
}
