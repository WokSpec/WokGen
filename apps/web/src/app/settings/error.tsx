'use client';
import { useEffect } from 'react';
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[WokGen] Error:', error); }, [error]);
  return (
    <div className="page-error-wrap">
      <h2 className="page-error-title">Something went wrong</h2>
      <p className="page-error-desc">
        {error?.message && error.message.length < 200 ? error.message : 'An unexpected error occurred.'}
      </p>
      <div className="page-error-actions">
        <button type="button" onClick={reset}>Try again</button>
        <a href="/">Go home</a>
      </div>
    </div>
  );
}
