'use client';
import { useEffect } from 'react';
export default function StudioErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[WokGen] Studio error:', error); }, [error]);
  return (
    <div className="voice-st-error-wrap">
      <h2 className="voice-st-error-heading">Studio error</h2>
      <p className="voice-st-error-msg">
        {error?.message && error.message.length < 200 ? error.message : 'An unexpected error occurred.'}
      </p>
      <div className="voice-st-error-actions">
        <button type="button" onClick={reset} className="voice-st-error-retry">
          Try again
        </button>
        <a href="/voice/studio" className="voice-st-error-back">
          Back to studio
        </a>
      </div>
    </div>
  );
}
