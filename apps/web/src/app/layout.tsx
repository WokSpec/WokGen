import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WokGen — AI Pixel Art Generator",
  description: "Open-source AI platform for generating pixel art sprites, animations, tilesets and more. Self-host with Replicate, Fal.ai, Together.ai or local ComfyUI.",
  openGraph: {
    title: "WokGen — AI Pixel Art Generator",
    description: "Generate pixel art sprites, animations, and game assets with AI. Free to self-host.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-slate-950 text-white`}
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <a href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm font-mono">W</span>
                </div>
                <span className="font-bold text-xl text-white tracking-tight">
                  WokGen
                </span>
              </a>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <a href="/studio" className="text-slate-400 hover:text-white font-medium transition-colors text-sm">
                  Studio
                </a>
                <a href="/gallery" className="text-slate-400 hover:text-white font-medium transition-colors text-sm">
                  Gallery
                </a>
                <a href="/docs" className="text-slate-400 hover:text-white font-medium transition-colors text-sm">
                  Docs
                </a>
                <a href="https://github.com/WokSpecialists/WokGen" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white font-medium transition-colors text-sm">
                  GitHub
                </a>
              </div>

              {/* CTA */}
              <div className="hidden md:flex items-center gap-3">
                <a
                  href="/auth/signin"
                  className="text-slate-400 hover:text-white font-medium text-sm transition-colors"
                >
                  Sign in
                </a>
                <a
                  href="/studio"
                  className="inline-flex items-center px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors text-sm"
                >
                  Open Studio
                </a>
              </div>

              {/* Mobile menu button */}
              <button className="md:hidden p-2 text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm font-mono">W</span>
                  </div>
                  <span className="font-bold text-xl text-white">WokGen</span>
                </div>
                <p className="text-slate-400 mb-4 max-w-sm text-sm">
                  Open-source AI pixel art generation platform. Generate sprites, animations,
                  tilesets and more. Self-host with any AI provider.
                </p>
                <p className="text-slate-500 text-xs">
                  Licensed under MIT + Commons Clause
                </p>
              </div>

              {/* Tools */}
              <div>
                <h3 className="font-semibold text-white mb-4 text-sm">Tools</h3>
                <ul className="space-y-2">
                  <li><a href="/studio?tool=generate" className="text-slate-400 hover:text-white transition-colors text-sm">Generate</a></li>
                  <li><a href="/studio?tool=animate" className="text-slate-400 hover:text-white transition-colors text-sm">Animate</a></li>
                  <li><a href="/studio?tool=rotate" className="text-slate-400 hover:text-white transition-colors text-sm">Rotate</a></li>
                  <li><a href="/studio?tool=inpaint" className="text-slate-400 hover:text-white transition-colors text-sm">Inpaint</a></li>
                  <li><a href="/studio?tool=scene" className="text-slate-400 hover:text-white transition-colors text-sm">Scenes &amp; Maps</a></li>
                </ul>
              </div>

              {/* Links */}
              <div>
                <h3 className="font-semibold text-white mb-4 text-sm">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="/docs" className="text-slate-400 hover:text-white transition-colors text-sm">Documentation</a></li>
                  <li><a href="/docs/api" className="text-slate-400 hover:text-white transition-colors text-sm">API Reference</a></li>
                  <li><a href="/docs/self-hosting" className="text-slate-400 hover:text-white transition-colors text-sm">Self-Hosting</a></li>
                  <li><a href="https://github.com/WokSpecialists/WokGen" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm">GitHub</a></li>
                  <li><a href="https://github.com/WokSpecialists/WokGen/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm">License</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-500 text-xs">
                © 2026 Wok Specialists / WokGen Contributors
              </p>
              <p className="text-slate-500 text-xs mt-2 md:mt-0">
                Built with Next.js · Powered by Replicate, Fal.ai, Together.ai, ComfyUI
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
