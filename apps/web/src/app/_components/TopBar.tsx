import Link from 'next/link';
import { NavAuth } from './NavAuth';
import { CmdKButton } from './CmdKButton';
import { MobileNav } from './MobileNav';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell } from './NotificationBell';
import AppThemeToggle from '@/components/AppThemeToggle';

/**
 * TopBar — persistent 44px header bar.
 * Replaces the old NavBar. Shows wordmark, breadcrumb, and right-side actions.
 * Sidebar (56px icon rail) handles primary navigation.
 */
export function TopBar() {
  return (
    <header className="app-topbar" aria-label="Top bar">
      {/* Left: Wordmark + breadcrumb */}
      <div className="app-topbar__left">
        <Link href="/" className="app-topbar__wordmark" aria-label="WokGen home">
          <span className="app-topbar__wordmark-wok">Wok</span>
          <span className="app-topbar__wordmark-gen">Gen</span>
        </Link>
        {/* Separator + breadcrumb — Breadcrumb returns null on /, so we wrap
            both in a fragment and let the breadcrumb's own null return hide them */}
        <div className="app-topbar__breadcrumb">
          <Breadcrumb separator="/" />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="app-topbar__right">
        <Link href="/search" className="app-topbar__search-btn" aria-label="Search" title="Search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10 10 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
        <span className="app-topbar__cmdk-wrap">
          <CmdKButton />
        </span>
        <NotificationBell />
        <AppThemeToggle />
        <NavAuth />
        {/* Hamburger menu — visible only on mobile (sidebar is hidden) */}
        <span className="app-topbar__mobile-only">
          <MobileNav />
        </span>
      </div>
    </header>
  );
}
