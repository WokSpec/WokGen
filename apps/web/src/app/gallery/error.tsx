'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GalleryError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[WokGen] Gallery error:', error);
  }, [error]);

  return (
    <div className="seg-error" role="alert">
      <p className="seg-error-msg">Gallery failed to load — assets are temporarily unavailable.</p>
      <button className="seg-error-btn" onClick={reset}>Try again</button>
    </div>
  );
}
