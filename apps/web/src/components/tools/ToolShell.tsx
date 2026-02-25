'use client';

import Link from 'next/link';

interface ToolShellProps {
  id: string;
  label: string;
  description: string;
  icon: string;
  children?: React.ReactNode;
  /** When true, show a "Coming Soon" banner instead of children */
  comingSoon?: boolean;
}

/**
 * ToolShell — wrapper for every tool page.
 * Provides consistent breadcrumb, header, and layout.
 * Renders children when the tool is implemented, or a "Coming Soon" state.
 */
export default function ToolShell({
  id,
  label,
  description,
  icon,
  children,
  comingSoon,
}: ToolShellProps) {
  return (
    <div className="tool-shell">
      {/* Breadcrumb */}
      <nav className="tool-shell-breadcrumb" aria-label="Breadcrumb">
        <Link href="/tools" className="tool-shell-bc-link">← Tools</Link>
        <span className="tool-shell-bc-sep" aria-hidden="true">/</span>
        <span className="tool-shell-bc-current">{label}</span>
      </nav>

      {/* Header */}
      <header className="tool-shell-header">
        <div className="tool-shell-icon" aria-hidden="true">
          <span
            className="tool-shell-icon-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 6,
              background: '#111827',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 12,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {String(icon).trim().slice(0, 3)}
          </span>
        </div>
        <div className="tool-shell-header-text">
          <h1 className="tool-shell-title">{label}</h1>
          <p className="tool-shell-desc">{description}</p>
        </div>
      </header>

      {/* Body */}
      <div className="tool-shell-body">
        {comingSoon || !children ? (
          <div className="tool-shell-soon">
            <h2 className="tool-shell-soon-title">Coming Soon</h2>
            <p className="tool-shell-soon-desc">
              This tool is in development. Check back soon or{' '}
              <a
                href={`https://github.com/WokSpec/WokGen/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-link"
              >
                request a feature on GitHub
              </a>
              .
            </p>
            <Link href="/tools" className="btn-primary tool-shell-back-btn">
              ← Back to Tools
            </Link>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
