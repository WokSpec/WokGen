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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '32px' }}>⚠</div>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        Studio encountered an error
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
        {error.message || 'Something went wrong loading the studio. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius)',
          padding: '8px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
      <a
        href="/studio"
        style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}
      >
        Back to Studio
      </a>
    </div>
  );
}
