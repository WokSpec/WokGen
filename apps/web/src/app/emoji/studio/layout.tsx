import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emoji Studio — WokGen',
  description: 'Generate custom emoji and icon sets with AI.',
  openGraph: {
    title: 'Emoji Studio — WokGen',
    description: 'Generate custom emoji and icon sets with AI.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emoji Studio — WokGen',
    description: 'Generate custom emoji and icon sets with AI.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
