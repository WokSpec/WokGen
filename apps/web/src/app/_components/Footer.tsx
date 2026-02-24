'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PRODUCT_LINKS = [
  { label: 'Studios',      href: '/pixel/studio' },
  { label: 'Free Tools',   href: '/tools'        },
  { label: 'Community',    href: '/community'    },
  { label: 'Eral',         href: '/eral'         },
  { label: 'Open Source',  href: '/open-source', ext: false },
];

const RESOURCES_LINKS = [
  { label: 'Docs',       href: '/docs',                                  ext: false },
  { label: 'Changelog',  href: '/changelog',                             ext: false },
  { label: 'GitHub',     href: 'https://github.com/WokSpec/WokGen',      ext: true  },
  { label: 'Status',     href: '/status',                                ext: false },
];

const SUPPORT_LINKS = [
  { label: 'Donate',     href: '/support',                               ext: false },
  { label: 'Discord',    href: '#',                                      ext: false },
  { label: 'Twitter / X', href: '#',                                     ext: false },
];

const MODEL_CHIPS = ['FLUX', 'Stable Diffusion', 'Llama 3.3', 'Kokoro'];

export function Footer() {
  const pathname = usePathname();
  if (pathname.endsWith('/studio')) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__cols site-footer__cols--3">

          {/* Product */}
          <div>
            <p className="site-footer__col-title">Product</p>
            <ul className="site-footer__col-links">
              {PRODUCT_LINKS.map(l => (
                <li key={l.label}>
                  {l.ext
                    ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="site-footer__link">{l.label}</a>
                    : <Link href={l.href} className="site-footer__link">{l.label}</Link>}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="site-footer__col-title">Resources</p>
            <ul className="site-footer__col-links">
              {RESOURCES_LINKS.map(l => (
                <li key={l.label}>
                  {l.ext
                    ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="site-footer__link">{l.label}</a>
                    : <Link href={l.href} className="site-footer__link">{l.label}</Link>}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="site-footer__col-title">Support</p>
            <ul className="site-footer__col-links">
              {SUPPORT_LINKS.map(l => (
                <li key={l.label}>
                  {l.ext
                    ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="site-footer__link">{l.label}</a>
                    : <Link href={l.href} className="site-footer__link">{l.label}</Link>}
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="site-footer__bottom">
          {/* Left */}
          <p className="site-footer__copy">
            © 2025 WokGen — Free forever
          </p>

          {/* Center — powered by open source + model chips */}
          <div className="site-footer__powered">
            <span className="site-footer__powered-label">Powered by open source</span>
            <div className="site-footer__model-chips">
              {MODEL_CHIPS.map(m => (
                <span key={m} className="site-footer__model-chip">{m}</span>
              ))}
            </div>
          </div>

          {/* Right — GitHub stars */}
          <a
            href="https://github.com/WokSpec/WokGen"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__gh-stars"
          >
            ⭐ Star on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

