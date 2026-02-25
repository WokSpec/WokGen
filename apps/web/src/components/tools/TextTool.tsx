'use client';

import { useState, useMemo } from 'react';

type Mode = 'count' | 'case' | 'slug' | 'dedup' | 'extract';

const CASE_OPS = [
  { id: 'upper',  label: 'UPPER CASE',  fn: (s: string) => s.toUpperCase() },
  { id: 'lower',  label: 'lower case',  fn: (s: string) => s.toLowerCase() },
  { id: 'title',  label: 'Title Case',  fn: (s: string) => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
  { id: 'camel',  label: 'camelCase',   fn: (s: string) => toSlug(s).replace(/-(\w)/g, (_, c) => c.toUpperCase()) },
  { id: 'pascal', label: 'PascalCase',  fn: (s: string) => { const c = toSlug(s).replace(/-(\w)/g, (_, c2) => c2.toUpperCase()); return c.charAt(0).toUpperCase() + c.slice(1); } },
  { id: 'snake',  label: 'snake_case',  fn: (s: string) => toSlug(s).replace(/-/g, '_') },
  { id: 'kebab',  label: 'kebab-case',  fn: (s: string) => toSlug(s) },
];

function toSlug(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function TextTool() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('count');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const sentences = text.trim() ? (text.match(/[.!?]+/g) ?? []).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
    const readingTime = Math.ceil(words / 200);
    return { chars, words, lines, sentences, paragraphs, readingTime };
  }, [text]);

  const run = (op?: string) => {
    if (!text.trim()) return;
    switch (mode) {
      case 'count': break;
      case 'case': {
        const fn = CASE_OPS.find(o => o.id === op)?.fn;
        if (fn) setOutput(fn(text));
        break;
      }
      case 'slug': setOutput(toSlug(text)); break;
      case 'dedup': {
        const lines = text.split('\n');
        const seen = new Set<string>();
        const out: string[] = [];
        for (const l of lines) {
          const norm = l.trim();
          if (!seen.has(norm)) { seen.add(norm); out.push(l); }
        }
        setOutput(out.join('\n'));
        break;
      }
      case 'extract': {
        const emails = [...new Set(text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) ?? [])];
        const urls = [...new Set(text.match(/https?:\/\/[^\s"'<>]+/g) ?? [])];
        setOutput([
          emails.length ? `Emails (${emails.length}):\n${emails.join('\n')}` : 'Emails: none',
          urls.length ? `\nURLs (${urls.length}):\n${urls.join('\n')}` : '\nURLs: none',
        ].join('\n'));
        break;
      }
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output || text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-tool">
      {/* Mode tabs */}
      <div className="text-tool-modes">
        {([
          ['count', 'Count'],
          ['case', 'Case'],
          ['slug', 'Slug'],
          ['dedup', 'Dedup'],
          ['extract', 'Extract'],
        ] as [Mode, string][]).map(([m, lbl]) => (
          <button
            key={m}
            className={`json-mode-btn${mode === m ? ' active' : ''}`}
            onClick={() => { setMode(m); setOutput(''); }}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="text-tool-body">
        {/* Input */}
        <div className="json-panel">
          <div className="json-panel-header">
            <span className="json-panel-label">Input Text</span>
            <button className="btn-ghost-xs" onClick={() => { setText(''); setOutput(''); }}>Clear</button>
          </div>
          <textarea
            className="json-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type your text here…"
            rows={8}
          />
        </div>

        {/* Count stats */}
        {mode === 'count' && (
          <div className="text-stats-grid">
            {[
              ['Characters', stats.chars],
              ['Words', stats.words],
              ['Lines', stats.lines],
              ['Sentences', stats.sentences],
              ['Paragraphs', stats.paragraphs],
              ['~Read time', `${stats.readingTime} min`],
            ].map(([label, val]) => (
              <div key={String(label)} className="text-stat-card">
                <div className="text-stat-value">{val}</div>
                <div className="text-stat-label">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Case buttons */}
        {mode === 'case' && (
          <div className="text-case-grid">
            {CASE_OPS.map(op => (
              <button
                key={op.id}
                className="btn-secondary text-case-btn"
                onClick={() => run(op.id)}
              >
                {op.label}
              </button>
            ))}
          </div>
        )}

        {/* Single-run modes */}
        {(mode === 'slug' || mode === 'dedup' || mode === 'extract') && (
          <button className="btn-primary text-run-btn" onClick={() => run()}>
            {mode === 'slug' ? 'Generate Slug' : mode === 'dedup' ? 'Remove Duplicates' : 'Extract'}
          </button>
        )}

        {/* Output */}
        {output && (
          <div className="json-panel">
            <div className="json-panel-header">
              <span className="json-panel-label">Output</span>
              <button className="btn-ghost-xs" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <textarea className="json-textarea output" value={output} readOnly rows={6} />
          </div>
        )}
      </div>
    </div>
  );
}
