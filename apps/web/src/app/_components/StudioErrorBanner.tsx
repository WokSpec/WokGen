'use client';
import { WarningIcon } from '@/app/_components/icons';
import type { StudioError } from '@/lib/studio-errors';

interface Props {
  error: StudioError | null;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function StudioErrorBanner({ error, onDismiss, onRetry }: Props) {
  if (!error) return null;

  return (
    <div style={{
      background: 'var(--danger-bg)',
      border: '1px solid var(--danger-border)',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <WarningIcon size={16} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: 'var(--danger)', fontSize: 14, fontWeight: 500 }}>
          {error.message}
        </p>
        {error.hint && (
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
            {error.hint}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {error.retryable && onRetry && (
          <button type="button"
            onClick={onRetry}
            style={{
              fontSize: 12, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)',
              borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        )}
        <button type="button"
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
