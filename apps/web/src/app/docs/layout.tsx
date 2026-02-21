// Force the /docs route to render dynamically (no static pre-generation).
// The docs page is a large 'use client' component that exceeds the default
// static generation worker timeout when pre-rendered at build time.
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
