'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/studio';

  const handleSignIn = (provider: 'github' | 'google') => {
    signIn(provider, { callbackUrl });
  };

  return (
    <main className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-badge">Early Preview</span>
          <h1 className="login-title">WokGen</h1>
          <p className="login-sub">by Wok Specialists</p>
        </div>

        <p className="login-desc">
          AI pixel art generation. Sign in to start creating.
        </p>

        <div className="login-actions">
          <button
            className="login-btn login-btn--github"
            onClick={() => handleSignIn('github')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.09.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.577.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Continue with GitHub
          </button>

          <button
            className="login-btn login-btn--google"
            onClick={() => handleSignIn('google')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

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
          background: var(--surface-base, #0d0d0d);
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
          gap: 1.5rem;
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
          color: var(--text-primary, #f0f0f0);
          margin: 0;
        }
        .login-sub {
          font-size: 0.78rem;
          color: var(--text-muted, #666);
          margin: 0;
        }
        .login-desc {
          font-size: 0.875rem;
          color: var(--text-secondary, #888);
          text-align: center;
          margin: 0;
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
          padding: 0.65rem 1rem;
          border-radius: 6px;
          border: 1px solid var(--border-subtle, #262626);
          background: var(--surface-raised, #1e1e1e);
          color: var(--text-primary, #f0f0f0);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .login-btn:hover {
          background: var(--surface-hover, #242424);
          border-color: #3a3a3a;
        }
        .login-footer {
          text-align: center;
          margin: 0;
        }
        .login-back {
          font-size: 0.78rem;
          color: var(--text-muted, #666);
          text-decoration: none;
        }
        .login-back:hover { color: var(--text-secondary, #888); }
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
