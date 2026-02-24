import type { Metadata } from 'next';

// Per-tool metadata — each tool page exports its own title via ToolShell's head,
// the layout provides the template and shared OG defaults.
export const metadata: Metadata = {
  title: { template: '%s — Tools · WokGen', default: 'Free Creator Tools — WokGen' },
  description:
    'Browser-native tools for creators, developers, and game devs. Background remover, image converter, CSS generator, JSON toolkit, PDF tools, and 30+ more. All free, all private — processing happens in your browser.',
  openGraph: {
    type: 'website',
    siteName: 'WokGen',
    images: [{ url: '/og-tools.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@WokSpec',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
