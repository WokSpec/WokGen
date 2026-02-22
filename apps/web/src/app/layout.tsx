import type { Metadata, Viewport } from 'next';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { NavLink } from './_components/NavLink';
import { Footer } from './_components/Footer';
import { NavAuth } from './_components/NavAuth';
import { Providers } from './_components/Providers';

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
    default: 'WokGen — AI Pixel Art Studio',
    template: '%s · WokGen',
  },
  description:
    'Generate sprites, animations, tilesets, and game assets with AI. ' +
    'Works with Replicate, fal.ai, Together.ai, or your local ComfyUI. Free to self-host.',
  keywords: [
    'pixel art generator',
    'AI game assets',
    'sprite generator',
    'tileset generator',
    'RPG icons',
    'pixel art AI',
    'ComfyUI',
    'FLUX pixel art',
  ],
  authors: [{ name: 'Wok Specialists', url: 'https://github.com/WokSpecialists' }],
  creator: 'Wok Specialists',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'WokGen — AI Pixel Art Studio',
    description: 'Generate game assets, sprites and tilesets with AI.',
    siteName: 'WokGen',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WokGen — AI Pixel Art Studio',
    description: 'Generate game assets, sprites and tilesets with AI.',
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
// Nav bar (Server Component — no client state needed)
// ---------------------------------------------------------------------------
function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {/* WokSpec backlink */}
      <a
        href="https://wokspec.org"
        className="hidden sm:inline-flex items-center gap-1 nav-backlink"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        wokspec.org
      </a>

      {/* Wordmark — text only, no icon */}
      <Link href="/" className="nav-wordmark mr-4 flex-shrink-0" aria-label="WokGen home">
        <span style={{ color: 'var(--text-muted)' }}>Wok</span>
        <span style={{ color: '#a78bfa' }}>Gen</span>
        <span className="badge-preview ml-2">Preview</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        <NavLink href="/studio">Studio</NavLink>
        <NavLink href="/gallery">Gallery</NavLink>
        <NavLink href="/docs">Docs</NavLink>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        <a
          href="https://github.com/WokSpec/WokGen"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost btn-icon hidden sm:flex"
          aria-label="View WokGen on GitHub"
          title="GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <NavAuth />
      </div>
    </nav>
  );
}

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Favicon: purple square wordmark */}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230d0d0d'/><text x='4' y='23' font-family='system-ui' font-size='18' font-weight='700' fill='%23a78bfa'>W</text></svg>"
          type="image/svg+xml"
        />
      </head>
      <body className={dmSans.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Providers>
          <NavBar />
          <main id="main-content" style={{ flex: 1 }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
