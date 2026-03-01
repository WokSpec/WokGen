import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voice Mode — WokGen Studio',
  description: 'Generate natural-sounding AI voiceovers for any content.',
  openGraph: {
    title: 'Voice Mode — WokGen Studio',
    description: 'Generate natural-sounding AI voiceovers for any content.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voice Mode — WokGen Studio',
    description: 'Generate natural-sounding AI voiceovers for any content.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div data-mode="voice">{children}</div>;
}
