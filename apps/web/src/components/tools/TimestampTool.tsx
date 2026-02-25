'use client';

import { useState } from 'react';

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: (v: string, k: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <code style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{value}</code>
        <button onClick={() => onCopy?.(value, label)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Copy</button>
      </div>
    </div>
  );
}

export default function TimestampTool() {
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)));
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16));
  const [copied, setCopied] = useState('');

  function copy(val: string, key: string) {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  }

  const tsNum = parseInt(ts);
  const fromTs = isNaN(tsNum) ? null : new Date(tsNum * 1000);
  const fromDate = dateStr ? new Date(dateStr) : null;

  return (
    <div className="tool-section">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Unix timestamp (seconds)</label>
          <input value={ts} onChange={e => setTs(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.9375rem', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Date + time</label>
          <input type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none' }} />
        </div>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '0 1rem', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From timestamp</div>
        {fromTs && !isNaN(fromTs.getTime()) ? (
          <>
            <Row label="ISO 8601" value={fromTs.toISOString()} onCopy={copy} />
            <Row label="UTC" value={fromTs.toUTCString()} onCopy={copy} />
            <Row label="Local" value={fromTs.toLocaleString()} onCopy={copy} />
            <Row label="Date only" value={fromTs.toISOString().split('T')[0]} onCopy={copy} />
            <Row label="Unix (ms)" value={String(fromTs.getTime())} onCopy={copy} />
          </>
        ) : <p style={{ padding: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter a valid timestamp above</p>}
        {fromDate && !isNaN(fromDate.getTime()) && (
          <>
            <div style={{ padding: '0.75rem 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From date input</div>
            <Row label="Unix (seconds)" value={String(Math.floor(fromDate.getTime() / 1000))} onCopy={copy} />
            <Row label="Unix (ms)" value={String(fromDate.getTime())} onCopy={copy} />
            <Row label="ISO 8601" value={fromDate.toISOString()} onCopy={copy} />
          </>
        )}
      </div>
      <button onClick={() => setTs(String(Math.floor(Date.now() / 1000)))} className="btn btn-secondary" style={{ marginTop: '0.875rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Use current time</button>
    </div>
  );
}
