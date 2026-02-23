import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Studio — WokGen',
  description: 'Generate compelling copy, taglines, and brand messaging with AI.',
  openGraph: {
    title: 'Text Studio — WokGen',
    description: 'Generate compelling copy, taglines, and brand messaging with AI.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text Studio — WokGen',
    description: 'Generate compelling copy, taglines, and brand messaging with AI.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
