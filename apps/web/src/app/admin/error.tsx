'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[WokGen] Admin error:', error);
  }, [error]);

  return (
    <div className="seg-error" role="alert">
      <p className="seg-error-msg">Admin dashboard failed to load — please try again.</p>
      <button className="seg-error-btn" onClick={reset}>Try again</button>
    </div>
  );
}
