'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';

// ─── Compact usage meter shown in nav ────────────────────────────────────────

function NavUsageMeter() {
  const [quota, setQuota] = useState<{
    planId: string; dailyLimit: number; todayUsed: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/usage?page=1&limit=1')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.quota) setQuota(d.quota); })
      .catch(() => null);
  }, []);

  if (!quota || quota.dailyLimit < 0) return null;

  const p = Math.min(100, Math.round((quota.todayUsed / quota.dailyLimit) * 100));
  const fillClass = p >= 90 ? 'nav-usage-meter__fill--danger' : p >= 70 ? 'nav-usage-meter__fill--warn' : '';

  return (
    <Link href="/account/usage" className="nav-usage-meter" title={`${quota.todayUsed}/${quota.dailyLimit} generations today`}>
      <div className="nav-usage-meter__track">
        <div className={`nav-usage-meter__fill ${fillClass}`} style={{ width: `${p}%` }} />
      </div>
      <span className="nav-usage-meter__label">{quota.todayUsed}/{quota.dailyLimit}</span>
    </Link>
  );
}

export function NavAuth() {
  const { data: session, status } = useSession();
  const isSelfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === 'true';
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(closeTimer.current);
  }, []);

  // Public-by-default setting
  const [publicDefault, setPublicDefault]   = useState(false);
  const [savingDefault, setSavingDefault]   = useState(false);

  // Fetch user setting when authenticated
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/user/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPublicDefault(d.publicGenerationsDefault ?? false); })
      .catch(() => null);
  }, [session]);

  const togglePublicDefault = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (savingDefault) return;
    setSavingDefault(true);
    const next = !publicDefault;
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicGenerationsDefault: next }),
      });
      if (res.ok) setPublicDefault(next);
    } catch { /* ignore */ }
    setSavingDefault(false);
  };

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (isSelfHosted) return null;

  if (status === 'loading') {
    return <div className="nav-auth-skeleton" aria-hidden />;
  }

  if (!session) {
    return (
      <button
        className="btn-primary btn-sm"
        onClick={() => signIn(undefined, { callbackUrl: '/pixel/studio' })}
      >
        Sign in
      </button>
    );
  }

  const displayName = session.user?.name?.split(' ')[0] ?? session.user?.email?.split('@')[0] ?? 'You';
  const initial = displayName[0]?.toUpperCase() ?? 'U';

  return (
    <div
      className="nav-user"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavUsageMeter />
      <NotificationBell />
      <button
        className="nav-user-trigger"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={displayName}
            className="nav-avatar"
            width={28}
            height={28}
          />
        ) : (
          <span className="nav-avatar nav-avatar--initials">{initial}</span>
        )}
        <span className="nav-user-name">{displayName}</span>
        <span className="nav-user-chevron" aria-hidden>{open ? '▲' : '▾'}</span>
      </button>

      {open && (
        <div
          className="nav-user-menu"
          role="menu"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="nav-user-menu-header">
            <span className="nav-user-menu-name">{session.user?.name ?? session.user?.email}</span>
            {session.user?.email && session.user?.name && (
              <span className="nav-user-menu-email">{session.user.email}</span>
            )}
          </div>
          <div className="nav-user-menu-divider" />
          <Link href="/community" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Community
          </Link>
          <Link href="/profile" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Profile
          </Link>
          <Link href="/library" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Asset Library
          </Link>
          <Link href="/projects" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Projects
          </Link>
          <Link href="/account" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Account
          </Link>
          <Link href="/settings" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <Link href="/account/usage" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Usage &amp; limits
          </Link>
          <Link href="/billing" className="nav-user-item" role="menuitem" onClick={() => setOpen(false)}>
            Billing & Plans
          </Link>
          <div className="nav-user-menu-divider" />
          {/* Public-by-default toggle */}
          <button
            className="nav-user-item nav-user-item--toggle"
            role="menuitem"
            onClick={togglePublicDefault}
            disabled={savingDefault}
            title="When on, new generations default to public in the community gallery"
          >
            <span style={{ flex: 1, textAlign: 'left' }}>Public generations</span>
            <span
              style={{
                width: 28,
                height: 16,
                borderRadius: 8,
                background: publicDefault ? 'var(--accent)' : 'var(--surface-border)',
                position: 'relative',
                display: 'inline-block',
                flexShrink: 0,
                transition: 'background 0.2s ease',
                opacity: savingDefault ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: publicDefault ? 14 : 2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s ease',
                }}
              />
            </span>
          </button>
          <div className="nav-user-menu-divider" />
          <button
            className="nav-user-item nav-user-item--danger"
            role="menuitem"
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
          >
            Sign out
          </button>
        </div>
      )}

      <style>{`
        .nav-auth-skeleton {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--surface-raised, #1e1e1e);
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

        .nav-user { position: relative; display: flex; align-items: center; }

        .nav-user-trigger {
          display: flex; align-items: center; gap: 0.4rem;
          background: none; border: 1px solid transparent; border-radius: 6px;
          padding: 0.2rem 0.4rem 0.2rem 0.25rem;
          min-height: 44px;
          cursor: pointer; transition: border-color 0.12s, background 0.12s;
          color: var(--text-muted, #888);
        }
        .nav-user-trigger:hover,
        .nav-user-trigger[aria-expanded="true"] {
          border-color: var(--border, #2a2a2a);
          background: var(--surface-raised, #1e1e1e);
          color: var(--text, #f0f0f0);
        }

        .nav-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          border: 1px solid var(--border-subtle, #262626);
        }
        .nav-avatar--initials {
          display: flex; align-items: center; justify-content: center;
          background: #27272a; color: var(--text, #f0f0f0);
          font-size: 0.7rem; font-weight: 700;
        }
        .nav-user-name {
          font-size: 0.8rem; font-weight: 500; max-width: 80px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .nav-user-chevron { font-size: 0.55rem; line-height: 1; opacity: 0.6; }

        .nav-user-menu {
          position: absolute; top: 100%; right: 0; margin-top: -1px;
          background: var(--bg-surface, #111); border: 1px solid var(--border, #2a2a2a);
          border-radius: 8px; overflow: hidden; min-width: 210px; z-index: 200;
          box-shadow: 0 12px 32px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.4);
          animation: menuIn 0.1s ease;
        }
        @keyframes menuIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

        .nav-user-menu-header {
          padding: 0.75rem 0.875rem 0.6rem;
          display: flex; flex-direction: column; gap: 0.15rem;
        }
        .nav-user-menu-name {
          font-size: 0.82rem; font-weight: 600; color: var(--text, #f0f0f0);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nav-user-menu-email {
          font-size: 0.72rem; color: var(--text-faint, #555);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nav-user-menu-divider {
          height: 1px; background: var(--border-subtle, #1e1e1e); margin: 0.2rem 0;
        }
        .nav-user-item {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 0.875rem; font-size: 0.82rem;
          min-height: 44px;
          color: var(--text-muted, #888); text-decoration: none;
          background: none; border: none; text-align: left; cursor: pointer; width: 100%;
          transition: background 0.1s, color 0.1s;
        }
        .nav-user-item:hover { background: var(--surface-raised, #1e1e1e); color: var(--text, #f0f0f0); }
        .nav-user-item--danger:hover { color: #ef4444; background: rgba(239,68,68,.06); }
        .nav-user-item--toggle { justify-content: space-between; }
        .nav-user-item--toggle:hover { background: var(--surface-raised, #1e1e1e); color: var(--text, #f0f0f0); }
        .nav-user-item:disabled { opacity: 0.6; cursor: wait; }
      `}</style>
    </div>
  );
}

