'use client';

import { useState, useEffect } from 'react';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function inferType(value: JsonValue, depth = 0): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'number' : 'number';
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';
    const itemTypes = [...new Set(value.map(v => inferType(v, depth)))];
    const itemType = itemTypes.length === 1 ? itemTypes[0] : itemTypes.join(' | ');
    return `${itemType}[]`;
  }
  if (typeof value === 'object') {
    return generateInterface(value as JsonObject, depth);
  }
  return 'unknown';
}

let interfaceCounter = 0;
const seen = new Map<string, string>();

function generateInterface(obj: JsonObject, depth = 0): string {
  const indent = '  '.repeat(depth + 1);
  const fields = Object.entries(obj).map(([key, val]) => {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
    const type = inferType(val, depth + 1);
    const optional = val === null || val === undefined ? '?' : '';
    return `${indent}${safeKey}${optional}: ${type};`;
  }).join('\n');
  return `{\n${fields}\n${'  '.repeat(depth)}}`;
}

function jsonToTypes(json: string): string {
  interfaceCounter = 0;
  seen.clear();

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(json);
  } catch {
    return '// Invalid JSON — please check your input.';
  }

  const lines: string[] = [];

  function processValue(value: JsonValue, name: string): string {
    if (value === null) return 'null';
    if (typeof value !== 'object' || Array.isArray(value)) {
      return inferType(value);
    }

    const obj = value as JsonObject;
    const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);
    const fields = Object.entries(obj).map(([key, val]) => {
      let fieldType: string;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        const childName = key.charAt(0).toUpperCase() + key.slice(1);
        fieldType = processValue(val, childName);
      } else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          const childName = key.charAt(0).toUpperCase() + key.slice(1).replace(/s$/, '');
          const itemType = processValue(val[0], childName);
          fieldType = `${itemType}[]`;
        } else if (val.length === 0) {
          fieldType = 'unknown[]';
        } else {
          const types = [...new Set(val.map(v => typeof v === 'object' ? (v === null ? 'null' : 'object') : typeof v))];
          fieldType = types.length === 1 ? `${types[0]}[]` : `(${types.join(' | ')})[]`;
        }
      } else {
        fieldType = inferType(val);
      }

      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      const optional = val === null ? '?' : '';
      return `  ${safeKey}${optional}: ${fieldType};`;
    }).join('\n');

    lines.push(`export interface ${interfaceName} {\n${fields}\n}`);
    return interfaceName;
  }

  if (Array.isArray(parsed)) {
    if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
      processValue(parsed[0], 'Item');
      lines.push(`\nexport type Root = Item[];`);
    } else {
      const itemType = parsed.length > 0 ? inferType(parsed[0]) : 'unknown';
      lines.push(`export type Root = ${itemType}[];`);
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    processValue(parsed, 'Root');
  } else {
    lines.push(`export type Root = ${inferType(parsed)};`);
  }

  return lines.join('\n\n');
}

const SAMPLE_JSON = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "age": 30,
  "isActive": true,
  "score": 9.8,
  "tags": ["admin", "user"],
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zip": "12345"
  },
  "metadata": null
}`;

export default function JsonToTypesTool() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    const result = jsonToTypes(input.trim());
    if (result.startsWith('//')) { setError(result); setOutput(''); }
    else { setOutput(result); setError(''); }
  }, [input]);

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="jt-tool">
      <div className="jt-tool__panes">
        <div className="jt-tool__pane">
          <div className="jt-tool__pane-header">JSON Input</div>
          <textarea
            className="jt-tool__textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            placeholder='Paste your JSON here…'
          />
          {error && <div className="jt-tool__error">{error}</div>}
        </div>

        <div className="jt-tool__pane">
          <div className="jt-tool__pane-header">
            TypeScript Types
            {output && (
              <button className="btn btn-sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
            )}
          </div>
          <pre className="jt-tool__output">{output || (error ? '' : '// Output will appear here…')}</pre>
        </div>
      </div>

      <style>{`
        .jt-tool { display: flex; flex-direction: column; gap: 12px; }
        .jt-tool__panes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 700px) { .jt-tool__panes { grid-template-columns: 1fr; } }
        .jt-tool__pane {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;
        }
        .jt-tool__pane-header {
          padding: 8px 12px; background: var(--bg); border-bottom: 1px solid var(--surface-border);
          font-size: 12px; font-weight: 600; color: var(--text-secondary);
          display: flex; justify-content: space-between; align-items: center;
        }
        .jt-tool__textarea {
          flex: 1; padding: 14px; font-size: 13px; font-family: 'Menlo','Consolas',monospace;
          background: var(--bg-surface); color: var(--text); border: none; outline: none;
          resize: none; min-height: 420px;
        }
        .jt-tool__output {
          padding: 14px; font-size: 13px; font-family: 'Menlo','Consolas',monospace;
          color: var(--text); white-space: pre-wrap; word-break: break-word;
          overflow-y: auto; min-height: 420px; margin: 0;
        }
        .jt-tool__error { padding: 8px 12px; font-size: 12px; color: #f87171; background: rgba(248,113,113,0.08); border-top: 1px solid var(--surface-border); }
        .btn.btn-sm { padding: 4px 10px; font-size: 11px; cursor: pointer; background: var(--surface-raised); border: 1px solid var(--surface-border); color: var(--text); border-radius: 4px; }
        .btn.btn-sm:hover { background: var(--surface-hover); }
      `}</style>
    </div>
  );
}
