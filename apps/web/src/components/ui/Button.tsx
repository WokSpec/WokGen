'use client';

// ---------------------------------------------------------------------------
// WokGen — Button UI component
//
// Usage:
//   <Button>Click me</Button>
//   <Button variant="secondary" size="sm">Cancel</Button>
//   <Button variant="danger" loading>Deleting…</Button>
//   <Button variant="ghost" icon={<TrashIcon />} iconOnly aria-label="Delete" />
// ---------------------------------------------------------------------------

import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type CSSProperties } from 'react';
import { Spinner } from './Spinner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'outline'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const BASE_STYLE: CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            6,
  fontWeight:     600,
  fontFamily:     'inherit',
  borderRadius:   6,
  border:         '1px solid transparent',
  cursor:         'pointer',
  whiteSpace:     'nowrap',
  userSelect:     'none',
  textDecoration: 'none',
  transition:     'background 0.12s, color 0.12s, border-color 0.12s, opacity 0.12s, box-shadow 0.12s',
  lineHeight:     1,
  outline:        'none',
  position:       'relative',
  flexShrink:     0,
};

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background:  'var(--accent)',
    borderColor: 'var(--accent)',
    color:       'var(--text-on-accent, #0d0d14)',
  },
  secondary: {
    background:  'var(--surface-overlay, #1a1a2e)',
    borderColor: 'var(--surface-border, #252538)',
    color:       'var(--text-primary, #F4F4F4)',
  },
  ghost: {
    background:  'transparent',
    borderColor: 'transparent',
    color:       'var(--text-muted, #566C86)',
  },
  danger: {
    background:  'var(--danger-bg)',
    borderColor: 'var(--danger-border)',
    color:       'var(--danger)',
  },
  success: {
    background:  'var(--success-bg)',
    borderColor: 'var(--success-glow)',
    color:       'var(--success)',
  },
  outline: {
    background:  'transparent',
    borderColor: 'var(--surface-border, #252538)',
    color:       'var(--text-secondary, #94B0C2)',
  },
  link: {
    background:  'transparent',
    borderColor: 'transparent',
    color:       'var(--accent)',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
};

const VARIANT_HOVER_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background:  'var(--accent-hover, #73EFF7)',
    borderColor: 'var(--accent-hover, #73EFF7)',
    color:       'var(--text-on-accent, #0d0d14)',
  },
  secondary: {
    background:  'var(--surface-hover, #1e1e30)',
    borderColor: 'var(--accent-muted, #29366F)',
    color:       'var(--text-primary, #F4F4F4)',
  },
  ghost: {
    background:  'var(--surface-overlay, #1a1a2e)',
    borderColor: 'transparent',
    color:       'var(--text-primary, #F4F4F4)',
  },
  danger: {
    background:  'var(--danger-bg)',
    borderColor: 'var(--danger-border)',
    color:       'var(--danger)',
  },
  success: {
    background:  'var(--success-bg)',
    borderColor: 'var(--success-glow)',
    color:       'var(--success)',
  },
  outline: {
    background:  'var(--surface-overlay, #1a1a2e)',
    borderColor: 'var(--accent-muted, #29366F)',
    color:       'var(--text-primary, #F4F4F4)',
  },
  link: {
    background:  'transparent',
    borderColor: 'transparent',
    color:       'var(--accent-hover, #73EFF7)',
  },
};

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  xs: { fontSize: 11, padding: '4px 8px',   borderRadius: 4, gap: 4 },
  sm: { fontSize: 12, padding: '6px 12px',  borderRadius: 5, gap: 5 },
  md: { fontSize: 13, padding: '8px 16px',  borderRadius: 6, gap: 6 },
  lg: { fontSize: 14, padding: '10px 20px', borderRadius: 7, gap: 7 },
};

const ICON_ONLY_SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  xs: { width: 24, height: 24, padding: 0, borderRadius: 4 },
  sm: { width: 28, height: 28, padding: 0, borderRadius: 5 },
  md: { width: 34, height: 34, padding: 0, borderRadius: 6 },
  lg: { width: 40, height: 40, padding: 0, borderRadius: 7 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  /** Icon element placed before children (or alone if iconOnly) */
  icon?:      ReactNode;
  /** Icon element placed after children */
  iconRight?: ReactNode;
  /** Render as icon-only button (square, no label) */
  iconOnly?:  boolean;
  /** Override inline styles */
  sx?:        CSSProperties;
  /** Full width block button */
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant   = 'secondary',
      size      = 'md',
      loading   = false,
      icon,
      iconRight,
      iconOnly  = false,
      sx,
      fullWidth = false,
      disabled,
      children,
      style,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    const computedStyle: CSSProperties = {
      ...BASE_STYLE,
      ...VARIANT_STYLES[variant],
      ...SIZE_STYLES[size],
      ...(iconOnly ? ICON_ONLY_SIZE_STYLES[size] : {}),
      ...(fullWidth ? { width: '100%' } : {}),
      ...(isDisabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
      ...style,
      ...sx,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        const target = e.currentTarget;
        const hoverStyle = VARIANT_HOVER_STYLES[variant];
        if (hoverStyle.background)   target.style.background   = hoverStyle.background as string;
        if (hoverStyle.borderColor)  target.style.borderColor  = hoverStyle.borderColor as string;
        if (hoverStyle.color)        target.style.color        = hoverStyle.color as string;
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        const target = e.currentTarget;
        const baseStyle = VARIANT_STYLES[variant];
        target.style.background   = baseStyle.background as string ?? '';
        target.style.borderColor  = baseStyle.borderColor as string ?? '';
        target.style.color        = baseStyle.color as string ?? '';
      }
      onMouseLeave?.(e);
    };

    const spinnerColor =
      variant === 'primary'
        ? 'var(--text-on-accent, #0d0d14)'
        : variant === 'danger'
        ? 'var(--danger)'
        : variant === 'success'
        ? 'var(--success)'
        : 'var(--accent)';

    const spinnerSize = size === 'xs' ? 'xs' : size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs';

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={computedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...rest}
      >
        {loading ? (
          <Spinner size={spinnerSize} color={spinnerColor} />
        ) : (
          icon && <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
        )}

        {!iconOnly && children && (
          <span>{children}</span>
        )}

        {!loading && iconRight && !iconOnly && (
          <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>
        )}
      </button>
    );
  },
);

// ---------------------------------------------------------------------------
// ButtonGroup — renders a row of joined buttons
// ---------------------------------------------------------------------------

interface ButtonGroupProps {
  children:   ReactNode;
  size?:      ButtonSize;
  className?: string;
  style?:     CSSProperties;
}

export function ButtonGroup({ children, size: _size, className, style }: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={className}
      style={{
        display:  'inline-flex',
        alignItems: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IconButton — shorthand for icon-only ghost button
// ---------------------------------------------------------------------------

export interface IconButtonProps
  extends Omit<ButtonProps, 'iconOnly' | 'children'> {
  icon:       ReactNode;
  label:      string;   // required for accessibility
}

export function IconButton({ icon, label, variant = 'ghost', size = 'sm', ...rest }: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      iconOnly
      aria-label={label}
      title={label}
      {...rest}
    />
  );
}

export default Button;
