'use client';

import { useState } from 'react';

function generateUuids(count: number): string[] {
  return Array.from({ length: count }, () => crypto.randomUUID());
}

export default function UuidGeneratorTool() {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = () => setUuids(generateUuids(count));

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    });
  };

  const copyAll = () => copy(uuids.join('\n'), 'all');

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">UUID Generator</h1>
        <p className="tool-page-desc">Generate cryptographically random UUID v4 values using the browser&apos;s built-in crypto API.</p>
      </div>

      <div className="tool-section">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Count</label>
          <input
            type="number"
            className="tool-input"
            style={{ width: 80 }}
            min={1}
            max={20}
            value={count}
            onChange={e => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 10px', background: 'var(--bg-surface)', border: '1px solid var(--surface-border)', borderRadius: 6 }}>
            v4
          </span>
          <button className="btn btn-primary" onClick={generate}>Generate</button>
          {uuids.length > 0 && (
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={copyAll}>
              {copied === 'all' ? 'Copied!' : 'Copy All'}
            </button>
          )}
        </div>
      </div>

      {uuids.length > 0 && (
        <div className="tool-section">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {uuids.map((uuid, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
                <code style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
                  {uuid}
                </code>
                <button
                  className="btn"
                  style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
                  onClick={() => copy(uuid, uuid)}
                >
                  {copied === uuid ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
