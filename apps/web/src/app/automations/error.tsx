'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AutomationsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[WokGen] Automations error:', error);
  }, [error]);

  return (
    <div className="seg-error" role="alert">
      <p className="seg-error-msg">Automations failed to load — your schedules are temporarily unavailable.</p>
      <button className="seg-error-btn" onClick={reset}>Try again</button>
    </div>
  );
}
