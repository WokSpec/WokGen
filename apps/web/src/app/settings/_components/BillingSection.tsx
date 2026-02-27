'use client';
import { useState } from 'react';

export default function BillingSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not open billing portal.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'var(--surface-card)' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>Billing</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Manage your subscription, invoices, and payment methods via the Stripe billing portal.
      </p>
      {error && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>{error}</p>
      )}
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'var(--accent)',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-on-accent, #fff)',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: 'inherit',
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Opening…' : 'Manage Billing →'}
      </button>
    </section>
  );
}
