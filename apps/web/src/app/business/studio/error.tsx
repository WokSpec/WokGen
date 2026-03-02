'use client';
import { useEffect } from 'react';
export default function StudioErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[WokGen] Studio error:', error); }, [error]);
  return (
    <div className="biz-st-error-wrap">
      <h2 className="biz-st-error-heading">Studio error</h2>
      <p className="biz-st-error-msg">
        {error?.message && error.message.length < 200 ? error.message : 'An unexpected error occurred.'}
      </p>
      <div className="biz-st-error-actions">
        <button type="button" onClick={reset} className="biz-st-error-retry">
          Try again
        </button>
        <a href="/business/studio" className="biz-st-error-back">
          Back to studio
        </a>
      </div>
    </div>
  );
}
