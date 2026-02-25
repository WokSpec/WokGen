'use client';

import { useState } from 'react';

export default function WebsitePaletteTool() {
  const [input, setInput] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const extract = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setColors([]); setDone(false);
    try {
      const res = await fetch('/api/tools/website-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed'); return; }
      setColors(json.colors ?? []);
      setDone(true);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const copy = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 1200);
    });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(colors.join('\n')).then(() => {
      setCopied('all');
      setTimeout(() => setCopied(null), 1200);
    });
  };

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Website Palette</h1>
        <p className="tool-page-desc">Extract all color values from any website&apos;s HTML and inline styles.</p>
      </div>

      <div className="tool-section">
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="tool-input"
            style={{ flex: 1 }}
            placeholder="https://example.com"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && extract()}
          />
          <button className="btn btn-primary" onClick={extract} disabled={loading}>
            {loading ? <><span style={{marginRight:8}}>⏳</span>Extracting...</> : 'Extract'}
          </button>
        </div>
        {error && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13 }}>{error.includes('Network') ? 'Network error — check your connection and try again.' : error}</div>}
      </div>

      {done && colors.length === 0 && (
        <div className="tool-section">
          <p style={{ color: 'var(--text-muted)' }}>No colors found.</p>
        </div>
      )}

      {colors.length > 0 && (
        <div className="tool-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
              {colors.length} color{colors.length > 1 ? 's' : ''} found
            </h2>
            <button className="btn" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={copyAll}>
              {copied === 'all' ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
            {colors.map((hex) => (
              <button
                key={hex}
                onClick={() => copy(hex)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 8,
                  padding: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 6, background: hex, border: '1px solid rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: copied === hex ? '#34d399' : 'var(--text-secondary)' }}>
                  {copied === hex ? 'Copied' : hex}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
