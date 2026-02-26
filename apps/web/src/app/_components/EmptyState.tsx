'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon = '✦', title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        marginBottom: '4px',
      }}>
        {icon}
      </div>
      <div style={{ maxWidth: '360px' }}>
        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
          {title}
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
          {action && (
            action.href ? (
              <Link href={action.href} style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}>
                {action.label}
              </Link>
            ) : (
              <button onClick={action.onClick} style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href} style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: 400,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}>
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
