import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pixel Gallery — WokGen',
  description: 'Browse AI-generated pixel art assets.',
  openGraph: {
    title: 'Pixel Gallery — WokGen',
    description: 'Browse AI-generated pixel art assets.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixel Gallery — WokGen',
    description: 'Browse AI-generated pixel art assets.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
