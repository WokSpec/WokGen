'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function BrokenPixelIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="err-icon">
      <rect x="8"  y="8"  width="48" height="48" rx="4" fill="#1a1a2e" stroke="#252538" strokeWidth="2" />
      <rect x="18" y="20" width="6" height="6" fill="#B13E53" />
      <rect x="24" y="26" width="6" height="6" fill="#B13E53" />
      <rect x="30" y="32" width="6" height="6" fill="#B13E53" />
      <rect x="36" y="38" width="6" height="6" fill="#B13E53" />
      <rect x="36" y="20" width="6" height="6" fill="#B13E53" />
      <rect x="30" y="26" width="6" height="6" fill="#B13E53" />
      <rect x="24" y="32" width="6" height="6" fill="#B13E53" />
      <rect x="18" y="38" width="6" height="6" fill="#B13E53" />
      <rect x="8"  y="8"  width="4" height="4" fill="#252538" />
      <rect x="52" y="8"  width="4" height="4" fill="#252538" />
      <rect x="8"  y="52" width="4" height="4" fill="#252538" />
      <rect x="52" y="52" width="4" height="4" fill="#252538" />
    </svg>
  );
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[WokGen] Unhandled runtime error:', error);
  }, [error]);

  const message =
    error?.message && error.message.length < 200
      ? error.message
      : 'An unexpected error occurred while rendering this page.';

  const digest = error?.digest;

  return (
    <div role="alert" className="err-page">
      <div aria-hidden="true" className="err-grid-overlay" />

      <div className="err-card">
        <div className="err-icon-wrap">
          <BrokenPixelIcon />
        </div>

        <div className="err-label">
          <span className="err-label-dot" />
          Runtime Error
        </div>

        <h1 className="err-heading">Something went wrong</h1>

        <p className="err-message">{message}</p>

        {digest && (
          <p className="err-digest">
            Error ID: <span className="err-digest-value">{digest}</span>
          </p>
        )}

        <div aria-hidden="true" className="err-divider">
          {[4, 6, 4, 8, 4, 6, 4].map((size, i) => (
            <div key={i} className={i === 3 ? 'err-divider-dot err-divider-dot--accent' : 'err-divider-dot'} style={{ width: size, height: size }} />
          ))}
        </div>

        <div className="err-actions">
          <button onClick={reset} className="err-btn err-btn--retry">↺ Try again</button>
          <a href="/" className="err-btn err-btn--home">← Home</a>
        </div>

        <p className="err-help">
          If this keeps happening, check the{' '}
          <a href="/docs" className="err-link">docs</a>
          {' '}or open an issue on{' '}
          <a href="https://github.com/WokSpecialists/WokGen/issues" target="_blank" rel="noopener noreferrer" className="err-link">GitHub</a>.
        </p>
      </div>
    </div>
  );
}
