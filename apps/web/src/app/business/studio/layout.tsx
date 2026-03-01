import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Mode — WokGen Studio',
  description: 'Generate logos, brand assets, and business graphics with AI.',
  openGraph: {
    title: 'Business Mode — WokGen Studio',
    description: 'Generate logos, brand assets, and business graphics with AI.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Mode — WokGen Studio',
    description: 'Generate logos, brand assets, and business graphics with AI.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div data-mode="business">{children}</div>;
}
