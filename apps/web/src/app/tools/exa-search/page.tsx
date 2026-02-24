'use client';
import { useState } from 'react';

export default function ExaSearchPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'neural' | 'keyword' | 'auto'>('neural');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function search() {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const res = await fetch('/api/tools/exa-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type: searchType, numResults: 8, includeText: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || data.message || 'Search failed'); return; }
      setResults(data.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Exa Semantic Search</h1>
        <p className="tool-page-desc">Neural web search that understands meaning, not just keywords. Find recent research, articles, and content with natural language queries.</p>
      </div>
      <div className="tool-section">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. latest advancements in diffusion models 2024"
            style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['neural', 'keyword', 'auto'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSearchType(t)}
                style={{
                  padding: '0.5rem 0.875rem', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid var(--border)',
                  background: searchType === t ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: searchType === t ? '#a78bfa' : 'var(--text-secondary)',
                  cursor: 'pointer', textTransform: 'capitalize', fontWeight: searchType === t ? 600 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button onClick={search} disabled={loading || !query.trim()} className="btn btn-primary" style={{ padding: '0.625rem 1.25rem' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {results.map((r, i) => (
              <div key={i} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#a78bfa', textDecoration: 'none', display: 'block', marginBottom: '0.375rem' }}>{r.title || r.url}</a>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {r.publishedDate ? new Date(r.publishedDate).toLocaleDateString() : ''} {r.author ? `· ${r.author}` : ''}
                </div>
                {r.text && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{r.text.slice(0, 300)}{r.text.length > 300 ? '...' : ''}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
