'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PRODUCT_LINKS = [
  { label: 'Pixel Studio',      href: '/pixel/studio'    },
  { label: 'Business Studio',   href: '/business/studio' },
  { label: 'Vector Studio',     href: '/vector/studio'   },
  { label: 'UI/UX Studio',      href: '/uiux/studio'     },
  { label: 'Voice Studio',      href: '/voice/studio'    },
  { label: 'SFX Studio',        href: '/sfx/studio'      },
  { label: 'Text Studio',       href: '/text/studio'     },
  { label: 'Emoji Studio',      href: '/emoji/studio'    },
];

const PLATFORM_LINKS = [
  { label: 'Eral AI',           href: '/eral'            },
  { label: 'Eral Director',     href: '/eral/director'   },
  { label: 'Brand Kits',        href: '/brand'           },
  { label: 'Projects',          href: '/projects'        },
  { label: 'Community',         href: '/community'       },
  { label: 'Usage & Limits',    href: '/account/usage'   },
  { label: 'Pricing',           href: '/pricing'         },
  { label: 'Billing',           href: '/billing'         },
];

const COMPANY_LINKS = [
  { label: 'Docs',              href: '/docs',                                  ext: false },
  { label: 'GitHub',            href: 'https://github.com/WokSpec/WokGen',      ext: true  },
  { label: 'WokSpec',           href: 'https://wokspec.org',                   ext: true  },
  { label: 'Terms',             href: '/terms',                                 ext: false },
  { label: 'Privacy',           href: '/privacy',                               ext: false },
  { label: 'Security',          href: '/security',                              ext: false },
];

export function Footer() {
  const pathname = usePathname();
  // Studios get a minimal footer strip, not the full footer
  if (pathname.endsWith('/studio')) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__cols">

          {/* Brand */}
          <div className="site-footer__brand">
            <Link href="/" className="site-footer__wordmark">
              <span>Wok</span><span>Gen</span>
            </Link>
            <p className="site-footer__brand-sub">
              Open-source multi-engine AI asset generator.
              Free to use, free to fork.{' '}
              <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer">
                MIT license.
              </a>
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="site-footer__col-title">Studios</p>
            <ul className="site-footer__col-links">
              {PRODUCT_LINKS.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="site-footer__link">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <p className="site-footer__col-title">Platform</p>
            <ul className="site-footer__col-links">
              {PLATFORM_LINKS.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="site-footer__link">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="site-footer__col-title">WokSpec</p>
            <ul className="site-footer__col-links">
              {COMPANY_LINKS.map(l => (
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
          <p className="site-footer__copy">
            © {new Date().getFullYear()} Wok Specialists LLC.{' '}
            Released under the <a href="/license">MIT license</a>.
          </p>
          <div className="site-footer__tech-tags">
            <span className="site-footer__tech-tag">Next.js</span>
            <span className="site-footer__tech-tag">Vercel</span>
            <span className="site-footer__tech-tag">Open Source</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
