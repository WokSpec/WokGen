'use client';

import { useState, useEffect } from 'react';

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

export default function FontWeightTool() {
  const [fontName, setFontName] = useState('Inter');
  const [inputFont, setInputFont] = useState('Inter');
  const [sampleText, setSampleText] = useState('The quick brown fox jumps over the lazy dog');
  const [fontSize, setFontSize] = useState(20);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const loadFont = (name: string) => {
    if (!name.trim()) return;
    const weights = WEIGHTS.join(';');
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@${weights}&display=swap`;
    const existing = document.getElementById('font-wt-link');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.id = 'font-wt-link';
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => setLoaded(true);
    document.head.appendChild(link);
    setFontName(name);
    setLoaded(false);
    setTimeout(() => setLoaded(true), 1000);
  };

  useEffect(() => {
    loadFont('Inter');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyDecl = (weight: number) => {
    const css = `font-family: '${fontName}', sans-serif;\nfont-weight: ${weight};`;
    navigator.clipboard.writeText(css);
    setCopied(weight);
    setTimeout(() => setCopied(null), 1500);
  };

  const importUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@${WEIGHTS.join(';')}&display=swap`;

  return (
    <div className="tool-panel">
      <div className="grad-controls" style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={inputFont}
            onChange={e => setInputFont(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadFont(inputFont)}
            placeholder="Google Font name…"
            style={{ flex: 1, minWidth: '180px' }}
          />
          <button className="btn-primary" onClick={() => loadFont(inputFont)}>Load Font</button>
        </div>

        <div className="grad-form-row" style={{ marginTop: '0.75rem' }}>
          <label>Sample Text</label>
          <input
            type="text"
            value={sampleText}
            onChange={e => setSampleText(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <div className="br-row" style={{ marginTop: '0.5rem' }}>
          <div className="br-row-label">
            <span>Font Size</span>
            <strong>{fontSize}px</strong>
          </div>
          <input type="range" min={12} max={48} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
        </div>
      </div>

      {!loaded && (
        <p style={{ color: 'var(--fg-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>Loading font…</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {WEIGHTS.map(w => (
          <div key={w} style={{ background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ minWidth: '90px', fontSize: '0.75rem', color: 'var(--fg-muted)', flexShrink: 0 }}>
              <strong style={{ color: 'var(--fg)' }}>{w}</strong> · {WEIGHT_NAMES[w]}
            </div>
            <div style={{
              flex: 1,
              fontFamily: `'${fontName}', sans-serif`,
              fontWeight: w,
              fontSize: `${fontSize}px`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {sampleText}
            </div>
            <button
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', flexShrink: 0 }}
              onClick={() => copyDecl(w)}
            >
              {copied === w ? '✓' : 'Copy'}
            </button>
          </div>
        ))}
      </div>

      <details style={{ marginTop: '1.5rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--fg-muted)' }}>Google Fonts @import URL</summary>
        <pre className="grad-code" style={{ marginTop: '0.5rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
          {`@import url('${importUrl}');`}
        </pre>
      </details>
    </div>
  );
}
