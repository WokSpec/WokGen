'use client';

import { useState } from 'react';

interface IconDef {
  name: string;
  category: string;
  path: string;
}

const ICONS: IconDef[] = [
  // Arrows
  { name: 'ArrowUp', category: 'arrow', path: 'M12 19V5M5 12l7-7 7 7' },
  { name: 'ArrowDown', category: 'arrow', path: 'M12 5v14M19 12l-7 7-7-7' },
  { name: 'ArrowLeft', category: 'arrow', path: 'M19 12H5M12 5l-7 7 7 7' },
  { name: 'ArrowRight', category: 'arrow', path: 'M5 12h14M12 5l7 7-7 7' },
  { name: 'ChevronUp', category: 'arrow', path: 'M18 15l-6-6-6 6' },
  { name: 'ChevronDown', category: 'arrow', path: 'M6 9l6 6 6-6' },
  { name: 'ChevronLeft', category: 'arrow', path: 'M15 18l-6-6 6-6' },
  { name: 'ChevronRight', category: 'arrow', path: 'M9 18l6-6-6-6' },
  { name: 'CornerUpRight', category: 'arrow', path: 'M15 14l5-5-5-5M20 9H9a4 4 0 000 4v7' },
  { name: 'RefreshCw', category: 'arrow', path: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15' },
  // Files
  { name: 'File', category: 'file', path: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z M13 2v7h7' },
  { name: 'FileText', category: 'file', path: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { name: 'Folder', category: 'file', path: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' },
  { name: 'FolderOpen', category: 'file', path: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z M2 12h20' },
  { name: 'Download', category: 'file', path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3' },
  { name: 'Upload', category: 'file', path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12' },
  { name: 'Trash2', category: 'file', path: 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2 M10 11v6 M14 11v6' },
  { name: 'Copy', category: 'file', path: 'M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' },
  { name: 'Clipboard', category: 'file', path: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2 M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z' },
  // Communication
  { name: 'Mail', category: 'communication', path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  { name: 'MessageCircle', category: 'communication', path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { name: 'MessageSquare', category: 'communication', path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { name: 'Phone', category: 'communication', path: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.22 1 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.56-1.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z' },
  { name: 'Bell', category: 'communication', path: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0' },
  // UI
  { name: 'Search', category: 'ui', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { name: 'Settings', category: 'ui', path: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z' },
  { name: 'Home', category: 'ui', path: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
  { name: 'Menu', category: 'ui', path: 'M3 12h18 M3 6h18 M3 18h18' },
  { name: 'X', category: 'ui', path: 'M18 6L6 18 M6 6l12 12' },
  { name: 'Plus', category: 'ui', path: 'M12 5v14 M5 12h14' },
  { name: 'Minus', category: 'ui', path: 'M5 12h14' },
  { name: 'Check', category: 'ui', path: 'M20 6L9 17l-5-5' },
  { name: 'Info', category: 'ui', path: 'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 16v-4 M12 8h.01' },
  { name: 'AlertCircle', category: 'ui', path: 'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4 M12 16h.01' },
  // Media
  { name: 'Image', category: 'media', path: 'M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5L5 21' },
  { name: 'Video', category: 'media', path: 'M23 7l-7 5 7 5V7z M1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1V5z' },
  { name: 'Music', category: 'media', path: 'M9 18V5l12-2v13 M9 18a3 3 0 100-6 3 3 0 000 6z M21 16a3 3 0 100-6 3 3 0 000 6z' },
  { name: 'Play', category: 'media', path: 'M5 3l14 9-14 9V3z' },
  { name: 'Pause', category: 'media', path: 'M6 4h4v16H6z M14 4h4v16h-4z' },
  { name: 'Volume2', category: 'media', path: 'M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 010 14.14 M15.54 8.46a5 5 0 010 7.07' },
  // Social
  { name: 'Share2', category: 'social', path: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.4 3.4 0 000-1.41l7.09-4.11c.54.5 1.25.81 2 .81A3 3 0 0021 5a3 3 0 00-3-3 3 3 0 00-3 3c0 .24.04.47.09.69L7.04 9.81A3 3 0 005 9a3 3 0 00-3 3 3 3 0 003 3c.86 0 1.63-.35 2.19-.91l7.09 4.1c-.05.22-.09.45-.09.69A3 3 0 0018 22a3 3 0 003-3 3 3 0 00-3-3z' },
  { name: 'Heart', category: 'social', path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' },
  { name: 'Star', category: 'social', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { name: 'ThumbsUp', category: 'social', path: 'M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3' },
  { name: 'Bookmark', category: 'social', path: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z' },
  // Dev
  { name: 'Code', category: 'dev', path: 'M16 18l6-6-6-6 M8 6l-6 6 6 6' },
  { name: 'Terminal', category: 'dev', path: 'M4 17l6-6-6-6 M12 19h8' },
  { name: 'Github', category: 'dev', path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' },
  { name: 'Globe', category: 'dev', path: 'M12 2a10 10 0 100 20A10 10 0 0012 2z M2 12h20 M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' },
  { name: 'Link', category: 'dev', path: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71' },
  { name: 'Lock', category: 'dev', path: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4' },
  { name: 'Key', category: 'dev', path: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' },
  { name: 'Database', category: 'dev', path: 'M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5z M2 12c0 2.76 4.48 5 10 5s10-2.24 10-5 M2 7c0 2.76 4.48 5 10 5s10-2.24 10-5' },
];

const CATEGORIES = ['all', 'arrow', 'file', 'communication', 'ui', 'media', 'social', 'dev'];

type CopyFormat = 'svg' | 'jsx' | 'name';

export default function IconSearchTool() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('svg');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = ICONS.filter(icon => {
    const matchesQuery = !query || icon.name.toLowerCase().includes(query.toLowerCase());
    const matchesCat = category === 'all' || icon.category === category;
    return matchesQuery && matchesCat;
  });

  const getSvg = (icon: IconDef) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  <path d="${icon.path}" />\n</svg>`;

  const getJsx = (icon: IconDef) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">\n  <path d="${icon.path}" />\n</svg>`;

  const copyIcon = (icon: IconDef) => {
    let text = '';
    if (copyFormat === 'svg') text = getSvg(icon);
    else if (copyFormat === 'jsx') text = getJsx(icon);
    else text = icon.name;
    navigator.clipboard.writeText(text);
    setCopied(icon.name);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="tool-panel">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search icons…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: '180px' }}
        />
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['svg', 'jsx', 'name'] as CopyFormat[]).map(f => (
            <button key={f} className={`btn-ghost${copyFormat === f ? ' active' : ''}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.55rem' }} onClick={() => setCopyFormat(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} className={`btn-ghost${category === cat ? ' active' : ''}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', textTransform: 'capitalize' }} onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginBottom: '0.75rem' }}>{filtered.length} icons · click to copy as {copyFormat.toUpperCase()}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem' }}>
        {filtered.map(icon => (
          <button
            key={icon.name}
            className="btn-ghost"
            title={icon.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.4rem', fontSize: '0.7rem', position: 'relative', background: copied === icon.name ? 'var(--accent-primary)' : undefined }}
            onClick={() => copyIcon(icon)}
          >
                    <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={copied === icon.name ? '#fff' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d={icon.path} />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', color: copied === icon.name ? '#fff' : undefined }}>
              {copied === icon.name ? 'Copied' : icon.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
