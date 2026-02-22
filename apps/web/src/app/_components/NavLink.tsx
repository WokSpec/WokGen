'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + '/');

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}
    >
      {children}
    </Link>
  );
}
