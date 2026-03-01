'use client';
import { useEffect } from 'react';
export default function StudioErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[WokGen] Studio error:', error); }, [error]);
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Studio error</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        {error?.message && error.message.length < 200 ? error.message : 'An unexpected error occurred.'}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button type="button" onClick={reset} style={{ padding: '0.5rem 1.25rem', background: 'var(--accent-subtle)', border: '1px solid var(--accent-glow)', borderRadius: '6px', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.875rem' }}>
          Try again
        </button>
        <a href="/business/studio" style={{ padding: '0.5rem 1.25rem', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          Back to studio
        </a>
      </div>
    </div>
  );
}
