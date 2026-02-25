'use client';

import { useState, useCallback } from 'react';

type Mode = 'format' | 'minify' | 'validate' | 'convert';

interface ConvertTarget {
  id: string;
  label: string;
  convert: (obj: unknown) => string;
}

const CONVERT_TARGETS: ConvertTarget[] = [
  {
    id: 'csv',
    label: 'CSV',
    convert: (obj) => {
      if (!Array.isArray(obj)) return 'Input must be a JSON array';
      if (obj.length === 0) return '';
      const keys = Object.keys(obj[0] as object);
      const rows = [keys.join(',')];
      for (const row of obj as Record<string, unknown>[]) {
        rows.push(keys.map(k => {
          const v = String(row[k] ?? '');
          return v.includes(',') || v.includes('"') || v.includes('\n')
            ? `"${v.replace(/"/g, '""')}"`
            : v;
        }).join(','));
      }
      return rows.join('\n');
    },
  },
  {
    id: 'yaml',
    label: 'YAML',
    convert: (obj) => toYaml(obj, 0),
  },
  {
    id: 'tsv',
    label: 'TSV',
    convert: (obj) => {
      if (!Array.isArray(obj)) return 'Input must be a JSON array';
      if (obj.length === 0) return '';
      const keys = Object.keys(obj[0] as object);
      const rows = [keys.join('\t')];
      for (const row of obj as Record<string, unknown>[]) {
        rows.push(keys.map(k => String((row as Record<string, unknown>)[k] ?? '')).join('\t'));
      }
      return rows.join('\n');
    },
  },
];

function toYaml(obj: unknown, depth: number): string {
  const indent = '  '.repeat(depth);
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return String(obj);
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const v = toYaml(item, depth + 1);
      return `\n${indent}- ${v}`;
    }).join('');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries.map(([k, v]) => {
      const val = toYaml(v, depth + 1);
      if (typeof v === 'object' && v !== null) {
        return `\n${indent}${k}:${val}`;
      }
      return `\n${indent}${k}: ${val}`;
    }).join('');
  }
  return String(obj);
}

export default function JsonTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('format');
  const [convertTarget, setConvertTarget] = useState<string>('yaml');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [parsedData, setParsedData] = useState<unknown>(null);

  const run = useCallback(() => {
    if (!input.trim()) {
      setError('Enter some JSON first');
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setError(null);
      setParsedData(parsed);

      if (mode === 'format') {
        setOutput(JSON.stringify(parsed, null, 2));
      } else if (mode === 'minify') {
        setOutput(JSON.stringify(parsed));
      } else if (mode === 'validate') {
        const depth = countDepth(parsed);
        const keys = countKeys(parsed);
        setOutput(
          `Valid JSON\n\nType: ${Array.isArray(parsed) ? `Array (${(parsed as unknown[]).length} items)` : typeof parsed}\nKeys: ${keys}\nNesting depth: ${depth}`
        );
      } else if (mode === 'convert') {
        const target = CONVERT_TARGETS.find(t => t.id === convertTarget);
        if (!target) { setError('Unknown conversion target'); return; }
        setOutput(target.convert(parsed));
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        const match = e.message.match(/line (\d+)/i) || e.message.match(/position (\d+)/i);
        const suffix = match ? ` (line ${match[1]})` : '';
        setError(`Invalid JSON${suffix}: ${e.message}`);
      } else {
        setError(`Invalid JSON: ${String(e)}`);
      }
      setParsedData(null);
      setOutput('');
    }
  }, [input, mode, convertTarget]);

  const copy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  const loadExample = () => {
    setInput(JSON.stringify({
      name: 'WokGen',
      version: '2.0.0',
      features: ['WokGen Studio', 'Free Tools', 'Open Source'],
      meta: { free: true, models: 300 },
    }, null, 2));
  };

  return (
    <div className="json-tool">
      {/* Mode selector */}
      <div className="json-tool-modes">
        {(['format', 'minify', 'validate', 'convert'] as Mode[]).map(m => (
          <button
            key={m}
            className={`json-mode-btn${mode === m ? ' active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {mode === 'convert' && (
        <div className="json-convert-opts">
          <span className="json-convert-label">Convert to:</span>
          {CONVERT_TARGETS.map(t => (
            <button
              key={t.id}
              className={`json-mode-btn${convertTarget === t.id ? ' active' : ''}`}
              onClick={() => setConvertTarget(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Panels */}
      <div className="json-tool-panels">
        <div className="json-panel">
          <div className="json-panel-header">
            <span className="json-panel-label">Input JSON</span>
            <div className="json-panel-actions">
              <button className="btn-ghost-xs" onClick={loadExample}>Load Example</button>
              <button className="btn-ghost-xs" onClick={() => { setInput(''); setOutput(''); setError(null); }}>Clear</button>
            </div>
          </div>
          <textarea
            className={`json-textarea${error ? ' error' : ''}`}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='Paste your JSON here…'
            spellCheck={false}
          />
          {error && <p className="json-error">{error}</p>}
        </div>

        <div className="json-panel-separator">
          <button className="btn-primary json-run-btn" onClick={run}>
            {mode === 'format' ? '→ Format' : mode === 'minify' ? '→ Minify' : mode === 'validate' ? '→ Validate' : '→ Convert'}
          </button>
        </div>

        <div className="json-panel">
          <div className="json-panel-header">
            <span className="json-panel-label">Output</span>
            {output && (
              <button className="btn-ghost-xs" onClick={copy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            className="json-textarea output"
            value={output}
            readOnly
            placeholder="Output will appear here…"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

function countDepth(obj: unknown, depth = 0): number {
  if (typeof obj !== 'object' || obj === null) return depth;
  const children = Object.values(obj as Record<string, unknown>).map(v => countDepth(v, depth + 1));
  return children.length > 0 ? Math.max(...children) : depth;
}

function countKeys(obj: unknown): number {
  if (typeof obj !== 'object' || obj === null) return 0;
  if (Array.isArray(obj)) return obj.reduce((a, v) => a + countKeys(v), 0);
  return Object.keys(obj as object).length + Object.values(obj as object).reduce((a, v) => a + countKeys(v), 0);
}
