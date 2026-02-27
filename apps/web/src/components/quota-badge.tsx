'use client';

import Link from 'next/link';
import { useQuota } from '@/hooks/use-quota';

/**
 * QuotaBadge — small inline pill showing daily generation usage.
 *
 * Free / guest:  "3 / 10 today"
 * Paid tiers:    "Unlimited"
 * At limit:      red pill + "Upgrade for unlimited" CTA
 *
 * Shows nothing while loading.
 */
export function QuotaBadge() {
  const { isLoading, used, limit, remaining, tier } = useQuota();

  if (isLoading || used === undefined || limit === undefined || remaining === undefined) {
    return null;
  }

  const isUnlimited = limit === -1;
  const atLimit     = !isUnlimited && remaining === 0;

  // Base pill styles
  const basePill: React.CSSProperties = {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           4,
    fontSize:      10,
    fontWeight:    600,
    lineHeight:    1,
    whiteSpace:    'nowrap',
    userSelect:    'none',
    padding:       '3px 7px',
    borderRadius:  4,
    letterSpacing: '0.03em',
  };

  if (isUnlimited) {
    return (
      <span
        title="Daily standard generation limit. Resets at midnight UTC."
        style={{
          ...basePill,
          background: 'var(--success-bg)',
          border:     '1px solid var(--success-glow)',
          color:      'var(--success)',
        }}
      >
        Unlimited
      </span>
    );
  }

  if (atLimit) {
    return (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        title="Daily standard generation limit. Resets at midnight UTC."
      >
        <span
          style={{
            ...basePill,
            background: 'var(--danger-bg)',
            border:     '1px solid var(--danger-border)',
            color:      'var(--danger)',
          }}
        >
          {used} / {limit} today
        </span>
        <Link
          href="/pricing"
          style={{
            fontSize:       10,
            fontWeight:     600,
            color:          'var(--blue)',
            textDecoration: 'none',
            whiteSpace:     'nowrap',
          }}
          title="Upgrade for unlimited generations"
        >
          Upgrade ↗
        </Link>
      </span>
    );
  }

  return (
    <span
      title="Daily standard generation limit. Resets at midnight UTC."
      style={{
        ...basePill,
        background: 'var(--surface-raised)',
        border:     '1px solid var(--border)',
        color:      'var(--text-muted, #94B0C2)',
      }}
    >
      {used} / {limit} today
    </span>
  );
}
