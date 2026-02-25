'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/pixel/studio', label: 'Pixel mode' },
  { href: '/business/studio', label: 'Business mode' },
  { href: '/vector/studio', label: 'Vector mode' },
  { href: '/uiux/studio', label: 'UI/UX mode' },
  { href: '/voice/studio', label: 'Voice mode' },
  { href: '/text/studio', label: 'Text mode' },
  { href: '/tools', label: 'Tools' },
  { href: '/community', label: 'Community' },
  { href: '/eral', label: 'Eral' },
  { href: '/docs', label: 'Docs' },
  { href: '/support', label: 'Support' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        className="mobile-nav-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`mobile-nav-drawer${open ? ' mobile-nav-drawer--open' : ''}`}
        aria-label="Navigation drawer"
        role="dialog"
        aria-modal={open}
      >
        <div className="mobile-nav-drawer-header">
          <span className="mobile-nav-drawer-title">
            <span style={{ color: 'var(--text-muted)' }}>Wok</span>
            <span style={{ color: '#a78bfa' }}>Gen</span>
          </span>
          <button
            className="mobile-nav-drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="mobile-nav-drawer-nav">
          <div className="mobile-nav-section-label">Modes</div>
          {NAV_ITEMS.filter(item => item.href.includes('/studio')).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item${pathname === item.href || pathname?.startsWith(item.href + '/') ? ' mobile-nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-nav-section-divider" />
          <div className="mobile-nav-section-label">Explore</div>
          {[
            { href: '/tools', label: 'Tools' },
            { href: '/community', label: 'Community' },
            { href: '/eral', label: 'Eral' },
            { href: '/docs', label: 'Docs' },
            { href: '/open-source', label: 'Open Source' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item${pathname === item.href || pathname?.startsWith(item.href + '/') ? ' mobile-nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-nav-section-divider" />
          <Link href="/support" className="mobile-nav-item" onClick={() => setOpen(false)}>Support</Link>
        </nav>

        <div className="mobile-nav-drawer-footer">
          <a
            href="https://wokspec.org"
            className="mobile-nav-footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            ← wokspec.org
          </a>
        </div>
      </div>
    </>
  );
}
