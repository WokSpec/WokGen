'use client';
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
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: '#fca5a5', fontSize: 14, fontWeight: 500 }}>
          {error.message}
        </p>
        {error.hint && (
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 12 }}>
            {error.hint}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            style={{
              fontSize: 12, color: '#818cf8', background: 'none', border: '1px solid #818cf8',
              borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        )}
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
