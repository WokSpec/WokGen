'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function NavLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="text-sm font-medium transition-colors duration-150"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)';
      }}
    >
      {children}
    </Link>
  );
}
