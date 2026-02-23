'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BrandError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[WokGen] Brand error:', error);
  }, [error]);

  return (
    <div className="seg-error" role="alert">
      <p className="seg-error-msg">Brand kits failed to load — your style guide is temporarily unavailable.</p>
      <button className="seg-error-btn" onClick={reset}>Try again</button>
    </div>
  );
}
