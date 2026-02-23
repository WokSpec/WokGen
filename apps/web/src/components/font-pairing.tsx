'use client';

import { useState, useEffect } from 'react';

interface FontPair {
  heading: string;
  body: string;
  description: string;
}

type BrandStyle = 'minimal' | 'bold' | 'elegant' | 'playful' | 'corporate';

const FONT_PAIRS: Record<BrandStyle, FontPair[]> = {
  minimal: [
    { heading: 'Inter', body: 'Inter', description: 'Clean system-inspired' },
    { heading: 'DM Sans', body: 'DM Mono', description: 'Modern minimal' },
    { heading: 'Outfit', body: 'Outfit', description: 'Geometric neutral' },
  ],
  bold: [
    { heading: 'Space Grotesk', body: 'Space Mono', description: 'Technical bold' },
    { heading: 'Syne', body: 'Syne Mono', description: 'Experimental strong' },
    { heading: 'Plus Jakarta Sans', body: 'Manrope', description: 'Modern confident' },
  ],
  elegant: [
    { heading: 'Playfair Display', body: 'Lato', description: 'Classic editorial' },
    { heading: 'Cormorant Garamond', body: 'Proza Libre', description: 'Luxury serif' },
    { heading: 'DM Serif Display', body: 'DM Sans', description: 'Contemporary editorial' },
  ],
  playful: [
    { heading: 'Nunito', body: 'Nunito', description: 'Friendly rounded' },
    { heading: 'Righteous', body: 'Nunito Sans', description: 'Fun display' },
    { heading: 'Fredoka One', body: 'Quicksand', description: 'Approachable soft' },
  ],
  corporate: [
    { heading: 'IBM Plex Sans', body: 'IBM Plex Mono', description: 'Technical precise' },
    { heading: 'Source Sans 3', body: 'Source Code Pro', description: 'Readable neutral' },
    { heading: 'Roboto', body: 'Roboto Mono', description: 'Universal standard' },
  ],
};

const STYLES: { id: BrandStyle; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'bold', label: 'Bold' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'playful', label: 'Playful' },
  { id: 'corporate', label: 'Corporate' },
];

function googleFontsUrl(heading: string, body: string): string {
  const families = [heading, body]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

function injectFont(heading: string, body: string) {
  const url = googleFontsUrl(heading, body);
  const id = `gf-${heading.replace(/ /g, '-')}-${body.replace(/ /g, '-')}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
}

function cssOutput(pair: FontPair): string {
  const url = googleFontsUrl(pair.heading, pair.body);
  return `@import url('${url}');\n\n:root {\n  --font-heading: '${pair.heading}', sans-serif;\n  --font-body: '${pair.body}', sans-serif;\n}`;
}

interface Props {
  brandStyle?: string;
}

export function FontPairing({ brandStyle }: Props) {
  const defaultStyle: BrandStyle =
    (brandStyle as BrandStyle) && FONT_PAIRS[brandStyle as BrandStyle]
      ? (brandStyle as BrandStyle)
      : 'minimal';

  const [activeStyle, setActiveStyle] = useState<BrandStyle>(defaultStyle);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const pairs = FONT_PAIRS[activeStyle];

  useEffect(() => {
    // Pre-load fonts for the active style
    pairs.forEach(p => injectFont(p.heading, p.body));
  }, [activeStyle, pairs]);

  const copyCss = (pair: FontPair, idx: number) => {
    navigator.clipboard.writeText(cssOutput(pair)).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Style tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {STYLES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStyle(s.id)}
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: 3,
              border: '1px solid',
              borderColor: activeStyle === s.id ? 'var(--accent-muted)' : 'var(--surface-border)',
              background: activeStyle === s.id ? 'var(--accent-dim)' : 'transparent',
              color: activeStyle === s.id ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: activeStyle === s.id ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Font pair cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pairs.map((pair, idx) => (
          <div
            key={idx}
            onMouseEnter={() => injectFont(pair.heading, pair.body)}
            style={{
              background: 'var(--surface-base, #111122)',
              border: '1px solid var(--surface-border)',
              borderRadius: 6,
              padding: '10px 12px',
            }}
          >
            {/* Heading preview */}
            <div
              style={{
                fontFamily: `'${pair.heading}', sans-serif`,
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              Aa {pair.heading}
            </div>
            {/* Body preview */}
            <div
              style={{
                fontFamily: `'${pair.body}', sans-serif`,
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Body: {pair.body} — {pair.description}
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className="btn-ghost btn-xs"
                onClick={() => copyCss(pair, idx)}
                style={{ fontSize: '0.68rem' }}
              >
                {copiedIdx === idx ? 'Copied' : 'Copy CSS'}
              </button>
              <a
                href={`https://fonts.google.com/specimen/${pair.heading.replace(/ /g, '+')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.68rem', color: 'var(--accent)', textDecoration: 'none' }}
              >
                Google Fonts ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
