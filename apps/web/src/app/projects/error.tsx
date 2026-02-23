'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProjectsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[WokGen] Projects error:', error);
  }, [error]);

  return (
    <div className="seg-error" role="alert">
      <p className="seg-error-msg">Projects failed to load — your workspace is temporarily unavailable.</p>
      <button className="seg-error-btn" onClick={reset}>Try again</button>
    </div>
  );
}
