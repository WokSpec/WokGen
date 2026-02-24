'use client';

import { useState, useRef } from 'react';

interface UrlResult {
  url: string;
  status: number | null;
  label: string;
  error?: string;
}

function statusColor(status: number | null, error?: string): string {
  if (error) return '#6b7280';
  if (!status) return '#6b7280';
  if (status >= 200 && status < 300) return '#34d399';
  if (status >= 300 && status < 400) return '#fbbf24';
  return '#f87171';
}

export default function LinkCheckerTool() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<UrlResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const check = async () => {
    const urls = input.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setRunning(true);
    setResults([]);
    setProgress(0);
    abortRef.current = new AbortController();
    const out: UrlResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const res = await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: abortRef.current.signal });
        // no-cors gives opaque response — status is 0 but no error means reachable
        out.push({ url, status: res.status || null, label: res.status ? String(res.status) : 'OK (opaque)' });
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') break;
        out.push({ url, status: null, error: 'Unreachable', label: 'Error' });
      }
      setResults([...out]);
      setProgress(Math.round(((i + 1) / urls.length) * 100));
    }

    setRunning(false);
  };

  const stop = () => { abortRef.current?.abort(); setRunning(false); };

  const exportCsv = () => {
    const csv = ['URL,Status,Label', ...results.map(r => `"${r.url}",${r.status ?? ''},${r.label}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'link-check.csv';
    a.click();
  };

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Link Checker</h1>
        <p className="tool-page-desc">Check HTTP status codes for a list of URLs. Runs in your browser — no server needed.</p>
      </div>

      <div className="tool-section">
        <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>URLs (one per line)</label>
        <textarea
          className="tool-input"
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
          placeholder={'https://example.com\nhttps://github.com'}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" onClick={check} disabled={running}>
            {running ? `Checking... ${progress}%` : 'Check Links'}
          </button>
          {running && <button className="btn" onClick={stop}>Stop</button>}
          {results.length > 0 && !running && (
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={exportCsv}>Export CSV</button>
          )}
        </div>
        {running && (
          <div style={{ marginTop: 10, height: 4, background: 'var(--surface-border)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#818cf8', borderRadius: 2, transition: 'width 0.2s' }} />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="tool-section">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map((r, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
                <span style={{
                  minWidth: 70, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: `${statusColor(r.status, r.error)}22`,
                  color: statusColor(r.status, r.error),
                }}>
                  {r.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{r.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
