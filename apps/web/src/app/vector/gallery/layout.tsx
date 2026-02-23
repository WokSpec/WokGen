import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vector Gallery — WokGen',
  description: 'Browse AI-generated vector and SVG assets.',
  openGraph: {
    title: 'Vector Gallery — WokGen',
    description: 'Browse AI-generated vector and SVG assets.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vector Gallery — WokGen',
    description: 'Browse AI-generated vector and SVG assets.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
