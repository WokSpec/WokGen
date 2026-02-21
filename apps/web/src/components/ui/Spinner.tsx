'use client';

// ---------------------------------------------------------------------------
// WokGen — Spinner UI component
//
// Usage:
//   <Spinner />
//   <Spinner size="sm" />
//   <Spinner size="lg" color="#FFCD75" />
// ---------------------------------------------------------------------------

import type { CSSProperties } from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<SpinnerSize, number> = {
  xs:  12,
  sm:  16,
  md:  20,
  lg:  28,
  xl:  40,
};

const BORDER_MAP: Record<SpinnerSize, number> = {
  xs:  1.5,
  sm:  2,
  md:  2,
  lg:  2.5,
  xl:  3,
};

interface SpinnerProps {
  size?:      SpinnerSize | number;
  color?:     string;
  className?: string;
  style?:     CSSProperties;
  label?:     string;
}

export function Spinner({
  size    = 'md',
  color   = 'var(--accent, #41A6F6)',
  className,
  style,
  label   = 'Loading…',
}: SpinnerProps) {
  const dim    = typeof size === 'number' ? size : SIZE_MAP[size];
  const border = typeof size === 'number'
    ? Math.max(1.5, Math.round(dim / 10))
    : BORDER_MAP[size];

  return (
    <span
      role="status"
      aria-label={label}
      className={className}
      style={{
        display:      'inline-block',
        width:        dim,
        height:       dim,
        borderRadius: '50%',
        border:       `${border}px solid rgba(255,255,255,0.12)`,
        borderTopColor: color,
        animation:    'spin 0.7s linear infinite',
        flexShrink:   0,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// SpinnerOverlay — full-panel centered spinner with optional message
// ---------------------------------------------------------------------------
interface SpinnerOverlayProps {
  message?: string;
  size?:    SpinnerSize;
}

export function SpinnerOverlay({ message, size = 'lg' }: SpinnerOverlayProps) {
  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            12,
        padding:        32,
      }}
    >
      <Spinner size={size} />
      {message && (
        <p
          style={{
            fontSize:  13,
            color:     'var(--text-muted, #566C86)',
            margin:    0,
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default Spinner;
