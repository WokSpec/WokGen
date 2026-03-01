'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// WokGen Command Palette — Cmd+K / Ctrl+K
// Keyboard-driven navigation for power users.
// ---------------------------------------------------------------------------

interface SearchResult {
  id:        string;
  prompt:    string;
  mode:      string;
  resultUrl: string;
}

const NAV_COMMANDS = [
  { id: 'nav-pixel',    label: 'Pixel Studio',         href: '/pixel/studio',         group: 'Modes'    },
  { id: 'nav-business', label: 'Business Studio',      href: '/business/studio',      group: 'Modes'    },
  { id: 'nav-vector',   label: 'Vector Studio',        href: '/vector/studio',        group: 'Modes'    },
  { id: 'nav-voice',    label: 'Voice Studio',         href: '/voice/studio',         group: 'Modes'    },
  { id: 'nav-uiux',     label: 'UI/UX Studio',         href: '/uiux/studio',          group: 'Modes'    },
  { id: 'nav-gallery',  label: 'Community Gallery',    href: '/gallery',              group: 'Platform' },
  { id: 'nav-projects', label: 'Projects',             href: '/projects',             group: 'Platform' },
  { id: 'nav-brand',    label: 'Brand Kits',           href: '/brand',                group: 'Platform' },
  { id: 'nav-eral',     label: 'Eral',              href: '/eral',                 group: 'Platform' },
  { id: 'nav-simulate', label: 'Agent Simulate',       href: '/eral/simulate',    group: 'Platform' },
  { id: 'nav-automate', label: 'Automations',          href: '/automations',      group: 'Platform' },
  { id: 'nav-docs',     label: 'Documentation',        href: '/docs',             group: 'Platform' },
  { id: 'nav-settings', label: 'Notification Settings', href: '/settings',        group: 'Account'  },
  { id: 'nav-apikeys',  label: 'API Keys',             href: '/account/api-keys', group: 'Account'  },
  { id: 'nav-tools',    label: 'Tools',                href: '/tools',            group: 'Platform' },
  { id: 'nav-pricing',  label: 'Open Source Models',  href: '/pricing',          group: 'Platform' },
  { id: 'nav-changelog',label: 'Changelog',            href: '/changelog',        group: 'Platform' },
  { id: 'prompt-lab',   label: 'Prompt Lab',           href: '/prompt-lab',       group: 'Platform' },
  { id: 'notifications',label: 'Notifications',        href: '/notifications',    group: 'Platform' },
  { id: 'tool-upscale',     label: '4× Upscaler',        href: '/tools/upscale',     group: 'Tools' },
  { id: 'tool-interrogate', label: 'Image Interrogator',  href: '/tools/interrogate', group: 'Tools' },
  { id: 'tool-music',       label: 'Music Generator',     href: '/tools/music',       group: 'Tools' },
  { id: 'tool-sfx',         label: 'SFX Library',         href: '/tools/sfx',         group: 'Tools' },
  { id: 'tool-assets',      label: 'Asset Library',       href: '/tools/assets',      group: 'Tools' },
  { id: 'tool-palette',     label: 'Color Palette',       href: '/tools/palette',     group: 'Tools' },
  { id: 'nav-admin',      label: 'Admin Dashboard', href: '/admin',           group: 'Admin'    },
  { id: 'nav-admin-metrics', label: 'Admin Metrics', href: '/admin/metrics',  group: 'Admin'    },
  { id: 'nav-admin-jobs',    label: 'Job Queues',    href: '/admin/jobs',     group: 'Admin'    },
];

export default function CommandPalette() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Toggle on Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Search assets when query is long enough
  useEffect(() => {
    if (!query || query.length < 3) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/gallery/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json().catch(() => ({}));
        setResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const runCommand = useCallback((href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  }, [router]);

  if (!open) return null;

  // Filter nav commands by query and role
  const isAdmin = (session?.user as { id?: string; isAdmin?: boolean } | undefined)?.isAdmin ?? false;
  const visibleNav = NAV_COMMANDS.filter(c => c.group !== 'Admin' || isAdmin);
  const filteredNav = query
    ? visibleNav.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : visibleNav;

  // Group nav commands
  const groups = Array.from(new Set(filteredNav.map(c => c.group)));

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk-container" role="dialog" aria-label="Command palette" aria-modal="true" onClick={e => e.stopPropagation()}>
        <Command className="cmdk-root" shouldFilter={false}>
          <div className="cmdk-input-wrap">
            <svg className="cmdk-search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m10 10 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <Command.Input
              className="cmdk-input"
              placeholder="Search or navigate…"
              value={query}
              onValueChange={setQuery}
              autoFocus
              aria-label="Search commands"
            />
            <kbd className="cmdk-esc-hint">ESC</kbd>
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty className="cmdk-empty">
              {searching ? 'Searching…' : 'No results found.'}
            </Command.Empty>

            {/* Asset search results */}
            {results.length > 0 && (
              <Command.Group className="cmdk-group" heading={<span className="cmdk-group-label">Assets</span>}>
                {results.map(r => (
                  <Command.Item
                    key={r.id}
                    className="cmdk-item"
                    onSelect={() => runCommand(`/assets/${r.id}`)}
                  >
                    <div className="cmdk-item-thumb">
                      <Image src={r.resultUrl} alt="" width={32} height={32} style={{ objectFit: 'cover' }} sizes="32px" />
                    </div>
                    <div className="cmdk-item-text">
                      <span className="cmdk-item-label">{r.prompt.slice(0, 50)}</span>
                      <span className="cmdk-item-hint">{r.mode}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Nav commands grouped */}
            {groups.map(group => {
              const items = filteredNav.filter(c => c.group === group);
              if (!items.length) return null;
              return (
                <Command.Group key={group} className="cmdk-group" heading={<span className="cmdk-group-label">{group}</span>}>
                  {items.map(cmd => (
                    <Command.Item
                      key={cmd.id}
                      className="cmdk-item"
                      onSelect={() => runCommand(cmd.href)}
                    >
                      <span className="cmdk-item-label">{cmd.label}</span>
                      <span className="cmdk-item-hint">{cmd.href}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          <div className="cmdk-footer">
            <span className="cmdk-footer-hint"><kbd>⌘K</kbd> open/close</span>
            <span className="cmdk-footer-hint"><kbd>↑↓</kbd> navigate</span>
            <span className="cmdk-footer-hint"><kbd>↵</kbd> select</span>
            <span className="cmdk-footer-hint"><kbd>ESC</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
