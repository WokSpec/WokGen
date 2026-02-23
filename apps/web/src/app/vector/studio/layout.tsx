import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vector Studio — WokGen',
  description: 'Generate scalable vector graphics and SVG assets with AI.',
  openGraph: {
    title: 'Vector Studio — WokGen',
    description: 'Generate scalable vector graphics and SVG assets with AI.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vector Studio — WokGen',
    description: 'Generate scalable vector graphics and SVG assets with AI.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
