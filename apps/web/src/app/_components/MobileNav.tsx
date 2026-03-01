'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MODES_LIST } from '@/lib/modes';

const NAV_ITEMS = [
  { href: '/',          label: 'Home' },
  { href: '/tools',     label: 'Tools' },
  { href: '/eral',      label: 'Eral' },
  { href: '/community', label: 'Community' },
  { href: '/projects',  label: 'Projects' },
  { href: '/dashboard', label: 'Dashboard' },
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
      <button type="button"
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
            <span style={{ color: 'var(--accent)' }}>Gen</span>
          </span>
          <button type="button"
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
          {/* Studios section */}
          <p className="mobile-nav-section-label">Studios</p>
          {MODES_LIST.filter(m => m.status !== 'coming_soon').map((mode) => (
            <Link
              key={mode.id}
              href={mode.routes.studio}
              className={`mobile-nav-item mobile-nav-item--mode${pathname?.startsWith(mode.routes.landing) ? ' mobile-nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
              style={{ '--mode-accent': mode.accentColor } as React.CSSProperties}
            >
              <span className="mobile-nav-item-dot" style={{ background: mode.accentColor }} />
              {mode.label}
              {mode.status === 'beta' && <span className="mobile-nav-badge">β</span>}
            </Link>
          ))}

          {/* General navigation */}
          <p className="mobile-nav-section-label" style={{ marginTop: '1rem' }}>Platform</p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item${pathname === item.href ? ' mobile-nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mobile-nav-drawer-footer">
          <a
            href="https://wokspec.org"
            className="mobile-nav-footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            ← WokSpec
          </a>
          <a
            href="https://github.com/WokSpec/WokGen"
            className="mobile-nav-footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </>
  );
}
