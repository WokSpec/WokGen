import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UI/UX Studio — WokGen',
  description: 'Generate UI components, wireframes, and design system assets with AI.',
  openGraph: {
    title: 'UI/UX Studio — WokGen',
    description: 'Generate UI components, wireframes, and design system assets with AI.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI/UX Studio — WokGen',
    description: 'Generate UI components, wireframes, and design system assets with AI.',
    images: ['https://wokgen.wokspec.org/og.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
