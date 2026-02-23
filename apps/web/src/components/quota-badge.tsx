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
          background: 'rgba(56,183,100,0.12)',
          border:     '1px solid rgba(56,183,100,0.3)',
          color:      '#38B764',
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
            background: 'rgba(177,62,83,0.15)',
            border:     '1px solid rgba(177,62,83,0.35)',
            color:      '#EF7D57',
          }}
        >
          {used} / {limit} today
        </span>
        <Link
          href="/pricing"
          style={{
            fontSize:       10,
            fontWeight:     600,
            color:          '#41A6F6',
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
        background: 'rgba(86,108,134,0.15)',
        border:     '1px solid rgba(86,108,134,0.25)',
        color:      'var(--text-muted, #94B0C2)',
      }}
    >
      {used} / {limit} today
    </span>
  );
}
