'use client';

import { useState } from 'react';

interface OgData {
  tags: Record<string, string>;
  url: string;
}

export default function OgAnalyzerTool() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<OgData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch('/api/tools/og-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed'); return; }
      setData(json);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const tags = data?.tags ?? {};
  const title = tags['og:title'] || tags['_title'] || '—';
  const desc = tags['og:description'] || tags['twitter:description'] || '';
  const image = tags['og:image'] || tags['twitter:image'] || tags['twitter:image:src'] || '';
  const siteName = tags['og:site_name'] || '';

  const ogEntries = Object.entries(tags).filter(([k]) => k.startsWith('og:') || k.startsWith('twitter:') || k === '_title');

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">OG Analyzer</h1>
        <p className="tool-page-desc">Fetch any URL and inspect its Open Graph and Twitter meta tags.</p>
      </div>

      <div className="tool-section">
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="tool-input"
            style={{ flex: 1 }}
            placeholder="https://example.com"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyze()}
          />
          <button className="btn btn-primary" onClick={analyze} disabled={loading}>
            {loading ? 'Fetching...' : 'Analyze'}
          </button>
        </div>
        {error && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13 }}>{error.includes('Network') ? 'Network error — check your connection and try again.' : error}</div>}
      </div>

      {data && (
        <>
          <div className="tool-section">
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>Social Preview</h2>
            <div className="card" style={{ maxWidth: 500, overflow: 'hidden', padding: 0 }}>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="OG" style={{ width: '100%', aspectRatio: '1200/630', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: '12px 16px' }}>
                {siteName && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{siteName}</p>}
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{title}</p>
                {desc && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>}
              </div>
            </div>
          </div>

          <div className="tool-section">
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>Meta Tags ({ogEntries.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ogEntries.map(([key, value]) => (
                <div key={key} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 12px' }}>
                  <code style={{ fontSize: 11, color: '#818cf8', minWidth: 180, flexShrink: 0 }}>{key}</code>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
