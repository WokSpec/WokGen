import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emoji Gallery — WokGen',
  description: 'Browse AI-generated emoji and icon assets.',
  openGraph: {
    title: 'Emoji Gallery — WokGen',
    description: 'Browse AI-generated emoji and icon assets.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emoji Gallery — WokGen',
    description: 'Browse AI-generated emoji and icon assets.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
