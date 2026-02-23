'use client';

import { useState } from 'react';

interface Props {
  mode: string;
  accent?: string;
}

export function WaitlistForm({ mode, accent = '#a78bfa' }: Props) {
  const [email,     setEmail]     = useState('');
  const [honeypot,  setHoneypot]  = useState('');
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg,  setErrorMsg]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    if (honeypot) return; // silently discard bot submissions
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mode }),
      });
      if (res.ok) {
        setStatus('done');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? 'Something went wrong. Try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        background: `rgba(${hexToRgb(accent)}, 0.08)`,
        border: `1px solid rgba(${hexToRgb(accent)}, 0.3)`,
        borderRadius: 6,
        fontSize: '0.875rem',
        color: accent,
        fontWeight: 500,
      }}>
        <span>{'\u2713'}</span>
        <span>You&apos;re on the list! We&apos;ll notify you when {mode} launches.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxWidth: 420 }}>
      {/* Honeypot: hidden from humans, visible to bots */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            flex: 1,
            minWidth: 200,
            padding: '0.6rem 0.875rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = accent; }}
          onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '0.6rem 1.25rem',
            background: accent,
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: status === 'loading' ? 'wait' : 'pointer',
            opacity: status === 'loading' ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
        </button>
      </div>
      {status === 'error' && (
        <p style={{ fontSize: '0.8rem', color: '#f87171', margin: 0 }}>
          {errorMsg}
        </p>
      )}
    </form>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
