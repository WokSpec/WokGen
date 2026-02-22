'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
  plan: { id: string; name: string; creditsPerMonth: number } | null;
  hdCredits: { monthly: number; topUp: number };
}

export default function AccountClient({ user, plan, hdCredits }: Props) {
  const totalHd = hdCredits.monthly + hdCredits.topUp;

  return (
    <main className="account-page">
      <h1 className="account-title">Account</h1>

      {/* Profile */}
      <section className="account-section">
        <h2 className="section-title">Profile</h2>
        <div className="profile-row">
          {user.image && (
            <img src={user.image} alt={user.name ?? ''} className="profile-avatar" width={48} height={48} />
          )}
          <div>
            <p className="profile-name">{user.name ?? '—'}</p>
            <p className="profile-email">{user.email ?? '—'}</p>
          </div>
        </div>
      </section>

      {/* Plan + HD Credits */}
      <section className="account-section">
        <h2 className="section-title">Plan</h2>
        <div className="plan-row">
          <span className="plan-name">{plan?.name ?? 'Free'}</span>
          <Link href="/billing" className="upgrade-link">
            {plan?.id === 'free' ? 'Upgrade →' : 'Manage plan →'}
          </Link>
        </div>

        <div className="credits-row">
          <div className="credit-item">
            <span className="credit-label">Monthly HD credits</span>
            <span className="credit-value">{hdCredits.monthly}</span>
          </div>
          <div className="credit-item">
            <span className="credit-label">Top-up bank</span>
            <span className="credit-value">{hdCredits.topUp}</span>
          </div>
        </div>

        {totalHd === 0 && plan?.id === 'free' && (
          <p className="credits-note">
            Standard quality (Pollinations) is always unlimited.
            <Link href="/billing" className="upgrade-link"> Buy HD credits →</Link>
          </p>
        )}
      </section>

      {/* Sign out */}
      <section className="account-section">
        <button
          className="signout-btn"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sign out
        </button>
      </section>

      <style jsx>{`
        .account-page { max-width: 540px; margin: 0 auto; padding: 3rem 1.5rem; }
        .account-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 2rem; }
        .account-section {
          background: var(--surface-card, #161616);
          border: 1px solid var(--border-subtle, #262626);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .section-title { font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted, #666); margin: 0; }
        .profile-row { display: flex; align-items: center; gap: 1rem; }
        .profile-avatar { border-radius: 50%; border: 1px solid var(--border-subtle, #262626); }
        .profile-name { font-size: 1rem; font-weight: 600; margin: 0; }
        .profile-email { font-size: 0.85rem; color: var(--text-secondary, #888); margin: 0; }
        .plan-row { display: flex; align-items: center; justify-content: space-between; }
        .plan-name { font-size: 1rem; font-weight: 600; }
        .credits-row { display: flex; gap: 1.5rem; }
        .credit-item { display: flex; flex-direction: column; gap: 0.15rem; }
        .credit-label { font-size: 0.75rem; color: var(--text-muted, #666); }
        .credit-value { font-size: 1.25rem; font-weight: 700; }
        .credits-note { font-size: 0.8rem; color: var(--text-muted, #666); margin: 0; }
        .upgrade-link { color: #a78bfa; text-decoration: none; font-weight: 500; }
        .upgrade-link:hover { text-decoration: underline; }
        .signout-btn {
          background: none;
          border: 1px solid #3f1f1f;
          border-radius: 6px;
          color: #ef4444;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          cursor: pointer;
          align-self: flex-start;
        }
        .signout-btn:hover { background: rgba(239,68,68,.08); border-color: #ef4444; }
      `}</style>
    </main>
  );
}
