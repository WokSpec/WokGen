'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LEFT_LINKS = [
  { label: 'Pixel Studio',     href: '/pixel/studio',                        external: false },
  { label: 'Gallery',          href: '/pixel/gallery',                       external: false },
  { label: 'Billing',          href: '/billing',                             external: false },
  { label: 'Docs',             href: '/docs',                                external: false },
  { label: 'Terms',            href: '/terms',                               external: false },
  { label: 'Privacy',          href: '/privacy',                             external: false },
];

const RIGHT_LINKS = [
  { label: 'wokspec.org', href: 'https://wokspec.org',                  external: true },
  { label: 'GitHub',      href: 'https://github.com/WokSpec/WokGen',   external: true },
];

function NavItem({ label, href, external }: { label: string; href: string; external: boolean }) {
  const style: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' };
  const props = {
    style,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; },
  };
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{label}</a>
    : <Link href={href} {...props}>{label}</Link>;
}

export function Footer() {
  const pathname = usePathname();
  if (pathname === '/studio' || pathname.endsWith('/studio')) return null;

  return (
    <footer>
      <div className="divider-gradient" />
      <div style={{ background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>

            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Wok</span>
                <span style={{ color: '#a78bfa' }}>Gen</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                by{' '}
                <a href="https://wokspec.org" style={{ color: 'var(--text-faint)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}>
                  Wok Specialists
                </a>
              </span>
            </div>

            {/* Links */}
            <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }} aria-label="Footer navigation">
              {LEFT_LINKS.map(l => <NavItem key={l.label} {...l} />)}
              <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>·</span>
              {RIGHT_LINKS.map(l => <NavItem key={l.label} {...l} />)}
            </nav>

          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
              © {new Date().getFullYear()} Wok Specialists LLC. Released under the{' '}
              <a href="/license" style={{ color: 'var(--text-faint)', textDecoration: 'none' }}>MIT license</a>.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="tag tag-gray" style={{ fontSize: '0.58rem' }}>Next.js</span>
              <span className="tag tag-gray" style={{ fontSize: '0.58rem' }}>Vercel</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
