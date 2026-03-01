'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// NotificationBell — polls unread count every 60s, links to /notifications
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?count=true');
        if (res.ok) {
          const data = await res.json() as { unread?: number };
          setUnread(data.unread ?? 0);
        }
      } catch { /* silent */ }
    };

    void fetchUnread();
    const interval = setInterval(() => void fetchUnread(), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/notifications"
      className="topbar-bell"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1a4.5 4.5 0 0 0-4.5 4.5c0 2.1-.6 3.3-1.1 4H13.6c-.5-.7-1.1-1.9-1.1-4A4.5 4.5 0 0 0 8 1z"
          stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"
        />
        <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </svg>
      {unread > 0 && (
        <span className="topbar-bell__badge" aria-hidden="true">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}

