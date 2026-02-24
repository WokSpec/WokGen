'use client';

import { useState } from 'react';

interface MediaInfo {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'unknown';
  filename: string;
  contentType?: string;
  size?: number;
}

export default function MediaDownloaderTool() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaInfo[]>([]);
  const [error, setError] = useState('');

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setMedia([]);
    try {
      const res = await fetch('/api/tools/media-downloader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch media');
      setMedia(data.media || []);
      if (data.media?.length === 0) setError('No downloadable media found at this URL.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function typeIcon(type: MediaInfo['type']) {
    if (type === 'image') return 'IMG';
    if (type === 'video') return 'VID';
    if (type === 'audio') return 'AUD';
    if (type === 'document') return 'DOC';
    return 'FILE';
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Media Downloader</h1>
        <p className="tool-page-desc">Paste any public URL to download images, audio, video, or other media files.</p>
      </div>

      <div className="tool-section">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <input
            type="url"
            className="tool-input"
            placeholder="https://example.com/image.png  or  https://example.com/page-with-media"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetch()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleFetch} disabled={loading || !url.trim()}>
            {loading ? 'Fetching...' : 'Fetch Media'}
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Only public URLs are supported. No media is stored on WokGen servers.
        </p>
      </div>

      {error && (
        <div className="tool-error">{error}</div>
      )}

      {media.length > 0 && (
        <div className="tool-section">
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Found {media.length} file{media.length !== 1 ? 's' : ''}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {media.map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                <span style={{
                  fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.05em',
                  padding: '0.2rem 0.4rem', borderRadius: '4px',
                  background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                  flexShrink: 0, minWidth: '36px', textAlign: 'center'
                }}>{typeIcon(item.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.contentType}{item.size ? ` · ${formatBytes(item.size)}` : ''}
                  </div>
                </div>
                <a
                  href={item.url}
                  download={item.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', flexShrink: 0 }}
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
