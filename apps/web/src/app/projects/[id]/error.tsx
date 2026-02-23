'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProjectError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[WokGen] Project error:', error);
  }, [error]);

  return (
    <div className="seg-error" role="alert">
      <p className="seg-error-msg">Project failed to load — this project is temporarily unavailable.</p>
      <button className="seg-error-btn" onClick={reset}>Try again</button>
    </div>
  );
}
