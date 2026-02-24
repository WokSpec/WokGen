'use client';

import { useState, useEffect, useMemo } from 'react';

// Curated font pairings
interface FontPair {
  heading: { name: string; weights: number[] };
  body: { name: string; weights: number[] };
  label: string;
  style: string;
}

const FONT_PAIRS: FontPair[] = [
  { label: 'Modern & Clean', style: 'Tech / SaaS', heading: { name: 'Space Grotesk', weights: [700] }, body: { name: 'Inter', weights: [400, 600] } },
  { label: 'Editorial', style: 'Blog / Magazine', heading: { name: 'Playfair Display', weights: [700, 900] }, body: { name: 'Source Serif 4', weights: [400] } },
  { label: 'Friendly & Casual', style: 'Startup', heading: { name: 'Nunito', weights: [800] }, body: { name: 'Nunito', weights: [400, 600] } },
  { label: 'Bold & Impactful', style: 'Brand / Landing', heading: { name: 'Oswald', weights: [700] }, body: { name: 'Lato', weights: [400] } },
  { label: 'Classic Elegance', style: 'Luxury / Fashion', heading: { name: 'Cormorant Garamond', weights: [600] }, body: { name: 'Jost', weights: [300, 500] } },
  { label: 'Minimal Swiss', style: 'Design Portfolio', heading: { name: 'DM Sans', weights: [700] }, body: { name: 'DM Sans', weights: [400] } },
  { label: 'Humanist', style: 'Education / Health', heading: { name: 'Raleway', weights: [700] }, body: { name: 'Merriweather', weights: [400] } },
  { label: 'Code & Tech', style: 'Developer Tools', heading: { name: 'JetBrains Mono', weights: [700] }, body: { name: 'Fira Code', weights: [400] } },
  { label: 'Creative & Quirky', style: 'Agency / Creative', heading: { name: 'Righteous', weights: [400] }, body: { name: 'Poppins', weights: [400, 500] } },
  { label: 'Solid & Trustworthy', style: 'Finance / Legal', heading: { name: 'IBM Plex Serif', weights: [700] }, body: { name: 'IBM Plex Sans', weights: [400] } },
];

function getGoogleFontUrl(pairs: FontPair[]) {
  const families = new Map<string, Set<number>>();
  pairs.forEach(p => {
    if (!families.has(p.heading.name)) families.set(p.heading.name, new Set());
    p.heading.weights.forEach(w => families.get(p.heading.name)!.add(w));
    if (!families.has(p.body.name)) families.set(p.body.name, new Set());
    p.body.weights.forEach(w => families.get(p.body.name)!.add(w));
  });

  const params = [...families.entries()].map(([name, weights]) => {
    const ws = [...weights].sort().join(';');
    return `family=${encodeURIComponent(name)}:wght@${ws}`;
  }).join('&');

  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export default function FontPairerTool() {
  const [selected, setSelected] = useState<number>(0);
  const [customText, setCustomText] = useState('The quick brown fox jumps over the lazy dog. Create anything. Free forever.');
  const [headingText, setHeadingText] = useState('Create Anything');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load all Google Fonts
  useEffect(() => {
    const url = getGoogleFontUrl(FONT_PAIRS);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => setFontsLoaded(true);
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const pair = FONT_PAIRS[selected];

  const css = useMemo(() => `/* ${pair.label} */
--font-heading: '${pair.heading.name}', sans-serif;
--font-body: '${pair.body.name}', sans-serif;

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: ${pair.heading.weights[pair.heading.weights.length - 1]};
}

body, p, li, td {
  font-family: var(--font-body);
  font-weight: ${pair.body.weights[0]};
}`, [pair]);

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="font-pairer">
      <div className="font-pairer-layout">
        {/* Pair selector */}
        <div className="font-pair-list">
          {FONT_PAIRS.map((p, i) => (
            <button
              key={i}
              className={`font-pair-item${selected === i ? ' active' : ''}`}
              onClick={() => setSelected(i)}
            >
              <span className="font-pair-item-label">{p.label}</span>
              <span className="font-pair-item-style">{p.style}</span>
              <span className="font-pair-item-names" style={{ fontFamily: `'${p.heading.name}', sans-serif` }}>
                {p.heading.name}
              </span>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="font-pair-preview">
          {!fontsLoaded && (
            <div className="tool-processing" style={{padding:'1rem'}}>
              <p className="tool-processing-label">Loading fonts…</p>
            </div>
          )}

          <div className="font-preview-controls">
            <input
              className="tool-input"
              value={headingText}
              onChange={e => setHeadingText(e.target.value)}
              placeholder="Heading text…"
            />
            <textarea
              className="json-textarea"
              rows={3}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              style={{ fontFamily: `'${pair.body.name}', sans-serif`, fontSize: '0.9rem' }}
            />
          </div>

          {/* Live preview */}
          <div className="font-preview-box">
            <div className="font-preview-meta">
              <span>{pair.label}</span>
              <span className="font-pair-item-style">{pair.style}</span>
            </div>

            <h1 className="font-preview-h1" style={{ fontFamily: `'${pair.heading.name}', sans-serif`, fontWeight: pair.heading.weights[pair.heading.weights.length - 1] }}>
              {headingText}
            </h1>
            <h2 className="font-preview-h2" style={{ fontFamily: `'${pair.heading.name}', sans-serif`, fontWeight: pair.heading.weights[0] }}>
              Subheading in {pair.heading.name}
            </h2>
            <p className="font-preview-body" style={{ fontFamily: `'${pair.body.name}', sans-serif`, fontWeight: pair.body.weights[0] }}>
              {customText}
            </p>
            <p className="font-preview-body-sm" style={{ fontFamily: `'${pair.body.name}', sans-serif` }}>
              Body ({pair.body.name}) pairs with heading ({pair.heading.name})
            </p>
          </div>

          {/* Font info */}
          <div className="font-info-grid">
            <div className="font-info-card">
              <p className="font-info-role">Heading</p>
              <p className="font-info-name" style={{ fontFamily: `'${pair.heading.name}', sans-serif` }}>{pair.heading.name}</p>
              <p className="font-info-weights">Weights: {pair.heading.weights.join(', ')}</p>
              <a
                href={`https://fonts.google.com/specimen/${pair.heading.name.replace(/ /g, '+')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-link"
                style={{ fontSize: '0.8rem' }}
              >
                View on Google Fonts →
              </a>
            </div>
            <div className="font-info-card">
              <p className="font-info-role">Body</p>
              <p className="font-info-name" style={{ fontFamily: `'${pair.body.name}', sans-serif` }}>{pair.body.name}</p>
              <p className="font-info-weights">Weights: {pair.body.weights.join(', ')}</p>
              <a
                href={`https://fonts.google.com/specimen/${pair.body.name.replace(/ /g, '+')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tool-link"
                style={{ fontSize: '0.8rem' }}
              >
                View on Google Fonts →
              </a>
            </div>
          </div>

          {/* CSS output */}
          <div className="css-gen-output">
            <div className="json-panel-header">
              <span className="json-panel-label">CSS</span>
              <button className="btn-ghost-xs" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
            </div>
            <pre className="css-gen-code">{css}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
