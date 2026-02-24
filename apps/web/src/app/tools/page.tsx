'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { TOOLS, TAG_LABELS } from '@/lib/tools-registry';
import type { ToolTag } from '@/lib/tools-registry';

const ALL_TAGS: ToolTag[] = ['image', 'design', 'dev', 'gamedev', 'pdf', 'text', 'crypto', 'audio', 'collab'];

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------

export default function ToolsPage() {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<ToolTag | null>(null);

  const filtered = useMemo(() => {
    let list = TOOLS;
    if (activeTag) list = list.filter(t => t.tags.includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q))
      );
    }
    return list;
  }, [search, activeTag]);

  const liveTags = ALL_TAGS.filter(tag =>
    TOOLS.some(t => t.tags.includes(tag))
  );

  return (
    <main className="tools-hub-page">
      {/* Hero */}
      <section className="tools-hub-hero">
        <div className="tools-hub-hero-inner">
          <div className="tools-hub-badge">Free · Browser-native · Private</div>
          <h1 className="tools-hub-title">Creator Tools</h1>
          <p className="tools-hub-subtitle">
            {TOOLS.length} free tools for creators, developers, and game devs.
            <br />Most run entirely in your browser — no upload, no account needed.
          </p>

          {/* Search */}
          <div className="tools-hub-search-wrap">
            <input
              className="tools-hub-search"
              type="search"
              placeholder="Search tools…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Tag filter */}
          <div className="tools-hub-tags">
            <button
              className={`tools-tag-chip${activeTag === null ? ' active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              All ({TOOLS.length})
            </button>
            {liveTags.map(tag => (
              <button
                key={tag}
                className={`tools-tag-chip${activeTag === tag ? ' active' : ''}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {TAG_LABELS[tag]} ({TOOLS.filter(t => t.tags.includes(tag)).length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="tools-hub-grid-section">
        <div className="tools-hub-grid">
          {filtered.length === 0 ? (
            <div className="tools-hub-empty">
              <p>No tools match &ldquo;{search}&rdquo;</p>
              <button className="btn-ghost" onClick={() => { setSearch(''); setActiveTag(null); }}>
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map(tool => (
              <Link key={tool.id} href={tool.href} className="tool-card">
                <div className="tool-card-icon" aria-hidden="true">{tool.icon}</div>
                <div className="tool-card-body">
                  <div className="tool-card-header">
                    <span className="tool-card-label">{tool.label}</span>
                    {tool.status === 'beta' && <span className="tool-card-badge beta">Beta</span>}
                    {tool.status === 'soon' && <span className="tool-card-badge soon">Soon</span>}
                    {tool.clientOnly && (
                      <span className="tool-card-badge private" title="Runs in your browser — no data uploaded">
                        🔒 Private
                      </span>
                    )}
                  </div>
                  <p className="tool-card-desc">{tool.description}</p>
                  <div className="tool-card-tags">
                    {tool.tags.map(tag => (
                      <span key={tag} className="tool-tag">{TAG_LABELS[tag]}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="tools-hub-footer-cta">
        <p className="tools-hub-footer-text">
          All tools are free forever.{' '}
          <Link href="/support" className="tools-hub-footer-link">Support the project →</Link>
        </p>
        <p className="tools-hub-footer-sub">
          Missing a tool?{' '}
          <a href="https://github.com/WokSpec/WokGen/issues" target="_blank" rel="noopener noreferrer" className="tools-hub-footer-link">
            Request it on GitHub
          </a>
        </p>
      </section>
    </main>
  );
}
