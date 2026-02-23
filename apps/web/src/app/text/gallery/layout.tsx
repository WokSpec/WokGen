import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Gallery — WokGen',
  description: 'Browse AI-generated copy and text assets.',
  openGraph: {
    title: 'Text Gallery — WokGen',
    description: 'Browse AI-generated copy and text assets.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text Gallery — WokGen',
    description: 'Browse AI-generated copy and text assets.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
