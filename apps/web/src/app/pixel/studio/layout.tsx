import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pixel Mode — WokGen Studio',
  description: 'Generate pixel art sprites, icons, and game assets with AI.',
  openGraph: {
    title: 'Pixel Mode — WokGen Studio',
    description: 'Generate pixel art sprites, icons, and game assets with AI.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixel Mode — WokGen Studio',
    description: 'Generate pixel art sprites, icons, and game assets with AI.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div data-mode="pixel">{children}</div>;
}
