import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Gallery — WokGen',
  description: 'Browse AI-generated business and brand assets.',
  openGraph: {
    title: 'Business Gallery — WokGen',
    description: 'Browse AI-generated business and brand assets.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Gallery — WokGen',
    description: 'Browse AI-generated business and brand assets.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
