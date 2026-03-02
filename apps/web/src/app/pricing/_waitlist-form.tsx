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
      <div className="pwl-success">
        ✓ You&apos;re on the list! We&apos;ll notify you when Pro launches.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pwl-form">
      <p className="pwl-label">
        Join the waitlist for early access:
      </p>
      <div className="pwl-row">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="pwl-input"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="pwl-btn"
          data-loading={status === 'loading' || undefined}
        >
          {status === 'loading' ? '...' : 'Notify me'}
        </button>
      </div>
      {status === 'error' && (
        <p className="pwl-error">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
