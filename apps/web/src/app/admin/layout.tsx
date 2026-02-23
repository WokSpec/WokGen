import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — WokGen',
  description: 'WokGen admin dashboard.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Admin — WokGen',
    description: 'WokGen admin dashboard.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin — WokGen',
    description: 'WokGen admin dashboard.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
