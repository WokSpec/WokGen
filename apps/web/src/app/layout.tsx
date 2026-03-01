import type { Metadata, Viewport } from 'next';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import nextDynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { TopBar } from './_components/TopBar';
import { Sidebar } from './_components/Sidebar';
import { Footer } from './_components/Footer';
import { Providers } from './_components/Providers';
import { Toaster } from 'sonner';
import { PageLoadingBar } from '@/components/PageLoadingBar';
import { ERAL_ENABLED } from '@/lib/eral-integration';

// Eral is a standalone product — only mount the companion widget when enabled.
// Set NEXT_PUBLIC_ERAL_ENABLED=true in .env.local to activate.
const EralCompanion = ERAL_ENABLED
  ? nextDynamic(
      () => import('@/components/EralCompanion').then((m) => ({ default: m.EralCompanion })),
      { ssr: false },
    )
  : null;

const CommandPalette = nextDynamic(
  () => import('./_components/CommandPalette'),
  { ssr: false },
);

const KeyboardShortcuts = nextDynamic(
  () => import('./_components/KeyboardShortcuts'),
  { ssr: false },
);

const OnboardingGate = nextDynamic(
  () => import('./_components/OnboardingGate'),
  { ssr: false },
);

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    template: '%s — WokGen',
    default: 'WokGen — AI Asset Generation',
  },
  description: 'Generate pixel art, vectors, UI mockups, brand assets, voice, 3D models and more with AI.',
  metadataBase: new URL('https://wokgen.wokspec.org'),
  keywords: [
    'AI asset generator',
    'pixel art generator',
    'AI logo generator',
    'brand kit AI',
    'game asset generator',
    'sprite generator',
    'AI image generation',
    'WokGen',
    'WokSpec',
  ],
  authors: [{ name: 'Wok Specialists', url: 'https://wokspec.org' }],
  creator: 'Wok Specialists',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org',
    title: 'WokGen — AI Asset Generation Platform',
    description: 'Generate game assets, brand kits, icons, and UI components with AI.',
    siteName: 'WokGen',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'WokGen — AI Asset Generation Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WokGen — AI Asset Generation Platform',
    description: 'Generate game assets, brand kits, icons, and UI components with AI.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`} data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var p=window.location.pathname;var pub=['/','/login','/pricing','/changelog','/open-source','/status','/tools','/community','/docs'];var isPublic=p==='/'||pub.some(function(r){return p===r||p.startsWith(r+'/');});if(!isPublic){var t=localStorage.getItem('wokgen-theme');if(t){var resolved=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',resolved);}}}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={dmSans.className}>
        <PageLoadingBar />
        <Providers>
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          <div className="app-shell">
            <Sidebar />
            <div className="app-shell__body">
              <TopBar />
              <main id="main-content" style={{ flex: 1 }}>{children}</main>
              <Footer />
            </div>
          </div>
          {EralCompanion && <EralCompanion />}
          <CommandPalette />
          <KeyboardShortcuts />
          <OnboardingGate />
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
