'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  pixel: 'Pixel mode',
  business: 'Business mode',
  vector: 'Vector mode',
  uiux: 'UI/UX mode',
  voice: 'Voice mode',
  text: 'Text mode',
  studio: 'Studio',
  tools: 'Tools',
  docs: 'Docs',
  eral: 'Eral',
  account: 'Account',
  profile: 'Profile',
  billing: 'Billing',
  community: 'Community',
  settings: 'Settings',
  support: 'Support',
  admin: 'Admin',
  projects: 'Projects',
  gallery: 'Gallery',
  automations: 'Automations',
  pricing: 'Pricing',
  changelog: 'Changelog',
  brand: 'Brand',
  'open-source': 'Open Source',
  invite: 'Invite',
  privacy: 'Privacy',
  terms: 'Terms',
  usage: 'Usage',
};

interface BreadcrumbItem {
  label: string;
  href: string;
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  let accum = '';
  for (const segment of segments) {
    accum += `/${segment}`;
    const label = PATH_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    items.push({ label, href: accum });
  }

  return items;
}

export function Breadcrumb({ separator }: { separator?: string }) {
  const pathname = usePathname();

  // Don't show on homepage — caller's separator/wrapper also hides
  if (!pathname || pathname === '/') return null;

  const items = buildBreadcrumbs(pathname);
  // Skip single-item breadcrumb (just "Home") — not useful
  if (items.length <= 1) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {separator && (
        <span className="breadcrumb-prefix-sep" aria-hidden="true">{separator}</span>
      )}
      <ol className="breadcrumb-list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          // Skip "Home" in topbar context — too noisy
          if (idx === 0) return null;
          return (
            <li key={item.href} className="breadcrumb-item">
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="breadcrumb-link">
                    {item.label}
                  </Link>
                  <span className="breadcrumb-separator" aria-hidden="true">›</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
