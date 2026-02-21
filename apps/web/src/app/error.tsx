'use client';

// ---------------------------------------------------------------------------
// WokGen — App Router error boundary
//
// Next.js App Router uses this file as the error UI for any unhandled runtime
// errors within a route segment. It receives the thrown Error and a `reset`
// function that re-renders the segment.
//
// See: https://nextjs.org/docs/app/api-reference/file-conventions/error
// ---------------------------------------------------------------------------

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Pixel-art style decorative broken icon
function BrokenPixelIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Outer frame */}
      <rect x="8"  y="8"  width="48" height="48" rx="4" fill="#1a1a2e" stroke="#252538" strokeWidth="2" />
      {/* Error X - left arm */}
      <rect x="18" y="20" width="6" height="6" fill="#B13E53" />
      <rect x="24" y="26" width="6" height="6" fill="#B13E53" />
      <rect x="30" y="32" width="6" height="6" fill="#B13E53" />
      <rect x="36" y="38" width="6" height="6" fill="#B13E53" />
      {/* Error X - right arm */}
      <rect x="36" y="20" width="6" height="6" fill="#B13E53" />
      <rect x="30" y="26" width="6" height="6" fill="#B13E53" />
      <rect x="24" y="32" width="6" height="6" fill="#B13E53" />
      <rect x="18" y="38" width="6" height="6" fill="#B13E53" />
      {/* Corner pixels for a pixel-art frame feel */}
      <rect x="8"  y="8"  width="4" height="4" fill="#252538" />
      <rect x="52" y="8"  width="4" height="4" fill="#252538" />
      <rect x="8"  y="52" width="4" height="4" fill="#252538" />
      <rect x="52" y="52" width="4" height="4" fill="#252538" />
    </svg>
  );
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Log the error to the console in development
  useEffect(() => {
    console.error('[WokGen] Unhandled runtime error:', error);
  }, [error]);

  // Derive a clean message — avoid leaking internal stack traces to users
  const message =
    error?.message && error.message.length < 200
      ? error.message
      : 'An unexpected error occurred while rendering this page.';

  const digest = error?.digest;

  return (
    <div
      role="alert"
      style={{
        minHeight:      'calc(100vh - 56px)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '40px 24px',
        background:     'var(--surface-base, #0d0d14)',
        position:       'relative',
        overflow:       'hidden',
      }}
    >
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        style={{
          position:        'absolute',
          inset:           0,
          backgroundImage: `
            linear-gradient(rgba(177,62,83,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(177,62,83,0.03) 1px, transparent 1px)
          `,
          backgroundSize:  '24px 24px',
          pointerEvents:   'none',
        }}
      />

      {/* Content card */}
      <div
        style={{
          position:      'relative',
          zIndex:        1,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          textAlign:     'center',
          maxWidth:      480,
          width:         '100%',
          gap:           0,
          animation:     'fade-in 0.25s ease-out both',
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: 20 }}>
          <BrokenPixelIcon />
        </div>

        {/* Error label chip */}
        <div
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          6,
            padding:      '4px 10px',
            borderRadius: 4,
            background:   'rgba(177,62,83,0.12)',
            border:       '1px solid rgba(177,62,83,0.3)',
            color:        '#EF7D57',
            fontSize:     11,
            fontWeight:   700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom:  16,
          }}
        >
          <span
            style={{
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   '#B13E53',
              flexShrink:   0,
            }}
          />
          Runtime Error
        </div>

        {/* Heading */}
        <h1
          style={{
            margin:     0,
            fontSize:   22,
            fontWeight: 700,
            color:      'var(--text-primary, #F4F4F4)',
            lineHeight: 1.3,
          }}
        >
          Something went wrong
        </h1>

        {/* Error message */}
        <p
          style={{
            marginTop:    12,
            marginBottom: 0,
            fontSize:     13,
            color:        'var(--text-muted, #566C86)',
            lineHeight:   1.6,
            maxWidth:     380,
          }}
        >
          {message}
        </p>

        {/* Error digest — useful for correlating server logs */}
        {digest && (
          <p
            style={{
              marginTop:   10,
              marginBottom: 0,
              fontSize:    11,
              color:       '#333C57',
              fontFamily:  '"JetBrains Mono", monospace',
            }}
          >
            Error ID:{' '}
            <span style={{ color: '#566C86' }}>{digest}</span>
          </p>
        )}

        {/* Pixel divider */}
        <div
          aria-hidden="true"
          style={{
            display:     'flex',
            gap:          4,
            marginTop:    24,
            marginBottom: 24,
            alignItems:  'center',
          }}
        >
          {[4, 6, 4, 8, 4, 6, 4].map((size, i) => (
            <div
              key={i}
              style={{
                width:      size,
                height:     size,
                background: i === 3 ? '#B13E53' : '#252538',
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div
          style={{
            display:        'flex',
            gap:            12,
            flexWrap:       'wrap',
            justifyContent: 'center',
          }}
        >
          {/* Try again */}
          <button
            onClick={reset}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            6,
              padding:        '9px 18px',
              borderRadius:   6,
              background:     'rgba(177,62,83,0.15)',
              border:         '1px solid rgba(177,62,83,0.4)',
              color:          '#EF7D57',
              fontSize:       13,
              fontWeight:     600,
              cursor:         'pointer',
              fontFamily:     'inherit',
              transition:     'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background  = 'rgba(177,62,83,0.25)';
              el.style.borderColor = 'rgba(239,125,87,0.5)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background  = 'rgba(177,62,83,0.15)';
              el.style.borderColor = 'rgba(177,62,83,0.4)';
            }}
          >
            ↺ Try again
          </button>

          {/* Go home */}
          <a
            href="/"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            6,
              padding:        '9px 18px',
              borderRadius:   6,
              background:     'transparent',
              border:         '1px solid var(--surface-border, #252538)',
              color:          'var(--text-secondary, #94B0C2)',
              fontSize:       13,
              fontWeight:     600,
              textDecoration: 'none',
              transition:     'background 0.12s, border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background  = 'var(--surface-overlay, #1a1a2e)';
              el.style.borderColor = 'var(--accent-muted, #29366F)';
              el.style.color       = 'var(--text-primary, #F4F4F4)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background  = 'transparent';
              el.style.borderColor = 'var(--surface-border, #252538)';
              el.style.color       = 'var(--text-secondary, #94B0C2)';
            }}
          >
            ← Home
          </a>
        </div>

        {/* Help text */}
        <p
          style={{
            marginTop:  28,
            marginBottom: 0,
            fontSize:   12,
            color:      '#333C57',
            lineHeight: 1.5,
          }}
        >
          If this keeps happening, check the{' '}
          <a
            href="/docs"
            style={{
              color:          '#566C86',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            docs
          </a>
          {' '}or open an issue on{' '}
          <a
            href="https://github.com/WokSpecialists/WokGen/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color:          '#566C86',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}
