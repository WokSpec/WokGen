'use client';
import { useState } from 'react';

export default function RegexTesterPage() {
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
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Regex Tester</h1>
        <p className="tool-page-desc">Test regular expressions against text. See matches instantly.</p>
      </div>
      <div className="tool-section">
        <div className="tool-options-row">
          <div className="tool-options-row__flex">
            <label className="tool-field-label">Pattern</label>
            <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="\b\w+\b" className="tool-field-input tool-field-input--mono" />
          </div>
          <div>
            <label className="tool-field-label">Flags</label>
            <input value={flags} onChange={e => setFlags(e.target.value)} placeholder="gi" className="tool-field-input tool-field-input--mono tool-field-input--narrow" />
          </div>
        </div>
        <label className="tool-field-label">Test string</label>
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} className="tool-field-textarea tool-field-textarea--mono" />
        <button type="button" onClick={test} className="btn btn-primary tool-submit-btn">Test Pattern</button>
        {result && (
          <div className="tool-result-panel">
            {result.error ? (
              <p className="tool-result-error">{result.error}</p>
            ) : (
              <>
                <p className="tool-result-meta">{result.count} match{result.count !== 1 ? 'es' : ''} found</p>
                <div className="tool-match-chips">
                  {result.matches.map((m, i) => (
                    <code key={i} className="tool-match-chip">{m}</code>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
