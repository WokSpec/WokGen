'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SfxResult {
  id: number;
  name: string;
  description: string;
  duration: number;
  url: string;
  preview_url: string | null;
  license: string;
}

interface Props {
  onSelectPrompt?: (prompt: string) => void;
}

export default function SfxBrowser({ onSelectPrompt }: Props) {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<SfxResult[]>([]);
  const [count, setCount]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [noKey, setNoKey]         = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string, p: number, append = false) => {
    if (!q.trim()) { setResults([]); setCount(0); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/sfx/search?q=${encodeURIComponent(q)}&page=${p}&pageSize=10`);
      const data = await res.json() as { results?: SfxResult[]; count?: number; note?: string };
      if (data.note) { setNoKey(true); setResults([]); setCount(0); return; }
      setNoKey(false);
      setResults(append ? (prev) => [...prev, ...(data.results ?? [])] : (data.results ?? []));
      setCount(data.count ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      search(query, 1, false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const handlePlay = (result: SfxResult) => {
    if (!result.preview_url) return;
    if (playingId === result.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    const audio = new Audio(result.preview_url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(result.id);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    search(query, next, true);
  };

  const hasMore = results.length < count;

  if (noKey) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-muted)', padding: '6px 0' }}>
        Browse not available — generate sounds below
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Freesound… (e.g. rain, whoosh)"
        style={{
          background:  'var(--surface-2, #1e1e2e)',
          border:      '1px solid var(--surface-border, #333)',
          borderRadius: 6,
          color:       'var(--text-primary, #e2e8f0)',
          fontSize:    12,
          padding:     '5px 10px',
          outline:     'none',
          width:       '100%',
          boxSizing:   'border-box',
        }}
      />

      {/* Results */}
      {loading && results.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Searching…</p>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No results found.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
        {results.map((r) => (
          <div
            key={r.id}
            style={{
              background:   'var(--surface-2, #1e1e2e)',
              border:       '1px solid var(--surface-border, #333)',
              borderRadius: 6,
              padding:      '5px 8px',
              display:      'flex',
              alignItems:   'center',
              gap:          6,
            }}
          >
            {/* Play button */}
            <button
              onClick={() => handlePlay(r)}
              disabled={!r.preview_url}
              title={playingId === r.id ? 'Pause' : 'Play preview'}
              style={{
                background:   playingId === r.id ? 'var(--accent, #60a5fa)' : 'var(--surface-3, #2a2a3e)',
                border:       'none',
                borderRadius: 4,
                color:        playingId === r.id ? '#000' : 'var(--text-secondary, #94a3b8)',
                cursor:       r.preview_url ? 'pointer' : 'not-allowed',
                fontSize:     11,
                padding:      '3px 7px',
                flexShrink:   0,
              }}
            >
              {playingId === r.id ? '⏸' : '▶'}
            </button>

            {/* Name + duration */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize:     11,
                  fontWeight:   600,
                  color:        'var(--text-primary, #e2e8f0)',
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={r.name}
              >
                {r.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
                {r.duration.toFixed(1)}s
              </div>
            </div>

            {/* Generate similar */}
            {onSelectPrompt && (
              <button
                onClick={() => onSelectPrompt(`${r.name}: ${r.description.slice(0, 80)}`)}
                title="Use as generation prompt"
                style={{
                  background:   'transparent',
                  border:       '1px solid var(--surface-border, #333)',
                  borderRadius: 4,
                  color:        'var(--text-muted, #64748b)',
                  cursor:       'pointer',
                  fontSize:     10,
                  padding:      '2px 6px',
                  flexShrink:   0,
                  whiteSpace:   'nowrap',
                }}
              >
                ✦ Similar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          style={{
            background:   'transparent',
            border:       '1px solid var(--surface-border, #333)',
            borderRadius: 6,
            color:        'var(--text-muted, #64748b)',
            cursor:       loading ? 'not-allowed' : 'pointer',
            fontSize:     11,
            padding:      '4px 0',
            width:        '100%',
          }}
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}

      {/* Attribution */}
      {results.length > 0 && (
        <p style={{ fontSize: 9, color: 'var(--text-disabled, #475569)', margin: 0 }}>
          Sounds from{' '}
          <a href="https://freesound.org" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Freesound.org
          </a>{' '}
          (Creative Commons)
        </p>
      )}
    </div>
  );
}
