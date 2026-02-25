'use client';

import { useState, useMemo } from 'react';

export default function WordCounterTool() {
  const [text, setText] = useState('');
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    const readingTime = Math.ceil(words / 200);
    return { words, chars, charsNoSpace, sentences, paragraphs, readingTime };
  }, [text]);

  return (
    <div className="tool-section">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste or type your text here..." rows={10} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
        {[
          { label: 'Words', value: stats.words },
          { label: 'Characters', value: stats.chars },
          { label: 'No spaces', value: stats.charsNoSpace },
          { label: 'Sentences', value: stats.sentences },
          { label: 'Paragraphs', value: stats.paragraphs },
          { label: 'Read time', value: `~${stats.readingTime} min` },
        ].map(s => (
          <div key={s.label} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.25rem' }}>{s.value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {text && (
        <button onClick={() => setText('')} className="btn btn-secondary" style={{ marginTop: '0.875rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Clear</button>
      )}
    </div>
  );
}
