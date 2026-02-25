'use client';

import { useState } from 'react';

type Category = 'features' | 'fixes' | 'breaking' | 'improvements';

interface Categorized {
  features: string[];
  fixes: string[];
  breaking: string[];
  improvements: string[];
}

const CATEGORY_PATTERNS: { key: Category; patterns: RegExp[] }[] = [
  {
    key: 'breaking',
    patterns: [/breaking/i, /removed?/i, /deprecat/i, /\bbreak\b/i, /BREAKING/],
  },
  {
    key: 'features',
    patterns: [/^feat/i, /add(ed)?/i, /new /i, /implement/i, /introduc/i, /support/i],
  },
  {
    key: 'fixes',
    patterns: [/^fix/i, /bug/i, /patch/i, /hotfix/i, /resolv/i, /correct/i, /repai/i],
  },
  {
    key: 'improvements',
    patterns: [/refactor/i, /improv/i, /updat/i, /enhanc/i, /optimi/i, /perf/i, /clean/i, /style/i, /chore/i, /docs?/i, /test/i],
  },
];

function categorize(raw: string): Categorized {
  const result: Categorized = { features: [], fixes: [], breaking: [], improvements: [] };
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Strip git log prefixes like "abc1234 " or "* "
    const clean = line.replace(/^[a-f0-9]{6,10}\s+/, '').replace(/^\*\s+/, '').replace(/^[-•]\s+/, '');
    if (!clean) continue;

    let matched = false;
    for (const cat of CATEGORY_PATTERNS) {
      if (cat.patterns.some(p => p.test(clean))) {
        result[cat.key].push(clean);
        matched = true;
        break;
      }
    }
    if (!matched) result.improvements.push(clean);
  }
  return result;
}

function renderChangelog(cat: Categorized, version: string, date: string): string {
  const sections: string[] = [];
  const fmt = (title: string, items: string[]) => {
    if (!items.length) return '';
    return `### ${title}\n${items.map(i => `- ${i}`).join('\n')}`;
  };

  if (cat.breaking.length) sections.push(fmt('Breaking Changes', cat.breaking));
  if (cat.features.length) sections.push(fmt('Features', cat.features));
  if (cat.fixes.length) sections.push(fmt('Bug Fixes', cat.fixes));
  if (cat.improvements.length) sections.push(fmt('Improvements', cat.improvements));

  return `## [${version}] — ${date}\n\n${sections.join('\n\n')}`;
}

const SAMPLE_INPUT = `feat: add dark mode toggle
fix: navbar overflow on mobile
refactor: extract utility functions
breaking: remove deprecated API endpoints
add user profile page
fix crash when uploading large files
improve loading performance
update dependencies`;

export default function ChangelogWriterTool() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [version, setVersion] = useState('1.0.0');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const cat = categorize(input);
    setOutput(renderChangelog(cat, version, date));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const download = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CHANGELOG.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="cl-tool">
      <div className="cl-tool__form">
        <div className="cl-tool__row">
          <label className="cl-tool__field">
            <span>Version</span>
            <input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" />
          </label>
          <label className="cl-tool__field">
            <span>Release Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
        </div>

        <label className="cl-tool__field cl-tool__field--full">
          <span>Git Log / Bullet Points</span>
          <textarea
            className="cl-tool__textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={10}
            placeholder={`Paste git log output or bullet points, e.g.:\nfeat: add dark mode\nfix: crash on mobile\nrefactor: clean up utils`}
          />
        </label>

        <button className="btn btn-primary" onClick={generate}>Generate Changelog</button>
      </div>

      {output && (
        <div className="cl-tool__output">
          <div className="cl-tool__output-header">
            <span className="cl-tool__output-title">Generated CHANGELOG.md Entry</span>
            <div className="cl-tool__output-btns">
              <button className="btn btn-sm" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
              <button className="btn btn-sm" onClick={download}>Download .md</button>
            </div>
          </div>
          <pre className="cl-tool__preview">{output}</pre>
        </div>
      )}

      <style>{`
        .cl-tool { display: flex; flex-direction: column; gap: 20px; }
        .cl-tool__form {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px;
        }
        .cl-tool__row { display: flex; gap: 12px; flex-wrap: wrap; }
        .cl-tool__field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px; font-size: 12px; color: var(--text-secondary); }
        .cl-tool__field--full { flex: unset; }
        .cl-tool__field input {
          background: var(--bg); border: 1px solid var(--surface-border); border-radius: 4px;
          color: var(--text); padding: 6px 8px; font-size: 13px;
        }
        .cl-tool__textarea {
          background: var(--bg); border: 1px solid var(--surface-border); border-radius: 4px;
          color: var(--text); padding: 8px 10px; font-size: 13px; font-family: 'Menlo','Consolas',monospace;
          resize: vertical; width: 100%; box-sizing: border-box; outline: none;
        }
        .cl-tool__output {
          background: var(--bg-surface); border: 1px solid var(--surface-border); border-radius: 8px; overflow: hidden;
        }
        .cl-tool__output-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--surface-border); }
        .cl-tool__output-title { font-size: 13px; font-weight: 600; color: var(--text); }
        .cl-tool__output-btns { display: flex; gap: 8px; }
        .cl-tool__preview { padding: 16px; font-size: 13px; font-family: 'Menlo','Consolas',monospace; white-space: pre-wrap; color: var(--text); max-height: 480px; overflow-y: auto; margin: 0; }
        .btn.btn-sm { padding: 5px 12px; font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.06); border: 1px solid var(--surface-border); color: var(--text); border-radius: 4px; }
        .btn.btn-sm:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
