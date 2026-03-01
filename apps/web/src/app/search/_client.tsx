'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TOOLS } from '@/lib/tools-registry';
import type { ToolDef } from '@/lib/tools-registry';

// ── Static data ───────────────────────────────────────────────────────────────

const SITE_PAGES = [
  { label: 'Dashboard',      href: '/dashboard',          desc: 'Workspace overview' },
  { label: 'Gallery',        href: '/gallery',             desc: 'Community creations' },
  { label: 'Tools',          href: '/tools',               desc: 'Image & creative tools' },
  { label: 'Pricing',        href: '/pricing',             desc: 'Free forever plans' },
  { label: 'Docs',           href: '/docs',                desc: 'Documentation & guides' },
  { label: 'Changelog',      href: '/changelog',           desc: 'Latest updates' },
  { label: 'Community',      href: '/community',           desc: 'Join the community' },
  { label: 'Pixel Studio',   href: '/pixel/studio',        desc: 'Generate pixel art' },
  { label: 'Vector Studio',  href: '/vector/studio',       desc: 'Generate vector graphics' },
  { label: 'Brand Studio',   href: '/business/studio',     desc: 'Generate brand assets' },
  { label: 'UI/UX Studio',   href: '/uiux/studio',         desc: 'Generate UI mockups' },
  { label: 'Voice Studio',   href: '/voice/studio',        desc: 'Generate voice audio' },
  { label: 'Prompt Lab',     href: '/prompt-lab',          desc: 'Craft and test prompts' },
  { label: 'Settings',       href: '/settings',            desc: 'Account settings' },
  { label: 'API Keys',       href: '/account/api-keys',    desc: 'Manage API keys' },
  { label: 'Open Source',    href: '/open-source',         desc: 'Models & licenses' },
  { label: 'Support',        href: '/support',             desc: 'Support the project' },
];

const SUGGESTED = ['pixel art', 'logo', 'background remover', 'vector', 'UI mockup', 'voice'];

// ── Component ─────────────────────────────────────────────────────────────────

interface SearchClientProps {
  initialQuery: string;
}

export function SearchClient({ initialQuery }: SearchClientProps) {
  const router               = useRouter();
  const [query, setQuery]    = useState(initialQuery);
  const [, startTransition]  = useTransition();
  const inputRef             = useRef<HTMLInputElement>(null);
  const debounceRef          = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounced URL sync
  const updateUrl = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
        router.replace(`/search${params}`, { scroll: false });
      });
    }, 200);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    updateUrl(v);
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase();

  const toolResults: ToolDef[] = q
    ? TOOLS.filter(
        t =>
          t.status !== 'soon' &&
          (t.label.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))),
      ).slice(0, 5)
    : [];

  const pageResults = q
    ? SITE_PAGES.filter(
        p => p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q),
      ).slice(0, 6)
    : [];

  const hasResults = toolResults.length > 0 || pageResults.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="search-page">

      {/* Hero search bar */}
      <div className="search-hero">
        <div className="search-input-hero-wrap">
          <svg className="search-input-hero__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            className="search-input-hero"
            placeholder="Search tools, pages, prompts…"
            value={query}
            onChange={handleChange}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search WokGen"
          />
          {query && (
            <button
              className="search-input-hero__clear"
              onClick={() => { setQuery(''); updateUrl(''); inputRef.current?.focus(); }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="search-results">

        {/* Suggestions when no query */}
        {!q && (
          <div className="search-suggested">
            <p className="search-section__label">Try searching for</p>
            <div className="search-suggested__chips">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  className="search-chip"
                  onClick={() => { setQuery(s); updateUrl(s); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {q && !hasResults && (
          <div className="search-empty">
            <p className="search-empty__title">No results for &ldquo;{query}&rdquo;</p>
            <div className="search-suggested__chips">
              {SUGGESTED.map(s => (
                <button key={s} className="search-chip" onClick={() => { setQuery(s); updateUrl(s); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tools section */}
        {toolResults.length > 0 && (
          <section className="search-section">
            <h2 className="search-section__label">Tools</h2>
            <div className="search-section__list">
              {toolResults.map(t => (
                <Link key={t.id} href={t.href} className="search-result search-result--tool">
                  <span className="search-result__icon" aria-hidden="true">{t.icon}</span>
                  <div className="search-result__body">
                    <span className="search-result__label">{t.label}</span>
                    <span className="search-result__desc">{t.description}</span>
                  </div>
                  {t.isNew && (
                    <span className="search-result__badge search-result__badge--new">New</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick links section */}
        {pageResults.length > 0 && (
          <section className="search-section">
            <h2 className="search-section__label">Quick Links</h2>
            <div className="search-section__list">
              {pageResults.map(p => (
                <Link key={p.href} href={p.href} className="search-result">
                  <div className="search-result__body">
                    <span className="search-result__label">{p.label}</span>
                    <span className="search-result__desc">{p.desc}</span>
                  </div>
                  <span className="search-result__arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
