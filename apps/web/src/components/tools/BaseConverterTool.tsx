'use client';

import { useState, useCallback } from 'react';

type Base = '2' | '8' | '10' | '16';
const BASES: { id: Base; label: string; prefix: string; chars: string }[] = [
  { id: '2',  label: 'Binary',      prefix: '0b', chars: '0-1' },
  { id: '8',  label: 'Octal',       prefix: '0o', chars: '0-7' },
  { id: '10', label: 'Decimal',     prefix: '',   chars: '0-9' },
  { id: '16', label: 'Hexadecimal', prefix: '0x', chars: '0-9, A-F' },
];

function convert(value: string, fromBase: Base): Record<Base, string> | null {
  const clean = value.trim().replace(/^0[xXbBoO]/, '');
  if (!clean) return null;
  try {
    const n = parseInt(clean, parseInt(fromBase));
    if (isNaN(n)) return null;
    return {
      '2':  n.toString(2).toUpperCase(),
      '8':  n.toString(8).toUpperCase(),
      '10': n.toString(10),
      '16': n.toString(16).toUpperCase(),
    };
  } catch {
    return null;
  }
}

export default function BaseConverterTool() {
  const [value, setValue] = useState('');
  const [fromBase, setFromBase] = useState<Base>('10');
  const [copied, setCopied] = useState<Base | null>(null);

  const result = convert(value, fromBase);

  const copy = useCallback((text: string, base: Base) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(base);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  return (
    <div className="base-conv">
      <div className="base-conv__input-row">
        <div className="base-conv__input-wrap">
          <label className="tool-label">Input value</label>
          <input
            className="tool-input"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={fromBase === '16' ? 'e.g. FF or 0xFF' : fromBase === '2' ? 'e.g. 1101' : fromBase === '8' ? 'e.g. 17' : 'e.g. 255'}
            spellCheck={false}
          />
        </div>
        <div className="base-conv__from-wrap">
          <label className="tool-label">Input base</label>
          <select className="tool-select" value={fromBase} onChange={e => setFromBase(e.target.value as Base)}>
            {BASES.map(b => (
              <option key={b.id} value={b.id}>{b.label} (base {b.id})</option>
            ))}
          </select>
        </div>
      </div>

      {value && !result && (
        <div className="base-conv__error">Invalid input for base {fromBase}. Allowed characters: {BASES.find(b => b.id === fromBase)?.chars}.</div>
      )}

      {result && (
        <div className="base-conv__results">
          {BASES.map(base => (
            <div key={base.id} className={`base-conv__result ${base.id === fromBase ? 'base-conv__result--active' : ''}`}>
              <div className="base-conv__result-meta">
                <span className="base-conv__result-label">{base.label}</span>
                <span className="base-conv__result-prefix">{base.prefix || 'base ' + base.id}</span>
              </div>
              <div className="base-conv__result-row">
                <code className="base-conv__result-value">{result[base.id]}</code>
                <button
                  className="base-conv__copy-btn"
                  onClick={() => copy(result[base.id], base.id)}
                >
                  {copied === base.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!value && (
        <div className="base-conv__examples">
          <p className="base-conv__examples-title">Examples</p>
          <div className="base-conv__example-grid">
            {[
              { input: '255', base: '10' as Base, label: 'Decimal 255' },
              { input: 'FF', base: '16' as Base, label: 'Hex FF' },
              { input: '11111111', base: '2' as Base, label: 'Binary 8 bits' },
              { input: '377', base: '8' as Base, label: 'Octal 377' },
            ].map(ex => (
              <button
                key={ex.label}
                className="base-conv__example-btn"
                onClick={() => { setValue(ex.input); setFromBase(ex.base); }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .base-conv { display: flex; flex-direction: column; gap: 20px; }
        .base-conv__input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .base-conv__input-row { grid-template-columns: 1fr; } }
        .base-conv__input-wrap, .base-conv__from-wrap { display: flex; flex-direction: column; gap: 5px; }
        .base-conv__error {
          padding: 10px 14px; background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2); border-radius: 6px;
          color: #f87171; font-size: 13px;
        }
        .base-conv__results { display: flex; flex-direction: column; gap: 8px; }
        .base-conv__result {
          padding: 12px 16px; background: var(--bg-surface);
          border: 1px solid var(--surface-border); border-radius: 8px;
        }
        .base-conv__result--active { border-color: rgba(129,140,248,0.4); }
        .base-conv__result-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .base-conv__result-label { font-size: 12px; font-weight: 600; color: var(--text); }
        .base-conv__result-prefix { font-size: 11px; color: var(--text-muted); font-family: 'Menlo','Consolas',monospace; }
        .base-conv__result-row { display: flex; align-items: center; gap: 12px; }
        .base-conv__result-value {
          flex: 1; font-size: 15px; font-weight: 500; font-family: 'Menlo','Consolas',monospace;
          color: #a5b4fc; word-break: break-all;
        }
        .base-conv__copy-btn {
          flex-shrink: 0; padding: 4px 12px; font-size: 11px; cursor: pointer;
          background: rgba(255,255,255,0.05); color: var(--text-muted);
          border: 1px solid var(--surface-border); border-radius: 4px;
          transition: background 0.12s;
        }
        .base-conv__copy-btn:hover { background: rgba(255,255,255,0.1); }
        .base-conv__examples { display: flex; flex-direction: column; gap: 8px; }
        .base-conv__examples-title { font-size: 12px; color: var(--text-muted); margin: 0; }
        .base-conv__example-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .base-conv__example-btn {
          padding: 6px 12px; font-size: 12px; cursor: pointer;
          background: rgba(255,255,255,0.04); color: var(--text-secondary);
          border: 1px solid var(--surface-border); border-radius: 6px;
          transition: background 0.12s;
        }
        .base-conv__example-btn:hover { background: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  );
}
