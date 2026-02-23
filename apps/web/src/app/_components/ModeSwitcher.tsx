'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODES_LIST } from '@/lib/modes';

export function ModeSwitcher() {
  const pathname = usePathname();

  // Active mode = URL prefix match
  const activeMode = MODES_LIST.find(m => pathname.startsWith(m.routes.landing))?.id ?? null;

  // Preserve the current sub-path (studio/gallery) when switching modes
  const pathSegment = pathname.split('/').pop();

  return (
    <div className="mode-switcher" role="navigation" aria-label="Product mode">
      <div className="mode-switcher-inner">
        {MODES_LIST.map(mode => {
          const isActive = activeMode === mode.id;
          const isSoon   = mode.status === 'coming_soon';
          const isBeta   = mode.status === 'beta';
          // Smart navigation: preserve studio/gallery sub-path when switching modes
          const href = isSoon
            ? mode.routes.landing
            : pathSegment === 'gallery' && mode.routes.gallery
              ? mode.routes.gallery
              : mode.routes.studio;

          return (
            <div key={mode.id} className="mode-tab-wrapper">
              {isSoon ? (
                <Link
                  href={href}
                  className="mode-tab mode-tab--soon"
                  title={`${mode.label} — Coming Soon`}
                >
                  {mode.shortLabel}
                  <span className="mode-tab-badge">Soon</span>
                </Link>
              ) : (
                <Link
                  href={href}
                  className={`mode-tab${isActive ? ' mode-tab--active' : ''}`}
                  style={isActive ? { '--tab-accent': mode.accentColor } as React.CSSProperties : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {mode.shortLabel}
                  {isBeta && !isActive && (
                    <span className="mode-tab-badge mode-tab-badge--beta">β</span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
