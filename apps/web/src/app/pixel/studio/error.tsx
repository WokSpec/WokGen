'use client';

import { useEffect } from 'react';

export default function PixelStudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Pixel Studio] Error:', error);
  }, [error]);

  return (
    <div className="pixel-st-error-wrap">
      <div className="pixel-st-error-icon">⚠</div>
      <h2 className="pixel-st-error-heading">
        Studio encountered an error
      </h2>
      <p className="pixel-st-error-msg">
        {error.message || 'Something went wrong loading the studio. Please try again.'}
      </p>
      <button type="button"
        onClick={reset}
        className="pixel-st-error-btn"
      >
        Try Again
      </button>
      <a
        href="/pixel/studio"
        className="pixel-st-error-link"
      >
        Back to Studio
      </a>
    </div>
  );
}
