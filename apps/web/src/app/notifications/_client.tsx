'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { relativeTime } from '@/lib/format';

// ---------------------------------------------------------------------------
// Notifications Page Client
// ---------------------------------------------------------------------------

interface Notification {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  link:      string | null;
  read:      boolean;
  createdAt: string;
}

const FILTERS = ['all', 'unread', 'system', 'generations', 'social'] as const;
type Filter = typeof FILTERS[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All', unread: 'Unread', system: 'System', generations: 'Generations', social: 'Social',
};

function notifIcon(type: string): string {
  const map: Record<string, string> = {
    generation_complete:   '✅',
    generation_failed:     '❌',
    quota_warning:         '⚠️',
    quota_exhausted:       '🚫',
    social:                '💜',
    level_up:              '⭐',
    project_invite:        '💜',
    team_joined:           '💜',
    system:                '🔔',
    billing:               '💳',
    new_feature:           '✨',
    automation_ran:        '🔔',
    batch_complete:        '✅',
    director_plan_complete:'✅',
  };
  return map[type] ?? '🔔';
}

function notifIconClass(type: string): string {
  if (type === 'generation_complete' || type === 'batch_complete' || type === 'director_plan_complete') return 'notification-icon notification-icon--green';
  if (type === 'generation_failed')   return 'notification-icon notification-icon--red';
  if (type === 'quota_warning')       return 'notification-icon notification-icon--yellow';
  if (type === 'quota_exhausted')     return 'notification-icon notification-icon--red';
  if (type === 'billing')             return 'notification-icon notification-icon--blue';
  if (type === 'new_feature')         return 'notification-icon notification-icon--purple';
  return 'notification-icon';
}

export default function NotificationsClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [filter,        setFilter]        = useState<Filter>((searchParams.get('filter') as Filter) ?? 'all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total,         setTotal]         = useState(0);
  const [unread,        setUnread]        = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [marking,       setMarking]       = useState(false);

  const load = useCallback(async (f: Filter, p: number, append = false) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/notifications?filter=${f}&page=${p}`);
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notification[]; total: number; unread: number };
      setNotifications(prev => append ? [...prev, ...data.notifications] : data.notifications);
      setTotal(data.total);
      setUnread(data.unread);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    void load(filter, 1, false);
  }, [filter, load]);

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    router.replace(`/notifications?filter=${f}`, { scroll: false });
  };

  const markRead = async (ids: string[]) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ids }),
      });
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - ids.filter(id => notifications.find(n => n.id === id && !n.read)).length));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch('/api/notifications/mark-read', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ } finally {
      setMarking(false);
    }
  };

  const handleItemClick = async (n: Notification) => {
    if (!n.read) await markRead([n.id]);
    if (n.link) router.push(n.link);
  };

  const loadMore = async () => {
    const next = page + 1;
    setPage(next);
    await load(filter, next, true);
  };

  const hasMore = notifications.length < total;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="notifications-title">
          Notifications
          {unread > 0 && <span className="notifications-badge">{unread}</span>}
        </h1>
        {unread > 0 && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={markAllRead}
            disabled={marking}
          >
            {marking ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="notifications-tabs" role="tablist">
        {FILTERS.map(f => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            type="button"
            className={`notifications-tab${filter === f ? ' notifications-tab--active' : ''}`}
            onClick={() => handleFilterChange(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="notifications-list" role="list">
        {loading && notifications.length === 0 ? (
          <div className="notifications-loading">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="notifications-empty-icon">✅</span>
            <p className="notifications-empty-title">You&apos;re all caught up!</p>
            <p className="notifications-empty-sub">No {filter !== 'all' ? filter + ' ' : ''}notifications to show.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              role="listitem"
              className={`notification-item${!n.read ? ' notification-item--unread' : ''}`}
              onClick={() => void handleItemClick(n)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && void handleItemClick(n)}
              aria-label={n.title}
            >
              <span className={notifIconClass(n.type)} aria-hidden="true">
                {notifIcon(n.type)}
              </span>
              <div className="notification-item__body">
                <p className="notification-item__title">{n.title}</p>
                <p className="notification-item__message">{n.body}</p>
                <p className="notification-item__time">{relativeTime(n.createdAt)}</p>
              </div>
              {!n.read && <span className="notification-item__dot" aria-label="Unread" />}
            </div>
          ))
        )}
      </div>

      {hasMore && !loading && (
        <div className="notifications-load-more">
          <button type="button" className="btn-ghost" onClick={() => void loadMore()}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
