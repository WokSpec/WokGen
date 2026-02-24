'use client';

import { useState } from 'react';

interface ScrapeResult {
  links: Array<{ url: string; text: string; type: 'internal' | 'external' }>;
  images: Array<{ url: string; alt: string }>;
  meta: Record<string, string>;
  title: string;
  description: string;
}

type Tab = 'links' | 'images' | 'meta';

export default function LinkScraperTool() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('links');
  const [filter, setFilter] = useState('');

  async function handleScrape() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/tools/link-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scrape');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function copyAll(items: string[]) {
    navigator.clipboard.writeText(items.join('\n'));
  }

  function exportJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scraped-data.json';
    a.click();
  }

  const filteredLinks = result?.links.filter(l =>
    !filter || l.url.toLowerCase().includes(filter.toLowerCase()) || l.text.toLowerCase().includes(filter.toLowerCase())
  ) ?? [];

  const filteredImages = result?.images.filter(i =>
    !filter || i.url.toLowerCase().includes(filter.toLowerCase())
  ) ?? [];

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Link Scraper</h1>
        <p className="tool-page-desc">Extract all links, images, and metadata from any public webpage.</p>
      </div>

      <div className="tool-section">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="url"
            className="tool-input"
            placeholder="https://example.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScrape()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleScrape} disabled={loading || !url.trim()}>
            {loading ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
      </div>

      {error && <div className="tool-error">{error}</div>}

      {result && (
        <div className="tool-section">
          {result.title && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{result.title}</div>
              {result.description && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{result.description}</div>}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            {(['links', 'images', 'meta'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setActiveTab(t); setFilter(''); }}
                style={{
                  padding: '0.375rem 0.875rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '0.8125rem', fontWeight: 500, transition: 'all 150ms',
                  background: activeTab === t ? 'rgba(167,139,250,0.12)' : 'transparent',
                  color: activeTab === t ? '#a78bfa' : 'var(--text-secondary)',
                }}
              >
                {t === 'links' ? `Links (${result.links.length})` : t === 'images' ? `Images (${result.images.length})` : 'Meta'}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }} onClick={exportJson}>Export JSON</button>
              {activeTab === 'links' && (
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }} onClick={() => copyAll(result.links.map(l => l.url))}>Copy URLs</button>
              )}
            </div>
          </div>

          {/* Filter */}
          {(activeTab === 'links' || activeTab === 'images') && (
            <input
              type="search"
              className="tool-input"
              placeholder="Filter..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}
            />
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '480px', overflowY: 'auto' }}>
              {filteredLinks.map((link, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '3px', background: link.type === 'internal' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: link.type === 'internal' ? '#34d399' : '#f87171', flexShrink: 0 }}>
                    {link.type === 'internal' ? 'INT' : 'EXT'}
                  </span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textDecoration: 'none' }}>{link.url}</a>
                  {link.text && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{link.text.slice(0, 30)}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {filteredImages.map((img, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt || ''} style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} loading="lazy" />
                  <a href={img.url} target="_blank" rel="noopener noreferrer" download style={{ display: 'block', padding: '0.375rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                    {img.url.split('/').pop()?.split('?')[0] || 'image'}
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Meta Tab */}
          {activeTab === 'meta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {Object.entries(result.meta).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', flexShrink: 0, minWidth: '140px' }}>{k}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
