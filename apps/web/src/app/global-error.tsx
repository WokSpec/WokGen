'use client';

// ---------------------------------------------------------------------------
// WokGen — Global Error Boundary
//
// This is the root-level error boundary for Next.js App Router.
// It catches errors that occur in the root layout (layout.tsx) itself —
// errors that the per-segment error.tsx cannot catch.
//
// Unlike error.tsx, global-error.tsx must render its own <html> and <body>
// tags because it replaces the entire root layout when active.
//
// See: https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
// ---------------------------------------------------------------------------

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[WokGen] Global unhandled error:', error);
  }, [error]);

  const message =
    error?.message && error.message.length < 200
      ? error.message
      : 'A critical error occurred. The application could not render.';

  const digest = error?.digest;

  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error · WokGen</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

              html, body {
                height: 100%;
                background: #0d0d14;
                color: #F4F4F4;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
                             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
              }

              @keyframes fade-in {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: translateY(0); }
              }

              @keyframes spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }

              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.4; }
              }

              .container {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 24px;
                position: relative;
                overflow: hidden;
              }

              .bg-grid {
                position: absolute;
                inset: 0;
                background-image:
                  linear-gradient(rgba(177,62,83,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(177,62,83,0.04) 1px, transparent 1px);
                background-size: 24px 24px;
                pointer-events: none;
              }

              .card {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                max-width: 480px;
                width: 100%;
                animation: fade-in 0.3s ease-out both;
              }

              .icon-frame {
                width: 72px;
                height: 72px;
                border-radius: 12px;
                background: rgba(177,62,83,0.10);
                border: 2px solid rgba(177,62,83,0.25);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                font-size: 32px;
              }

              .chip {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 4px;
                background: rgba(177,62,83,0.12);
                border: 1px solid rgba(177,62,83,0.3);
                color: #EF7D57;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                margin-bottom: 16px;
              }

              .dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #B13E53;
                flex-shrink: 0;
                animation: pulse 1.4s ease-in-out infinite;
              }

              h1 {
                font-size: 22px;
                font-weight: 700;
                color: #F4F4F4;
                line-height: 1.3;
                margin-bottom: 12px;
              }

              .message {
                font-size: 13px;
                color: #566C86;
                line-height: 1.6;
                max-width: 380px;
                margin-bottom: 8px;
              }

              .digest {
                font-size: 11px;
                color: #333C57;
                font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
                margin-bottom: 0;
              }

              .digest span {
                color: #566C86;
              }

              .divider {
                display: flex;
                gap: 4px;
                margin: 24px 0;
                align-items: center;
              }

              .px {
                background: #252538;
              }

              .px-accent {
                background: #B13E53;
              }

              .actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                justify-content: center;
              }

              .btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 9px 18px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
                text-decoration: none;
                transition: background 0.12s, border-color 0.12s, color 0.12s;
                border: 1px solid transparent;
                outline: none;
              }

              .btn-danger {
                background: rgba(177,62,83,0.15);
                border-color: rgba(177,62,83,0.4);
                color: #EF7D57;
              }

              .btn-danger:hover {
                background: rgba(177,62,83,0.25);
                border-color: rgba(239,125,87,0.5);
              }

              .btn-secondary {
                background: transparent;
                border-color: #252538;
                color: #94B0C2;
              }

              .btn-secondary:hover {
                background: #1a1a2e;
                border-color: #29366F;
                color: #F4F4F4;
              }

              .help {
                margin-top: 28px;
                font-size: 12px;
                color: #333C57;
                line-height: 1.5;
              }

              .help a {
                color: #566C86;
                text-underline-offset: 2px;
              }

              .help a:hover {
                color: #94B0C2;
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="container">
          {/* Background grid */}
          <div className="bg-grid" aria-hidden="true" />

          <div className="card" role="alert">
            {/* Pixel art broken icon */}
            <div className="icon-frame" aria-hidden="true">
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ imageRendering: 'pixelated' }}
              >
                {/* X mark in pixel style */}
                <rect x="6"  y="6"  width="6" height="6" fill="#B13E53" />
                <rect x="12" y="12" width="6" height="6" fill="#B13E53" />
                <rect x="18" y="18" width="6" height="6" fill="#B13E53" />
                <rect x="24" y="24" width="6" height="6" fill="#B13E53" />
                <rect x="24" y="6"  width="6" height="6" fill="#B13E53" />
                <rect x="18" y="12" width="6" height="6" fill="#B13E53" />
                <rect x="12" y="18" width="6" height="6" fill="#B13E53" />
                <rect x="6"  y="24" width="6" height="6" fill="#B13E53" />
              </svg>
            </div>

            {/* Status chip */}
            <div className="chip">
              <span className="dot" />
              Critical Error
            </div>

            <h1>WokGen crashed</h1>

            <p className="message">{message}</p>

            {digest && (
              <p className="digest">
                Error ID: <span>{digest}</span>
              </p>
            )}

            {/* Pixel divider */}
            <div className="divider" aria-hidden="true">
              {[4, 6, 4, 8, 4, 6, 4].map((size, i) => (
                <div
                  key={i}
                  className={i === 3 ? 'px-accent' : 'px'}
                  style={{ width: size, height: size }}
                />
              ))}
            </div>

            <div className="actions">
              <button className="btn btn-danger" onClick={reset}>
                ↺ Try again
              </button>
              <a className="btn btn-secondary" href="/">
                ← Home
              </a>
            </div>

            <p className="help">
              If this keeps happening, check{' '}
              <a
                href="https://github.com/WokSpecialists/WokGen/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub issues
              </a>
              {' '}or{' '}
              <a href="/docs">
                the docs
              </a>
              .
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
