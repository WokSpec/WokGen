'use client';

import { useState } from 'react';

export default function ProWaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/pro-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--info-bg)', border: '1px solid var(--info)', fontSize: '0.875rem', color: 'var(--info)', textAlign: 'center' }}>
        ✓ You&apos;re on the list! We&apos;ll notify you when Pro launches.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
        Join the waitlist for early access:
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '7px',
            border: '1px solid var(--info)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '7px',
            border: '1px solid var(--info)',
            background: 'var(--info-bg)',
            color: 'var(--info)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.6 : 1,
          }}
        >
          {status === 'loading' ? '...' : 'Notify me'}
        </button>
      </div>
      {status === 'error' && (
        <p style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: 0 }}>Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
