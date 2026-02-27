'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'var(--success-bg)', border: 'var(--success)', icon: 'ok' },
  error:   { bg: 'var(--danger-bg)',  border: 'var(--danger)', icon: 'x' },
  info:    { bg: 'var(--info-bg)', border: 'var(--info)', icon: 'i' },
  warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', icon: '!' },
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++counter.current}`;
    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      return next.slice(-3); // max 3 visible
    });
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((m: string) => toast(m, 'success'), [toast]);
  const error   = useCallback((m: string) => toast(m, 'error'),   [toast]);
  const info    = useCallback((m: string) => toast(m, 'info'),    [toast]);
  const warning = useCallback((m: string) => toast(m, 'warning'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast stack */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const c = TOAST_COLORS[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 1rem',
                borderRadius: '0.625rem',
                border: `1px solid ${c.border}40`,
                background: c.bg,
                backdropFilter: 'blur(12px)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                maxWidth: '22rem',
                boxShadow: 'var(--shadow-md)',
                pointerEvents: 'all',
                animation: 'toast-in 0.2s ease-out',
              }}
            >
              <span style={{ color: c.border, fontSize: '0.875rem', lineHeight: 1, flexShrink: 0 }}>
                {c.icon}
              </span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  padding: '0 0 0 0.25rem',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
