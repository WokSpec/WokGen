import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { NavLink } from './_components/NavLink';

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
  themeColor: '#0d0d14',
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
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 mr-4 flex-shrink-0"
        aria-label="WokGen home"
      >
        {/* Pixel-art wok icon — SVG inline so no extra fetch */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          {/* Wok body */}
          <rect x="4"  y="14" width="20" height="10" rx="2" fill="#41A6F6" />
          <rect x="6"  y="16" width="16" height="6"  rx="1" fill="#1e2d52" />
          {/* Steam pixels */}
          <rect x="9"  y="8"  width="2"  height="4"  rx="1" fill="#73EFF7" opacity="0.7" />
          <rect x="13" y="6"  width="2"  height="6"  rx="1" fill="#73EFF7" opacity="0.7" />
          <rect x="17" y="8"  width="2"  height="4"  rx="1" fill="#73EFF7" opacity="0.7" />
          {/* Handle */}
          <rect x="22" y="17" width="4"  height="3"  rx="1" fill="#566C86" />
          {/* Pixel accents */}
          <rect x="8"  y="17" width="2"  height="2"  fill="#41A6F6" opacity="0.5" />
          <rect x="11" y="19" width="2"  height="2"  fill="#41A6F6" opacity="0.4" />
          <rect x="15" y="17" width="2"  height="2"  fill="#73EFF7" opacity="0.4" />
        </svg>
        <span
          className="text-base font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          WokGen
        </span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded"
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-muted)',
          }}
        >
          v0.1
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-5 flex-1">
        <NavLink href="/studio">Studio</NavLink>
        <NavLink href="/gallery">Gallery</NavLink>
        <NavLink href="/docs">Docs</NavLink>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Pipeline badge */}
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{
            background: 'var(--surface-overlay)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-muted)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--success)' }}
            aria-hidden="true"
          />
          Self-hosted
        </span>

        {/* GitHub link */}
        <a
          href="https://github.com/WokSpecialists/WokGen"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost btn-icon"
          aria-label="View WokGen on GitHub"
          title="View on GitHub"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </a>

        {/* CTA */}
        <Link href="/studio" className="btn-primary btn-sm hidden sm:inline-flex">
          Open Studio
        </Link>
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
    <html lang="en" className={inter.variable} data-theme="dark">
      <head>
        {/* Preconnect to font CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JetBrains Mono for code blocks */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Favicon — inline SVG data URI */}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230d0d14'/><rect x='4' y='16' width='24' height='12' rx='2' fill='%2341A6F6'/><rect x='6' y='18' width='20' height='8' rx='1' fill='%231e2d52'/><rect x='26' y='19' width='4' height='4' rx='1' fill='%23566C86'/><rect x='10' y='8' width='3' height='6' rx='1' fill='%2373EFF7' opacity='0.7'/><rect x='15' y='5' width='3' height='9' rx='1' fill='%2373EFF7' opacity='0.7'/><rect x='20' y='8' width='3' height='6' rx='1' fill='%2373EFF7' opacity='0.7'/></svg>"
          type="image/svg+xml"
        />
      </head>
      <body className={inter.className}>
        <NavBar />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
