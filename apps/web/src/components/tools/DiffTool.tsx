'use client';

import { useState } from 'react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const a = original.split('\n');
  const b = modified.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based line diff
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) {
      result.push({ type: 'unchanged', text: a[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i+1][j] >= dp[i][j+1])) {
      result.push({ type: 'added', text: b[j] });
      j++;
    } else {
      result.push({ type: 'removed', text: a[i] });
      i++;
    }
  }
  return result;
}

function diffToUnifiedString(lines: DiffLine[]): string {
  return lines.map(l => {
    if (l.type === 'added') return `+ ${l.text}`;
    if (l.type === 'removed') return `- ${l.text}`;
    return `  ${l.text}`;
  }).join('\n');
}

export default function DiffTool() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [copied, setCopied] = useState(false);

  const diff = original || modified ? computeDiff(original, modified) : null;
  const stats = diff ? {
    added:     diff.filter(l => l.type === 'added').length,
    removed:   diff.filter(l => l.type === 'removed').length,
    unchanged: diff.filter(l => l.type === 'unchanged').length,
  } : null;

  const copyDiff = () => {
    if (!diff) return;
    navigator.clipboard.writeText(diffToUnifiedString(diff)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="diff-tool">
      <div className="diff-tool__inputs">
        <div className="diff-tool__input-col">
          <label className="tool-label">Original</label>
          <textarea
            className="diff-tool__textarea"
            rows={12}
            value={original}
            onChange={e => setOriginal(e.target.value)}
            placeholder="Paste original text here..."
            spellCheck={false}
          />
        </div>
        <div className="diff-tool__input-col">
          <label className="tool-label">Modified</label>
          <textarea
            className="diff-tool__textarea"
            rows={12}
            value={modified}
            onChange={e => setModified(e.target.value)}
            placeholder="Paste modified text here..."
            spellCheck={false}
          />
        </div>
      </div>

      {diff && (
        <div className="diff-tool__result">
          <div className="diff-tool__result-header">
            {stats && (
              <div className="diff-tool__stats">
                <span className="diff-tool__stat diff-tool__stat--added">+{stats.added} added</span>
                <span className="diff-tool__stat diff-tool__stat--removed">-{stats.removed} removed</span>
                <span className="diff-tool__stat diff-tool__stat--unchanged">{stats.unchanged} unchanged</span>
              </div>
            )}
            <button className="btn btn-secondary" onClick={copyDiff} style={{ marginLeft: 'auto' }}>
              {copied ? 'Copied!' : 'Copy diff'}
            </button>
          </div>
          <div className="diff-tool__lines">
            {diff.map((line, i) => (
              <div key={i} className={`diff-tool__line diff-tool__line--${line.type}`}>
                <span className="diff-tool__line-marker">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </span>
                <span className="diff-tool__line-text">{line.text || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .diff-tool { display: flex; flex-direction: column; gap: 20px; }
        .diff-tool__inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .diff-tool__inputs { grid-template-columns: 1fr; } }
        .diff-tool__input-col { display: flex; flex-direction: column; gap: 6px; }
        .diff-tool__textarea {
          padding: 10px 12px; font-size: 12px; font-family: 'Menlo','Consolas',monospace;
          line-height: 1.5; background: var(--bg); color: var(--text);
          border: 1px solid var(--surface-border); border-radius: 6px;
          outline: none; resize: vertical; width: 100%;
        }
        .diff-tool__textarea:focus { border-color: #818cf8; }
        .diff-tool__result {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; overflow: hidden;
        }
        .diff-tool__result-header {
          display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-bottom: 1px solid var(--surface-border);
          background: rgba(255,255,255,0.02);
        }
        .diff-tool__stats { display: flex; gap: 10px; flex-wrap: wrap; }
        .diff-tool__stat { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
        .diff-tool__stat--added   { background: rgba(52,211,153,0.12); color: #34d399; }
        .diff-tool__stat--removed { background: rgba(248,113,113,0.12); color: #f87171; }
        .diff-tool__stat--unchanged { background: rgba(148,163,184,0.1); color: var(--text-muted); }
        .diff-tool__lines { overflow: auto; }
        .diff-tool__line {
          display: flex; font-size: 12px; font-family: 'Menlo','Consolas',monospace;
          line-height: 1.6; padding: 0 14px;
        }
        .diff-tool__line--added   { background: rgba(52,211,153,0.08); }
        .diff-tool__line--removed { background: rgba(248,113,113,0.08); }
        .diff-tool__line-marker {
          width: 16px; flex-shrink: 0; font-weight: 700;
          color: var(--text-muted);
        }
        .diff-tool__line--added   .diff-tool__line-marker { color: #34d399; }
        .diff-tool__line--removed .diff-tool__line-marker { color: #f87171; }
        .diff-tool__line-text { color: var(--text-secondary); white-space: pre-wrap; word-break: break-all; }
        .diff-tool__line--added   .diff-tool__line-text { color: #a7f3d0; }
        .diff-tool__line--removed .diff-tool__line-text { color: #fca5a5; }
      `}</style>
    </div>
  );
}
