'use client';

import { useState } from 'react';

interface FaviconEntry {
  url: string;
  rel: string;
  sizes?: string;
  type?: string;
}

export default function FaviconExtractorTool() {
  const [input, setInput] = useState('');
  const [favicons, setFavicons] = useState<FaviconEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const extract = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setFavicons([]); setDone(false);
    try {
      const res = await fetch('/api/tools/favicon-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed'); return; }
      setFavicons(json.favicons ?? []);
      setDone(true);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Favicon Extractor</h1>
        <p className="tool-page-desc">Extract all favicon variants from any domain or URL.</p>
      </div>

      <div className="tool-section">
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="tool-input"
            style={{ flex: 1 }}
            placeholder="https://github.com"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && extract()}
          />
          <button className="btn btn-primary" onClick={extract} disabled={loading}>
            {loading ? <><span style={{marginRight:8}}>⏳</span>Fetching...</> : 'Extract'}
          </button>
        </div>
        {error && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13 }}>{error.includes('Network') ? 'Network error — check your connection and try again.' : error}</div>}
      </div>

      {done && favicons.length === 0 && (
        <div className="tool-section">
          <p style={{ color: 'var(--text-muted)' }}>No favicons found.</p>
        </div>
      )}

      {favicons.length > 0 && (
        <div className="tool-section">
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-muted)' }}>
            Found {favicons.length} favicon{favicons.length > 1 ? 's' : ''}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {favicons.map((fav, i) => (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fav.url}
                  alt={fav.rel}
                  style={{ width: 48, height: 48, objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ textAlign: 'center', width: '100%' }}>
                  {fav.sizes && <p style={{ fontSize: 11, color: '#818cf8', marginBottom: 2 }}>{fav.sizes}</p>}
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{fav.rel}</p>
                </div>
                <a
                  href={fav.url}
                  download
                  className="btn"
                  style={{ fontSize: 11, padding: '4px 10px', width: '100%', textAlign: 'center', textDecoration: 'none' }}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
