'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/studio';

  return (
    <main className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <h1 className="login-title">
            <span style={{ color: 'var(--text-muted)' }}>Wok</span>
            <span style={{ color: '#a78bfa' }}>Gen</span>
          </h1>
          <p className="login-sub">by Wok Specialists</p>
        </div>

        <p className="login-desc">
          Sign in to save your generations and access HD quality.
        </p>

        <div className="login-actions">
          <button
            className="login-btn login-btn--github"
            onClick={() => signIn('github', { callbackUrl })}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="login-divider">
          <span>or</span>
        </div>

        <a href="/studio" className="login-guest">
          Try without an account →
        </a>

        <p className="login-hint">
          Guest access supports standard generation only (no HD, no history).
        </p>

        <p className="login-footer">
          <a href="https://wokspec.org" className="login-back">← wokspec.org</a>
        </p>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg, #0d0d0d);
          padding: 2rem;
        }
        .login-card {
          width: 100%;
          max-width: 380px;
          background: var(--bg-surface, #141414);
          border: 1px solid var(--border, #2c2c2c);
          border-radius: 4px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .login-brand {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }
        .login-badge {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #a78bfa;
          background: rgba(167,139,250,.1);
          border: 1px solid rgba(167,139,250,.25);
          border-radius: 2px;
          padding: 2px 8px;
        }
        .login-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          font-family: var(--font-heading);
        }
        .login-sub {
          font-size: 0.78rem;
          color: var(--text-muted, #666);
          margin: 0;
        }
        .login-desc {
          font-size: 0.85rem;
          color: var(--text-muted, #888);
          text-align: center;
          margin: 0;
          line-height: 1.5;
        }
        .login-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.7rem 1rem;
          border-radius: 4px;
          border: 1px solid var(--border, #2c2c2c);
          background: var(--bg-elevated, #1c1c1c);
          color: var(--text, #ebebeb);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .login-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: #3a3a3a;
        }
        .login-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-faint, #464646);
          font-size: 0.75rem;
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border, #2c2c2c);
        }
        .login-guest {
          display: block;
          text-align: center;
          font-size: 0.85rem;
          color: #a78bfa;
          text-decoration: none;
          padding: 0.6rem;
          border-radius: 4px;
          border: 1px solid rgba(167,139,250,.25);
          transition: background 0.15s, border-color 0.15s;
        }
        .login-guest:hover {
          background: rgba(167,139,250,.08);
          border-color: rgba(167,139,250,.4);
        }
        .login-hint {
          font-size: 0.72rem;
          color: var(--text-faint, #464646);
          text-align: center;
          margin: -0.5rem 0 0;
          line-height: 1.5;
        }
        .login-footer {
          text-align: center;
          margin: 0;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border, #2c2c2c);
        }
        .login-back {
          font-size: 0.78rem;
          color: var(--text-faint, #464646);
          text-decoration: none;
          transition: color 0.15s;
        }
        .login-back:hover { color: var(--text-muted, #888); }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
