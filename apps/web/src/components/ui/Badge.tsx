'use client';

// ---------------------------------------------------------------------------
// WokGen — Badge UI component
//
// Usage:
//   <Badge>Common</Badge>
//   <RarityBadge rarity="legendary" />
//   <ProviderBadge provider="replicate" />
// ---------------------------------------------------------------------------

import type { CSSProperties, ReactNode } from 'react';
import { RARITY_CONFIG, PROVIDER_DISPLAY, getRarityConfig, getProviderDisplay } from '@/lib/utils';
import type { Rarity, ProviderDisplayKey } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Base Badge
// ---------------------------------------------------------------------------

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'ghost';

const VARIANT_STYLES: Record<BadgeVariant, CSSProperties> = {
  default: {
    background: 'var(--info-bg)',
    border:     '1px solid var(--info-bg)',
    color:      'var(--blue)',
  },
  accent: {
    background: 'var(--info-bg)',
    border:     '1px solid var(--info-bg)',
    color:      'var(--teal)',
  },
  success: {
    background: 'var(--success-bg)',
    border:     '1px solid var(--success-glow)',
    color:      'var(--success)',
  },
  warning: {
    background: 'var(--warning-bg)',
    border:     '1px solid var(--warning-bg)',
    color:      'var(--yellow)',
  },
  danger: {
    background: 'var(--danger-bg)',
    border:     '1px solid var(--danger-border)',
    color:      'var(--danger)',
  },
  muted: {
    background: 'var(--surface-raised)',
    border:     '1px solid var(--border)',
    color:      'var(--text-muted)',
  },
  ghost: {
    background: 'transparent',
    border:     '1px solid var(--border)',
    color:      'var(--text-secondary)',
  },
};

export type BadgeSize = 'xs' | 'sm' | 'md';

const SIZE_STYLES: Record<BadgeSize, CSSProperties> = {
  xs: { fontSize: 9,  padding: '1px 5px',  borderRadius: 3, letterSpacing: '0.04em' },
  sm: { fontSize: 10, padding: '2px 6px',  borderRadius: 4, letterSpacing: '0.04em' },
  md: { fontSize: 11, padding: '3px 8px',  borderRadius: 5, letterSpacing: '0.03em' },
};

interface BadgeProps {
  children:   ReactNode;
  variant?:   BadgeVariant;
  size?:      BadgeSize;
  /** Hex or CSS color to override the variant color */
  color?:     string;
  /** Hex or CSS color to override the variant background */
  bg?:        string;
  className?: string;
  style?:     CSSProperties;
  uppercase?: boolean;
}

export function Badge({
  children,
  variant   = 'default',
  size      = 'sm',
  color,
  bg,
  className,
  style,
  uppercase = false,
}: BadgeProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle    = SIZE_STYLES[size];

  return (
    <span
      className={className}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           4,
        fontWeight:    600,
        lineHeight:    1,
        whiteSpace:    'nowrap',
        userSelect:    'none',
        textTransform: uppercase ? 'uppercase' : undefined,
        ...variantStyle,
        ...sizeStyle,
        ...(color ? { color }      : {}),
        ...(bg    ? { background: bg } : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// RarityBadge — coloured badge for item rarity tiers
// ---------------------------------------------------------------------------

interface RarityBadgeProps {
  rarity:     string | null | undefined;
  size?:      BadgeSize;
  showDot?:   boolean;
  className?: string;
  style?:     CSSProperties;
}

export function RarityBadge({
  rarity,
  size      = 'sm',
  showDot   = true,
  className,
  style,
}: RarityBadgeProps) {
  const cfg   = getRarityConfig(rarity);
  const label = cfg.label;

  return (
    <Badge
      size={size}
      uppercase
      color={cfg.color}
      bg={cfg.bg}
      className={className}
      style={{
        border: `1px solid ${cfg.border}`,
        ...style,
      }}
    >
      {showDot && (
        <span
          aria-hidden="true"
          style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   cfg.color,
            flexShrink:   0,
          }}
        />
      )}
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// ProviderBadge — coloured dot + name badge for AI providers
// ---------------------------------------------------------------------------

interface ProviderBadgeProps {
  provider:   string;
  size?:      BadgeSize;
  showDot?:   boolean;
  showLabel?: boolean;
  className?: string;
  style?:     CSSProperties;
}

export function ProviderBadge({
  provider,
  size      = 'sm',
  showDot   = true,
  showLabel = true,
  className,
  style,
}: ProviderBadgeProps) {
  const display = getProviderDisplay(provider);

  return (
    <Badge
      size={size}
      color={display.color}
      bg={`${display.color}18`}
      className={className}
      style={{
        border: `1px solid ${display.color}30`,
        ...style,
      }}
    >
      {showDot && (
        <span
          aria-hidden="true"
          style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   display.color,
            flexShrink:   0,
          }}
        />
      )}
      {showLabel && display.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge — job lifecycle status indicator
// ---------------------------------------------------------------------------

type JobStatus = 'pending' | 'running' | 'succeeded' | 'failed' | string;

const STATUS_CONFIG: Record<
  string,
  { variant: BadgeVariant; dot: string; label: string }
> = {
  pending:   { variant: 'muted',   dot: 'var(--text-muted)',  label: 'Pending'   },
  running:   { variant: 'accent',  dot: 'var(--blue)',        label: 'Running'   },
  succeeded: { variant: 'success', dot: 'var(--success)',     label: 'Done'      },
  failed:    { variant: 'danger',  dot: 'var(--danger)',      label: 'Failed'    },
};

interface StatusBadgeProps {
  status:     JobStatus;
  size?:      BadgeSize;
  animate?:   boolean;   // pulse the dot for running state
  className?: string;
}

export function StatusBadge({
  status,
  size    = 'sm',
  animate = true,
  className,
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { variant: 'muted' as BadgeVariant, dot: '#566C86', label: status };
  const isPulsing = animate && status === 'running';

  return (
    <Badge variant={cfg.variant} size={size} className={className}>
      <span
        aria-hidden="true"
        style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   cfg.dot,
          flexShrink:   0,
          animation:    isPulsing ? 'pulse-glow 1.4s ease-in-out infinite' : undefined,
        }}
      />
      {cfg.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Re-export all rarity/provider constants for convenience
// ---------------------------------------------------------------------------
export { RARITY_CONFIG, PROVIDER_DISPLAY };
export type { Rarity, ProviderDisplayKey };

export default Badge;
