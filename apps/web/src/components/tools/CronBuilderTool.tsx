'use client';

import { useState, useCallback } from 'react';

const PRESETS = [
  { label: 'Every minute',  value: '* * * * *' },
  { label: 'Every hour',    value: '0 * * * *' },
  { label: 'Every day',     value: '0 0 * * *' },
  { label: 'Every week',    value: '0 0 * * 0' },
  { label: 'Every month',   value: '0 0 1 * *' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function describePart(val: string, unit: string, names?: string[]): string {
  if (val === '*') return `every ${unit}`;
  if (val.startsWith('*/')) return `every ${val.slice(2)} ${unit}s`;
  if (val.includes(',')) {
    const parts = val.split(',').map(v => names ? names[parseInt(v)] ?? v : v);
    return parts.join(', ');
  }
  if (val.includes('-')) {
    const [a, b] = val.split('-');
    const na = names ? names[parseInt(a)] ?? a : a;
    const nb = names ? names[parseInt(b)] ?? b : b;
    return `${na} to ${nb}`;
  }
  return names ? names[parseInt(val)] ?? val : val;
}

function describeExpression(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression (need 5 fields)';
  const [min, hr, dom, mon, dow] = parts;
  const phrases: string[] = [];
  if (min !== '*') phrases.push(`at minute ${describePart(min, 'minute')}`);
  if (hr  !== '*') phrases.push(`hour ${describePart(hr, 'hour')}`);
  if (dom !== '*') phrases.push(`on day ${describePart(dom, 'day')} of the month`);
  if (mon !== '*') phrases.push(`in ${describePart(mon, 'month', MONTHS)}`);
  if (dow !== '*') phrases.push(`on ${describePart(dow, 'weekday', WEEKDAYS)}`);
  if (phrases.length === 0) return 'Every minute';
  return phrases.join(', ');
}

function matchesCron(date: Date, parts: string[]): boolean {
  const [min, hr, dom, mon, dow] = parts;
  const match = (val: string, n: number, offset = 0): boolean => {
    if (val === '*') return true;
    if (val.startsWith('*/')) return n % parseInt(val.slice(2)) === 0;
    if (val.includes(',')) return val.split(',').some(v => parseInt(v) - offset === n);
    if (val.includes('-')) {
      const [a, b] = val.split('-').map(Number);
      return n >= a - offset && n <= b - offset;
    }
    return parseInt(val) - offset === n;
  };
  return (
    match(min, date.getMinutes()) &&
    match(hr,  date.getHours()) &&
    match(dom, date.getDate(), 1) &&
    match(mon, date.getMonth(), -1) &&
    match(dow, date.getDay())
  );
}

function nextRuns(expr: string, count = 5): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const results: Date[] = [];
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);
  let d = new Date(now);
  let attempts = 0;
  while (results.length < count && attempts < 100000) {
    if (matchesCron(d, parts)) results.push(new Date(d));
    d = new Date(d.getTime() + 60000);
    attempts++;
  }
  return results;
}

export default function CronBuilderTool() {
  const [expr, setExpr] = useState('0 9 * * 1-5');
  const [copied, setCopied] = useState(false);

  const parts = expr.trim().split(/\s+/);
  const isValid = parts.length === 5;
  const description = describeExpression(expr);
  const runs = isValid ? nextRuns(expr) : [];

  const setPart = useCallback((idx: number, val: string) => {
    const p = expr.trim().split(/\s+/);
    while (p.length < 5) p.push('*');
    p[idx] = val || '*';
    setExpr(p.join(' '));
  }, [expr]);

  const copy = () => {
    navigator.clipboard.writeText(expr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const FIELDS = ['Minute', 'Hour', 'Day', 'Month', 'Weekday'];

  return (
    <div className="cron-tool">
      <div className="cron-tool__presets">
        {PRESETS.map(p => (
          <button key={p.value} className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setExpr(p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="cron-tool__fields">
        {FIELDS.map((label, i) => (
          <div key={label} className="cron-tool__field">
            <label className="tool-label">{label}</label>
            <input
              className="cron-tool__input"
              value={parts[i] ?? '*'}
              onChange={e => setPart(i, e.target.value)}
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      <div className="cron-tool__expr-row">
        <input className="cron-tool__expr-input" value={expr} onChange={e => setExpr(e.target.value)} spellCheck={false} />
        <button className="btn btn-primary" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>

      <div className="cron-tool__desc">{description}</div>

      {runs.length > 0 && (
        <div className="cron-tool__runs">
          <div className="cron-tool__runs-title">Next 5 run dates</div>
          {runs.map((d, i) => (
            <div key={i} className="cron-tool__run">{d.toLocaleString()}</div>
          ))}
        </div>
      )}

      <style>{`
        .cron-tool { display: flex; flex-direction: column; gap: 18px; }
        .cron-tool__presets { display: flex; flex-wrap: wrap; gap: 8px; }
        .cron-tool__fields { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        @media (max-width: 640px) { .cron-tool__fields { grid-template-columns: repeat(3, 1fr); } }
        .cron-tool__field { display: flex; flex-direction: column; gap: 4px; }
        .cron-tool__input {
          padding: 8px 10px; font-size: 14px; font-family: 'Menlo','Consolas',monospace;
          background: var(--bg); color: var(--text); border: 1px solid var(--surface-border);
          border-radius: 6px; outline: none; text-align: center;
        }
        .cron-tool__input:focus { border-color: #818cf8; }
        .cron-tool__expr-row { display: flex; gap: 8px; }
        .cron-tool__expr-input {
          flex: 1; padding: 10px 12px; font-size: 14px; font-family: 'Menlo','Consolas',monospace;
          background: var(--bg); color: var(--text); border: 1px solid var(--surface-border);
          border-radius: 6px; outline: none;
        }
        .cron-tool__expr-input:focus { border-color: #818cf8; }
        .cron-tool__desc {
          padding: 12px 16px; background: rgba(129,140,248,0.08);
          border: 1px solid rgba(129,140,248,0.2); border-radius: 6px;
          color: #a5b4fc; font-size: 14px;
        }
        .cron-tool__runs {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; overflow: hidden;
        }
        .cron-tool__runs-title {
          padding: 8px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--text-muted);
          border-bottom: 1px solid var(--surface-border);
          background: rgba(255,255,255,0.02);
        }
        .cron-tool__run {
          padding: 8px 14px; font-size: 13px; color: var(--text-secondary);
          border-bottom: 1px solid var(--surface-border);
          font-family: 'Menlo','Consolas',monospace;
        }
        .cron-tool__run:last-child { border-bottom: none; }
      `}</style>
    </div>
  );
}
