'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export function NavAuth() {
  const { data: session, status } = useSession();
  const isSelfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === 'true';

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

  return (
    <div className="nav-user">
      {session.user?.image ? (
        <img
          src={session.user.image}
          alt={session.user.name ?? 'User'}
          className="nav-avatar"
          width={28}
          height={28}
        />
      ) : (
        <span className="nav-avatar nav-avatar--initials">
          {(session.user?.name ?? session.user?.email ?? 'U')[0].toUpperCase()}
        </span>
      )}

      <div className="nav-user-menu">
        <Link href="/account" className="nav-user-item">Account</Link>
        <Link href="/billing" className="nav-user-item">Billing</Link>
        <button
          className="nav-user-item nav-user-item--danger"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sign out
        </button>
      </div>

      <style jsx>{`
        .nav-auth-skeleton {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--surface-raised, #1e1e1e);
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .nav-user { position: relative; display: flex; align-items: center; }
        .nav-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-subtle, #262626);
          cursor: pointer;
        }
        .nav-avatar--initials {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-raised, #1e1e1e);
          color: var(--text-primary, #f0f0f0);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .nav-user:hover .nav-user-menu { display: flex; }
        .nav-user-menu {
          display: none;
          flex-direction: column;
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--surface-card, #161616);
          border: 1px solid var(--border-subtle, #262626);
          border-radius: 6px;
          overflow: hidden;
          min-width: 140px;
          z-index: 100;
          box-shadow: 0 8px 24px rgba(0,0,0,.5);
        }
        .nav-user-item {
          display: block;
          padding: 0.55rem 0.875rem;
          font-size: 0.8rem;
          color: var(--text-secondary, #888);
          text-decoration: none;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          width: 100%;
        }
        .nav-user-item:hover { background: var(--surface-raised, #1e1e1e); color: var(--text-primary, #f0f0f0); }
        .nav-user-item--danger:hover { color: #ef4444; }
      `}</style>
    </div>
  );
}
