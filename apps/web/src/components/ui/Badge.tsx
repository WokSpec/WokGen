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
    background: 'rgba(65,166,246,0.12)',
    border:     '1px solid rgba(65,166,246,0.3)',
    color:      '#41A6F6',
  },
  accent: {
    background: 'rgba(65,166,246,0.15)',
    border:     '1px solid rgba(65,166,246,0.4)',
    color:      '#73EFF7',
  },
  success: {
    background: 'rgba(56,183,100,0.12)',
    border:     '1px solid rgba(56,183,100,0.3)',
    color:      '#38B764',
  },
  warning: {
    background: 'rgba(255,205,117,0.12)',
    border:     '1px solid rgba(255,205,117,0.3)',
    color:      '#FFCD75',
  },
  danger: {
    background: 'rgba(177,62,83,0.12)',
    border:     '1px solid rgba(177,62,83,0.3)',
    color:      '#EF7D57',
  },
  muted: {
    background: 'rgba(86,108,134,0.15)',
    border:     '1px solid rgba(86,108,134,0.25)',
    color:      '#566C86',
  },
  ghost: {
    background: 'transparent',
    border:     '1px solid rgba(86,108,134,0.25)',
    color:      '#94B0C2',
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
  pending:   { variant: 'muted',   dot: '#566C86', label: 'Pending'   },
  running:   { variant: 'accent',  dot: '#41A6F6', label: 'Running'   },
  succeeded: { variant: 'success', dot: '#38B764', label: 'Done'      },
  failed:    { variant: 'danger',  dot: '#EF7D57', label: 'Failed'    },
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
