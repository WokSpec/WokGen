import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — WokGen',
  description: 'Sign in to WokGen.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Sign In — WokGen',
    description: 'Sign in to WokGen.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In — WokGen',
    description: 'Sign in to WokGen.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
