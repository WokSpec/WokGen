'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MODES_LIST } from '@/lib/modes';
import type { ModeId } from '@/lib/modes';

// ── Mode icons ───────────────────────────────────────────────────────────────

function PixelIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" opacity="0.65" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" opacity="0.45" />
    </svg>
  );
}

function VectorIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="2.5" cy="12.5" r="1.5" />
      <circle cx="12.5" cy="2.5" r="1.5" />
      <path d="M2.5 11C2.5 6.5 6.5 5 8.5 5C10.5 5 12.5 3.5 12.5 4" strokeLinecap="round" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1.5 4h8.5l3 3.5-3 3.5H1.5l2-3.5-2-3.5z" strokeLinejoin="round" />
      <circle cx="5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UiuxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="1" y="2" width="13" height="11" rx="1.5" />
      <line x1="1" y1="5.5" x2="14" y2="5.5" />
      <rect x="2.5" y="7" width="4" height="3.5" rx="0.5" />
      <line x1="8" y1="7.5" x2="12" y2="7.5" />
      <line x1="8" y1="9.5" x2="10.5" y2="9.5" />
    </svg>
  );
}

function VoiceIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
      <rect x="1"   y="5.5" width="2" height="4"   rx="1" />
      <rect x="4"   y="3.5" width="2" height="8"   rx="1" />
      <rect x="6.5" y="1"   width="2" height="13"  rx="1" />
      <rect x="9"   y="3.5" width="2" height="8"   rx="1" />
      <rect x="12"  y="5.5" width="2" height="4"   rx="1" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4.5 3.5 1 7.5 4.5 11.5" />
      <polyline points="10.5 3.5 14 7.5 10.5 11.5" />
      <line x1="8.5" y1="2.5" x2="6.5" y2="12.5" />
    </svg>
  );
}

// ── Nav icons ────────────────────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 1.5a3 3 0 0 0-3 3v.1L1.5 11A1.5 1.5 0 0 0 3.8 13.3L10 7.1V7a3 3 0 0 0 1-5.5z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="1.5" />
      <circle cx="5" cy="5" r="1.5" />
      <path d="M1 10.5 4.5 7 7.5 10 10.5 7.5 14 10.5" strokeLinecap="round" />
    </svg>
  );
}

function EralIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.5" />
      <path d="M5 8.5c.5-1.5 5-1.5 5 0" strokeLinecap="round" />
      <circle cx="5.5" cy="6" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="6" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="2.5" />
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.06 1.06M11.04 11.04l1.06 1.06M2.9 12.1l1.06-1.06M11.04 3.96l1.06-1.06" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="5.5" cy="4.5" r="2.5" />
      <path d="M1 14c0-2.5 2-4.5 4.5-4.5h2" />
      <circle cx="11.5" cy="6.5" r="2" />
      <path d="M9.5 14c0-2 1.8-3.5 4-3.5" />
    </svg>
  );
}

// ── Mode icon map ─────────────────────────────────────────────────────────────

const MODE_ICONS: Record<ModeId, () => React.JSX.Element> = {
  pixel:    PixelIcon,
  vector:   VectorIcon,
  business: BrandIcon,
  uiux:     UiuxIcon,
  voice:    VoiceIcon,
  code:     CodeIcon,
};

// ── SidebarItem ───────────────────────────────────────────────────────────────

interface SidebarItemProps {
  href: string;
  label: string;
  active: boolean;
  accentColor?: string;
  children: React.ReactNode;
}

function SidebarItem({ href, label, active, accentColor, children }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`sidebar-item${active ? ' sidebar-item--active' : ''}`}
      style={
        active && accentColor
          ? ({ color: accentColor, '--sidebar-item-accent': accentColor } as React.CSSProperties)
          : undefined
      }
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      data-tooltip={label}
    >
      {children}
      {active && (
        <span
          className="sidebar-item__dot"
          style={accentColor ? { background: accentColor } : undefined}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

// ── UserAvatar ────────────────────────────────────────────────────────────────

function UserAvatar() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div
        className="sidebar-avatar"
        style={{ background: 'var(--surface-raised)', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }}
        aria-hidden="true"
      />
    );
  }

  if (!session?.user) return null;

  const name = session.user.name ?? session.user.email ?? 'U';
  const initial = name[0].toUpperCase();

  return (
    <Link href="/account" className="sidebar-avatar" title={name} aria-label={`Account: ${name}`}>
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt={name}
          width={28}
          height={28}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <span className="sidebar-avatar__initials">{initial}</span>
      )}
    </Link>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path ||
    (path !== '/' && pathname?.startsWith(path + '/')) ||
    (path !== '/' && pathname?.startsWith(path + '?'));

  const isModeActive = (modeId: string) =>
    !!pathname && (pathname === `/${modeId}` || pathname.startsWith(`/${modeId}/`));

  return (
    <aside className="app-shell__sidebar" aria-label="Application sidebar">
      {/* Logo */}
      <Link href="/" className="sidebar-logo" aria-label="WokGen home" title="WokGen">
        WG
      </Link>

      <div className="sidebar-divider" aria-hidden="true" />

      {/* Studio modes */}
      {MODES_LIST.map((mode) => {
        const Icon = MODE_ICONS[mode.id];
        return (
          <SidebarItem
            key={mode.id}
            href={mode.routes.studio}
            label={mode.label}
            active={isModeActive(mode.id)}
            accentColor={mode.accentColor}
          >
            <Icon />
          </SidebarItem>
        );
      })}

      <div className="sidebar-divider" aria-hidden="true" />

      {/* App navigation */}
      <SidebarItem href="/dashboard" label="Dashboard" active={isActive('/dashboard')}>
        <DashboardIcon />
      </SidebarItem>
      <SidebarItem href="/tools" label="Tools" active={isActive('/tools')}>
        <ToolsIcon />
      </SidebarItem>
      <SidebarItem
        href="/library"
        label="Library"
        active={isActive('/library') || isActive('/gallery')}
      >
        <GalleryIcon />
      </SidebarItem>
      <SidebarItem href="/eral" label="Eral" active={isActive('/eral')}>
        <EralIcon />
      </SidebarItem>

      {/* Push bottom items down */}
      <div style={{ flex: 1 }} aria-hidden="true" />

      <SidebarItem href="/community" label="Community" active={isActive('/community')}>
        <CommunityIcon />
      </SidebarItem>
      <SidebarItem href="/settings" label="Settings" active={isActive('/settings')}>
        <SettingsIcon />
      </SidebarItem>
      <UserAvatar />
    </aside>
  );
}
