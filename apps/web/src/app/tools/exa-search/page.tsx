'use client';
import { useState } from 'react';

export default function ExaSearchPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'neural' | 'keyword' | 'auto'>('neural');
  const [dateFilter, setDateFilter] = useState<'any' | 'week' | 'month' | 'year'>('any');
  const [typeFilter, setTypeFilter] = useState<'all' | 'news' | 'research' | 'tweet'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  function getStartDate(filter: typeof dateFilter) {
    if (filter === 'any') return undefined;
    const d = new Date();
    if (filter === 'week') d.setDate(d.getDate() - 7);
    else if (filter === 'month') d.setMonth(d.getMonth() - 1);
    else if (filter === 'year') d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
  }

  async function search() {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const res = await fetch('/api/tools/exa-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query, type: searchType, numResults: 8, includeText: true,
          startPublishedDate: getStartDate(dateFilter),
          category: typeFilter === 'all' ? undefined : typeFilter === 'research' ? 'research paper' : typeFilter,
        }),
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

  function exportResults() {
    if (!results.length) return;
    const md = results.map(r => `## ${r.title || r.url}\n${r.url}\n\n${r.text || ''}\n`).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'search-results.md'; a.click();
    URL.revokeObjectURL(url);
  }

  function getHostname(url: string) {
    try { return new URL(url).hostname; } catch { return url; }
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
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value as typeof dateFilter)}
            style={{ fontSize: '0.8125rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.375rem 0.625rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <option value="any">Any time</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
            <option value="year">Past year</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
            style={{ fontSize: '0.8125rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.375rem 0.625rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <option value="all">All types</option>
            <option value="news">News</option>
            <option value="research">Research</option>
            <option value="tweet">Social</option>
          </select>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}
        {results.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button onClick={exportResults} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}>Export MD</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.map((r, i) => (
                <div key={i} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#a78bfa', textDecoration: 'none', display: 'block', marginBottom: '0.375rem' }}>{r.title || r.url}</a>
                  {/* Domain + favicon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.375rem' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getHostname(r.url)}&sz=16`}
                      alt="" width={12} height={12}
                      style={{ opacity: 0.5 }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span>{getHostname(r.url)}</span>
                    {r.publishedDate && <span>· {new Date(r.publishedDate).toLocaleDateString()}</span>}
                    {r.author && <span>· {r.author}</span>}
                  </div>
                  {r.text && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.5rem' }}>{r.text.slice(0, 300)}{r.text.length > 300 ? '...' : ''}</p>}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${r.title || ''}\n${r.url}`)}
                      style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                    >
                      Copy link
                    </button>
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.6)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.3)')}
                    >
                      Open ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
