import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UI/UX Gallery — WokGen',
  description: 'Browse AI-generated UI components and design assets.',
  openGraph: {
    title: 'UI/UX Gallery — WokGen',
    description: 'Browse AI-generated UI components and design assets.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI/UX Gallery — WokGen',
    description: 'Browse AI-generated UI components and design assets.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
