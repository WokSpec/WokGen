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
    <section className="appear-section">
      <h2 className="appear-heading">Appearance</h2>
      <div className="appear-row">
        <div>
          <p className="appear-label">Theme</p>
          <p className="appear-desc">Choose how WokGen looks to you.</p>
        </div>
        <div className="appear-swatches">
          {(['dark', 'light', 'system'] as Theme[]).map(t => (
            <button type="button"
              key={t}
              onClick={() => applyTheme(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                border: `1px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
                background: theme === t ? 'var(--accent-subtle)' : 'transparent',
                color: theme === t ? 'var(--accent)' : 'var(--text-secondary)',
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
