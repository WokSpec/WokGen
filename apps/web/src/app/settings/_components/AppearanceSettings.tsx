'use client';
import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

export function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('wokgen-theme') as Theme | null;
    setTheme(stored || 'dark');
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('wokgen-theme', t);
    const resolved =
      t === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : t;
    document.documentElement.setAttribute('data-theme', resolved);
  };

  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'var(--surface-card)' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Appearance</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }}>Theme</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Choose how WokGen looks to you.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['dark', 'light', 'system'] as Theme[]).map(t => (
            <button type="button"
              key={t}
              onClick={() => applyTheme(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                border: `1px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
                background: theme === t ? 'var(--accent-subtle, rgba(129,140,248,0.1))' : 'transparent',
                color: theme === t ? 'var(--accent)' : 'var(--text-secondary, var(--text-muted))',
                fontSize: '0.8125rem',
                fontWeight: theme === t ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
