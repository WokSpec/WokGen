'use client';
import { useEffect } from 'react';
export default function StudioErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[WokGen] Studio error:', error); }, [error]);
  return (
    <div className="uiux-st-error-wrap">
      <h2 className="uiux-st-error-heading">Studio error</h2>
      <p className="uiux-st-error-msg">
        {error?.message && error.message.length < 200 ? error.message : 'An unexpected error occurred.'}
      </p>
      <div className="uiux-st-error-actions">
        <button type="button" onClick={reset} className="uiux-st-error-retry">
          Try again
        </button>
        <a href="/uiux/studio" className="uiux-st-error-back">
          Back to studio
        </a>
      </div>
    </div>
  );
}
