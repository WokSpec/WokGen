'use client';

// ---------------------------------------------------------------------------
// WokGen — Custom 404 Not Found page
// Matches the WokGen dark pixel-art theme.
// ---------------------------------------------------------------------------

import Link from 'next/link';
import { useEffect, useState } from 'react';

// Simple pixel-art style animated 404 display
function PixelGlitch({ text }: { text: string }) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position:   'relative',
        display:    'inline-block',
        fontFamily: '"Press Start 2P", "JetBrains Mono", monospace',
        fontSize:   'clamp(48px, 10vw, 96px)',
        fontWeight: 700,
        color:      '#41A6F6',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {/* Primary layer */}
      <span
        style={{
          display:    'block',
          textShadow: glitch
            ? '3px 0 #B13E53, -3px 0 #73EFF7'
            : '0 0 24px rgba(65,166,246,0.5)',
          transition: glitch ? 'none' : 'text-shadow 0.2s',
          transform:  glitch ? 'translateX(2px)' : 'none',
        }}
      >
        {text}
      </span>

      {/* Glitch ghost layer */}
      {glitch && (
        <span
          aria-hidden="true"
          style={{
            position:  'absolute',
            top:        0,
            left:       0,
            color:      '#EF7D57',
            opacity:    0.5,
            transform:  'translateX(-4px) translateY(2px)',
            clipPath:   'inset(30% 0 40% 0)',
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}

// Animated pixel grid decoration
function PixelScatter() {
  const dots = Array.from({ length: 24 }, (_, i) => ({
    id:    i,
    x:     (i * 37 + 13) % 100,
    y:     (i * 53 + 7)  % 100,
    size:  ((i % 4) + 1) * 4,
    delay: (i * 0.15) % 1.8,
    color: [
      '#41A6F6', '#73EFF7', '#B13E53', '#FFCD75',
      '#38B764', '#566C86', '#29366F',
    ][i % 7],
    opacity: 0.15 + (i % 5) * 0.08,
  }));

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:         0,
        overflow:      'hidden',
        pointerEvents: 'none',
      }}
    >
      {dots.map((dot) => (
        <div
          key={dot.id}
          style={{
            position:      'absolute',
            left:          `${dot.x}%`,
            top:           `${dot.y}%`,
            width:          dot.size,
            height:         dot.size,
            background:     dot.color,
            opacity:        dot.opacity,
            imageRendering: 'pixelated',
            animation:      `float ${2.5 + dot.delay}s ease-in-out ${dot.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight:      'calc(100vh - 56px)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        position:       'relative',
        overflow:       'hidden',
        padding:        '40px 24px',
        background:     'var(--surface-base, #0d0d14)',
      }}
    >
      {/* Background decoration */}
      <PixelScatter />

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        style={{
          position:        'absolute',
          inset:           0,
          backgroundImage: `
            linear-gradient(rgba(65,166,246,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(65,166,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize:  '24px 24px',
          pointerEvents:   'none',
        }}
      />

      {/* Card */}
      <div
        style={{
          position:     'relative',
          zIndex:       1,
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          textAlign:    'center',
          gap:          0,
          maxWidth:     480,
          width:        '100%',
          animation:    'fade-in 0.3s ease-out both',
        }}
      >
        {/* 404 number */}
        <PixelGlitch text="404" />

        {/* Pixel divider */}
        <div
          aria-hidden="true"
          style={{
            display:        'flex',
            gap:            4,
            marginTop:      24,
            marginBottom:   24,
            alignItems:     'center',
          }}
        >
          {[6, 4, 8, 4, 6].map((size, i) => (
            <div
              key={i}
              style={{
                width:      size,
                height:     size,
                background: i === 2 ? '#41A6F6' : '#333C57',
              }}
            />
          ))}
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
          Page Not Found
        </h1>

        {/* Subheading */}
        <p
          style={{
            marginTop:  12,
            marginBottom: 0,
            fontSize:   14,
            color:      'var(--text-muted, #566C86)',
            lineHeight: 1.6,
            maxWidth:   340,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist, has moved, or the URL
          is incorrect.
        </p>

        {/* Actions */}
        <div
          style={{
            display:    'flex',
            gap:        12,
            marginTop:  32,
            flexWrap:   'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            6,
              padding:        '9px 18px',
              borderRadius:   6,
              background:     'var(--accent, #41A6F6)',
              border:         '1px solid var(--accent, #41A6F6)',
              color:          '#0d0d14',
              fontSize:       13,
              fontWeight:     600,
              textDecoration: 'none',
              transition:     'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#73EFF7';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#73EFF7';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent, #41A6F6)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent, #41A6F6)';
            }}
          >
            ← Home
          </Link>

          <Link
            href="/studio"
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
              el.style.background   = 'var(--surface-overlay, #1a1a2e)';
              el.style.borderColor  = 'var(--accent-muted, #29366F)';
              el.style.color        = 'var(--text-primary, #F4F4F4)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background   = 'transparent';
              el.style.borderColor  = 'var(--surface-border, #252538)';
              el.style.color        = 'var(--text-secondary, #94B0C2)';
            }}
          >
            Open Studio
          </Link>
        </div>

        {/* Quick nav */}
        <nav
          aria-label="Quick navigation"
          style={{
            display:    'flex',
            gap:        4,
            marginTop:  40,
            flexWrap:   'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { href: '/gallery', label: 'Gallery' },
            { href: '/docs',    label: 'Docs'    },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding:        '5px 10px',
                borderRadius:   4,
                background:     'transparent',
                border:         '1px solid transparent',
                color:          'var(--text-muted, #566C86)',
                fontSize:       12,
                textDecoration: 'none',
                transition:     'color 0.12s, border-color 0.12s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color       = 'var(--text-primary, #F4F4F4)';
                el.style.borderColor = 'var(--surface-border, #252538)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color       = 'var(--text-muted, #566C86)';
                el.style.borderColor = 'transparent';
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
