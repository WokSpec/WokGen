'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';
import { TOOLS, TAG_LABELS } from '@/lib/tools-registry';
import type { ToolTag, ToolDef } from '@/lib/tools-registry';
import TutorialOverlay, { useTutorial, TOOLS_TUTORIAL } from '@/components/TutorialOverlay';

const SIDEBAR_CATEGORIES: Array<{ tag: ToolTag | null; label: string }> = [
  { tag: null,       label: 'All Tools' },
  { tag: 'image',   label: 'Image' },
  { tag: 'design',  label: 'Design' },
  { tag: 'dev',     label: 'Dev Tools' },
  { tag: 'gamedev', label: 'Game Dev' },
  { tag: 'audio',   label: 'Audio' },
  { tag: 'crypto',  label: '₿ Crypto/Web3' },
  { tag: 'collab',  label: 'Collab' },
];

function countForTag(tag: ToolTag | null) {
  return tag ? TOOLS.filter(t => t.tags.includes(tag)).length : TOOLS.length;
}

// ---------------------------------------------------------------------------
// ToolCard
// ---------------------------------------------------------------------------

interface ToolCardProps {
  tool: ToolDef;
  starred: boolean;
  onStar: (id: string, e: React.MouseEvent) => void;
  onVisit: (id: string) => void;
}

function ToolCard({ tool, starred, onStar, onVisit }: ToolCardProps) {
  return (
    <Link href={tool.href} className="toolhub-card" onClick={() => onVisit(tool.id)}>
      <div className="toolhub-card-top">
        <span className="toolhub-card-icon" aria-hidden="true">{tool.icon}</span>
        <div className="toolhub-card-top-right">
          {tool.isNew && <span className="toolhub-card-badge">New</span>}
          <button
            className="toolhub-card-star"
            onClick={e => onStar(tool.id, e)}
            title={starred ? 'Remove from starred' : 'Star this tool'}
            aria-label={starred ? 'Unstar' : 'Star'}
          >
            {starred ? '★' : '☆'}
          </button>
        </div>
      </div>
      <div className="toolhub-card-body">
        <div className="toolhub-card-name">{tool.label}</div>
        <p className="toolhub-card-desc">{tool.description}</p>
        <div className="toolhub-card-tags">
          {tool.tags.map(tag => (
            <span key={tag} className="toolhub-card-tag">{TAG_LABELS[tag]}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ToolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [activeTag, setActiveTag] = useState<ToolTag | null>(() => (searchParams.get('category') as ToolTag | null) ?? null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);

  const { active: tutActive, start: startTut, complete: completeTut, skip: skipTut } = useTutorial(TOOLS_TUTORIAL, false);

  // Hydrate localStorage
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('toolhub-recent') ?? '[]');
      const s = JSON.parse(localStorage.getItem('toolhub-starred') ?? '[]');
      setRecentIds(Array.isArray(r) ? r : []);
      setStarredIds(Array.isArray(s) ? s : []);
    } catch { /* ignore */ }
  }, []);

  // URL sync
  const syncUrl = useCallback((tag: ToolTag | null, q: string) => {
    const params = new URLSearchParams();
    if (tag) params.set('category', tag);
    if (q.trim()) params.set('q', q.trim());
    const qs = params.toString();
    router.replace(qs ? `/tools?${qs}` : '/tools', { scroll: false });
  }, [router]);

  const handleCategoryChange = (tag: ToolTag | null) => {
    setActiveTag(tag);
    syncUrl(tag, search);
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    syncUrl(activeTag, q);
  };

  const toggleStar = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('toolhub-starred', JSON.stringify(next));
      return next;
    });
  }, []);

  const trackRecent = useCallback((id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 10);
      localStorage.setItem('toolhub-recent', JSON.stringify(next));
      return next;
    });
  }, []);

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

  const recentTools = recentIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is ToolDef => t !== undefined)
    .slice(0, 3);

  const starredTools = starredIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is ToolDef => t !== undefined);

  const cardProps = { starred: false, onStar: toggleStar, onVisit: trackRecent };

  return (
    <main className="toolhub-layout">
      {tutActive && (
        <TutorialOverlay tutorial={TOOLS_TUTORIAL} onComplete={completeTut} onSkip={skipTut} />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="toolhub-sidebar">
        <div className="toolhub-sidebar-title">Categories</div>
        {SIDEBAR_CATEGORIES.map(({ tag, label }) => (
          <button
            key={tag ?? 'all'}
            className={`toolhub-sidebar-item${activeTag === tag ? ' --active' : ''}`}
            onClick={() => handleCategoryChange(tag)}
          >
            <span>{label}</span>
            <span className="toolhub-sidebar-count">{countForTag(tag)}</span>
          </button>
        ))}
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="toolhub-content">
        {/* Search */}
        <div className="toolhub-search-wrap">
          <input
            className="toolhub-search"
            type="search"
            placeholder="Search tools…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Recently Used */}
        {recentTools.length > 0 && (
          <section className="toolhub-section">
            <h2 className="toolhub-section-title">Recently Used</h2>
            <div className="toolhub-grid">
              {recentTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} {...cardProps} starred={starredIds.includes(tool.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Starred */}
        {starredTools.length > 0 && (
          <section className="toolhub-section">
            <h2 className="toolhub-section-title">Starred</h2>
            <div className="toolhub-grid">
              {starredTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} {...cardProps} starred={true} />
              ))}
            </div>
          </section>
        )}

        {/* Main grid */}
        <section className="toolhub-section">
          <h2 className="toolhub-section-title">
            {activeTag ? TAG_LABELS[activeTag] : 'All Tools'}
            <span className="toolhub-section-count">{filtered.length}</span>
          </h2>

          {filtered.length === 0 ? (
            <div className="toolhub-empty">
              <p>No tools match &ldquo;{search}&rdquo;</p>
              <button className="btn-ghost" onClick={() => { handleSearchChange(''); handleCategoryChange(null); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="toolhub-grid">
              {filtered.map(tool => (
                <ToolCard key={tool.id} tool={tool} {...cardProps} starred={starredIds.includes(tool.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="toolhub-footer">
          <p>
            All tools are free forever.{' '}
            <Link href="/support" className="toolhub-footer-link">Support the project →</Link>
          </p>
          <p>
            Missing a tool?{' '}
            <a href="https://github.com/WokSpec/WokGen/issues" target="_blank" rel="noopener noreferrer" className="toolhub-footer-link">
              Request it on GitHub
            </a>
            {' · '}
            <button
              className="toolhub-footer-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={startTut}
            >
              ? Take a tour
            </button>
          </p>
        </footer>
      </div>
    </main>
  );
}
