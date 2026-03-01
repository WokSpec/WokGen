'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PRODUCT_LINKS = [
  { label: 'Pixel Studio',  href: '/pixel/studio',    ext: false },
  { label: 'Vector Studio', href: '/vector/studio',   ext: false },
  { label: 'Tools',         href: '/tools',            ext: false },
  { label: 'Community',     href: '/community',        ext: false },
  { label: 'Open Source',   href: '/open-source',      ext: false },
];

const RESOURCES_LINKS = [
  { label: 'Docs',      href: '/docs',                             ext: false },
  { label: 'Changelog', href: '/changelog',                        ext: false },
  { label: 'GitHub',    href: 'https://github.com/WokSpec/WokGen', ext: true  },
  { label: 'Status',    href: '/status',                           ext: false },
];

const SUPPORT_LINKS = [
  { label: 'Donate',      href: '/support',                    ext: false },
  { label: 'Discord',     href: 'https://discord.gg/wokgen',   ext: true  },
  { label: 'Twitter / X', href: 'https://twitter.com/WokSpec', ext: true  },
  { label: 'WokSpec',     href: 'https://wokspec.org',          ext: true  },
];

const MODEL_CHIPS = ['FLUX', 'Stable Diffusion', 'Llama 3.3', 'Kokoro'];

const linkCls = 'text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors';

function FooterLink({ href, label, ext }: { href: string; label: string; ext?: boolean }) {
  return ext ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>{label}</a>
  ) : (
    <Link href={href} className={linkCls}>{label}</Link>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (
    pathname?.startsWith('/studio') ||
    pathname?.startsWith('/pixel/studio') ||
    pathname?.startsWith('/vector/studio') ||
    pathname?.startsWith('/business/studio') ||
    pathname?.startsWith('/uiux/studio') ||
    pathname?.startsWith('/voice/studio') ||
    pathname?.startsWith('/code/studio') ||
    pathname?.startsWith('/text/studio') ||
    pathname?.startsWith('/eral') ||
    pathname?.startsWith('/tools/')
  ) return null;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Column links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">Product</p>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map(l => (
                <li key={l.label}><FooterLink href={l.href} label={l.label} ext={l.ext} /></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">Resources</p>
            <ul className="space-y-2">
              {RESOURCES_LINKS.map(l => (
                <li key={l.label}><FooterLink href={l.href} label={l.label} ext={l.ext} /></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">Support</p>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map(l => (
                <li key={l.label}><FooterLink href={l.href} label={l.label} ext={l.ext} /></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-faint)]">
            © {new Date().getFullYear()} <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-muted)] transition-colors">WokSpec</a> · WokGen
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-[var(--text-faint)] mr-1">Powered by open source</span>
            {MODEL_CHIPS.map(m => (
              <span
                key={m}
                className="text-xs text-[var(--text-faint)] bg-[var(--surface-raised)] px-2 py-0.5 rounded border border-[var(--border)]"
              >
                {m}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/WokSpec/WokGen"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Star on GitHub
          </a>
        </div>

      </div>
    </footer>
  );
}

