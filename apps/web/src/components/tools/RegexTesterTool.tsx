'use client';

import { useState } from 'react';

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gi');
  const [input, setInput] = useState('The quick brown fox jumps over the lazy dog');
  const [result, setResult] = useState<{ matches: string[]; count: number; error?: string } | null>(null);

  function test() {
    try {
      const re = new RegExp(pattern, flags);
      const matches = [...input.matchAll(re)].map(m => m[0]);
      setResult({ matches, count: matches.length });
    } catch (e: any) {
      setResult({ matches: [], count: 0, error: e.message });
    }
  }

  return (
    <div className="tool-section">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Pattern</label>
          <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="\\b\\w+\\b" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.9375rem', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Flags</label>
          <input value={flags} onChange={e => setFlags(e.target.value)} placeholder="gi" style={{ width: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.9375rem', outline: 'none' }} />
        </div>
      </div>
      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Test string</label>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', fontFamily: 'monospace' }} />
      <button onClick={test} className="btn btn-primary" style={{ marginTop: '0.875rem', padding: '0.5rem 1.25rem' }}>Test Pattern</button>
      {result && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
          {result.error ? (
            <p style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.875rem' }}>Error: {result.error}</p>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{result.count} match{result.count !== 1 ? 'es' : ''} found</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {result.matches.map((m, i) => (
                  <code key={i} style={{ padding: '0.2rem 0.5rem', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '4px', fontSize: '0.8125rem', color: '#a78bfa' }}>{m}</code>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
