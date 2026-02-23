import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Gallery — WokGen',
  description: 'Explore AI-generated assets from the WokGen community. Pixel art, logos, UI components, and more.',
  openGraph: {
    title: 'Community Gallery — WokGen',
    description: 'Explore AI-generated assets from the WokGen community. Pixel art, logos, UI components, and more.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community Gallery — WokGen',
    description: 'Explore AI-generated assets from the WokGen community. Pixel art, logos, UI components, and more.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
