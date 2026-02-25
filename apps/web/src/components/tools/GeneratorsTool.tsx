'use client';

import { useState, useCallback } from 'react';

type Tab = 'uuid' | 'password' | 'lorem' | 'cron' | 'timestamp' | 'diff';

// ── UUID ──────────────────────────────────────────────────────────────────

function genUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── Password ───────────────────────────────────────────────────────────────

const CHARS = {
  lower:  'abcdefghijklmnopqrstuvwxyz',
  upper:  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function genPassword(length: number, opts: { lower: boolean; upper: boolean; digits: boolean; symbols: boolean }) {
  let pool = '';
  if (opts.lower)   pool += CHARS.lower;
  if (opts.upper)   pool += CHARS.upper;
  if (opts.digits)  pool += CHARS.digits;
  if (opts.symbols) pool += CHARS.symbols;
  if (!pool) return '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(n => pool[n % pool.length]).join('');
}

function entropy(pw: string) {
  const pool = [
    /[a-z]/.test(pw) ? 26 : 0,
    /[A-Z]/.test(pw) ? 26 : 0,
    /\d/.test(pw)    ? 10 : 0,
    /[^a-zA-Z0-9]/.test(pw) ? 32 : 0,
  ].reduce((a, b) => a + b, 0);
  return Math.log2(Math.pow(pool || 1, pw.length));
}

// ── Lorem ─────────────────────────────────────────────────────────────────

const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

function lorem(count: number, unit: 'words' | 'sentences' | 'paragraphs') {
  const words = (n: number) => Array.from({length: n}, (_, i) => WORDS[(i * 7 + 3) % WORDS.length]).join(' ');
  const sentence = () => { const w = words(8 + Math.floor(Math.random() * 12)); return w.charAt(0).toUpperCase() + w.slice(1) + '.'; };
  const paragraph = () => Array.from({length: 4 + Math.floor(Math.random() * 4)}, sentence).join(' ');
  if (unit === 'words') return words(count);
  if (unit === 'sentences') return Array.from({length: count}, sentence).join(' ');
  return Array.from({length: count}, paragraph).join('\n\n');
}

// ── Diff ──────────────────────────────────────────────────────────────────

function diffLines(a: string, b: string) {
  const la = a.split('\n');
  const lb = b.split('\n');
  const result: { type: 'same' | 'add' | 'del'; text: string }[] = [];
  let i = 0, j = 0;
  while (i < la.length || j < lb.length) {
    if (i < la.length && j < lb.length && la[i] === lb[j]) {
      result.push({ type: 'same', text: la[i] }); i++; j++;
    } else if (j < lb.length && (i >= la.length || la[i] !== lb[j])) {
      result.push({ type: 'add', text: lb[j] }); j++;
    } else {
      result.push({ type: 'del', text: la[i] }); i++;
    }
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function GeneratorsTool() {
  const [tab, setTab] = useState<Tab>('uuid');
  const [uuids, setUuids] = useState<string[]>([]);
  const [uuidCount, setUuidCount] = useState(5);
  const [pw, setPw] = useState('');
  const [pwLen, setPwLen] = useState(20);
  const [pwOpts, setPwOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [loremText, setLoremText] = useState('');
  const [loremCount, setLoremCount] = useState(3);
  const [loremUnit, setLoremUnit] = useState<'words' | 'sentences' | 'paragraphs'>('paragraphs');
  const [ts, setTs] = useState('');
  const [diffA, setDiffA] = useState('');
  const [diffB, setDiffB] = useState('');
  const [diffs, setDiffs] = useState<ReturnType<typeof diffLines>>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text.slice(0, 20));
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const now = new Date();
  const allUuids = uuids.join('\n');

  return (
    <div className="gen-tool">
      {/* Tabs */}
      <div className="json-tool-modes">
        {(['uuid','password','lorem','cron','timestamp','diff'] as Tab[]).map(t => (
          <button key={t} className={`json-mode-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* UUID */}
      {tab === 'uuid' && (
        <div className="gen-section">
          <div className="gen-row">
            <label className="gen-label">Count</label>
            <input className="tool-input-sm" type="number" min={1} max={100} value={uuidCount} onChange={e => setUuidCount(+e.target.value)} />
            <button className="btn-primary" onClick={() => setUuids(Array.from({length: uuidCount}, genUUID))}>Generate</button>
            {uuids.length > 0 && <button className="btn-ghost" onClick={() => copy(allUuids)}>{copied === allUuids.slice(0,20) ? 'Copied!' : 'Copy All'}</button>}
          </div>
          {uuids.map((u, i) => (
            <div key={i} className="gen-item">
              <code className="gen-value">{u}</code>
              <button className="btn-ghost-xs" onClick={() => copy(u)}>{copied === u.slice(0,20) ? 'Copied!' : 'Copy'}</button>
            </div>
          ))}
        </div>
      )}

      {/* Password */}
      {tab === 'password' && (
        <div className="gen-section">
          <div className="gen-row">
            <label className="gen-label">Length: {pwLen}</label>
            <input type="range" min={8} max={128} value={pwLen} onChange={e => setPwLen(+e.target.value)} className="gen-slider" />
          </div>
          <div className="gen-row gen-checkboxes">
            {Object.entries(pwOpts).map(([k, v]) => (
              <label key={k} className="gen-check-label">
                <input type="checkbox" checked={v} onChange={e => setPwOpts(p => ({...p, [k]: e.target.checked}))} />
                {k}
              </label>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setPw(genPassword(pwLen, pwOpts))}>Generate Password</button>
          {pw && (
            <div className="gen-pw-result">
              <code className="gen-pw-value">{pw}</code>
              <button className="btn-ghost-xs" onClick={() => copy(pw)}>{copied === pw.slice(0,20) ? 'Copied!' : 'Copy'}</button>
              <div className="gen-entropy">
                Entropy: {entropy(pw).toFixed(0)} bits
                <span className={`gen-entropy-badge ${entropy(pw) < 40 ? 'weak' : entropy(pw) < 80 ? 'fair' : 'strong'}`}>
                  {entropy(pw) < 40 ? 'Weak' : entropy(pw) < 80 ? 'Good' : 'Strong'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lorem */}
      {tab === 'lorem' && (
        <div className="gen-section">
          <div className="gen-row">
            <input className="tool-input-sm" type="number" min={1} max={50} value={loremCount} onChange={e => setLoremCount(+e.target.value)} />
            {(['words','sentences','paragraphs'] as const).map(u => (
              <button key={u} className={`json-mode-btn${loremUnit === u ? ' active' : ''}`} onClick={() => setLoremUnit(u)}>{u}</button>
            ))}
            <button className="btn-primary" onClick={() => setLoremText(lorem(loremCount, loremUnit))}>Generate</button>
            {loremText && <button className="btn-ghost" onClick={() => copy(loremText)}>{copied === loremText.slice(0,20) ? 'Copied!' : 'Copy'}</button>}
          </div>
          {loremText && <div className="gen-lorem-output">{loremText}</div>}
        </div>
      )}

      {/* Timestamp */}
      {tab === 'timestamp' && (
        <div className="gen-section gen-ts">
          <div className="gen-ts-current">
            <div className="gen-ts-row"><span className="gen-label">Unix (s)</span><code>{Math.floor(now.getTime()/1000)}</code><button className="btn-ghost-xs" onClick={() => copy(String(Math.floor(now.getTime()/1000)))}>{copied === String(Math.floor(now.getTime()/1000)).slice(0,20) ? 'Copied!' : 'Copy'}</button></div>
            <div className="gen-ts-row"><span className="gen-label">Unix (ms)</span><code>{now.getTime()}</code><button className="btn-ghost-xs" onClick={() => copy(String(now.getTime()))}>{copied === String(now.getTime()).slice(0,20) ? 'Copied!' : 'Copy'}</button></div>
            <div className="gen-ts-row"><span className="gen-label">ISO 8601</span><code>{now.toISOString()}</code><button className="btn-ghost-xs" onClick={() => copy(now.toISOString())}>{copied === now.toISOString().slice(0,20) ? 'Copied!' : 'Copy'}</button></div>
            <div className="gen-ts-row"><span className="gen-label">RFC 2822</span><code>{now.toUTCString()}</code><button className="btn-ghost-xs" onClick={() => copy(now.toUTCString())}>{copied === now.toUTCString().slice(0,20) ? 'Copied!' : 'Copy'}</button></div>
          </div>
          <div className="gen-row" style={{marginTop:'1rem'}}>
            <label className="gen-label">Convert timestamp</label>
            <input className="tool-input" placeholder="Unix timestamp or date string…" value={ts} onChange={e => setTs(e.target.value)} />
          </div>
          {ts && (() => {
            const n = isNaN(+ts) ? new Date(ts) : new Date(+ts * (String(ts).length <= 10 ? 1000 : 1));
            return isNaN(n.getTime()) ? <p className="regex-error-msg">Invalid date/timestamp</p> : (
              <div className="gen-ts-current">
                <div className="gen-ts-row"><span className="gen-label">Local</span><code>{n.toLocaleString()}</code></div>
                <div className="gen-ts-row"><span className="gen-label">ISO</span><code>{n.toISOString()}</code></div>
                <div className="gen-ts-row"><span className="gen-label">Unix (s)</span><code>{Math.floor(n.getTime()/1000)}</code></div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Diff */}
      {tab === 'diff' && (
        <div className="gen-section">
          <div className="json-tool-panels">
            <div className="json-panel">
              <div className="json-panel-header"><span className="json-panel-label">Text A</span></div>
              <textarea className="json-textarea" rows={8} value={diffA} onChange={e => setDiffA(e.target.value)} placeholder="Original text…" />
            </div>
            <div className="json-panel-separator">
              <button className="btn-primary json-run-btn" onClick={() => setDiffs(diffLines(diffA, diffB))}>→ Diff</button>
            </div>
            <div className="json-panel">
              <div className="json-panel-header"><span className="json-panel-label">Text B</span></div>
              <textarea className="json-textarea" rows={8} value={diffB} onChange={e => setDiffB(e.target.value)} placeholder="Modified text…" />
            </div>
          </div>
          {diffs.length > 0 && (
            <div className="gen-diff-output">
              {diffs.map((d, i) => (
                <div key={i} className={`diff-line diff-line-${d.type}`}>
                  <span className="diff-gutter">{d.type === 'add' ? '+' : d.type === 'del' ? '-' : ' '}</span>
                  <span className="diff-text">{d.text || '\u00a0'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'cron' && (
        <div className="gen-section gen-coming-soon">
          <p>CRON builder coming soon</p>
          <p className="tool-shell-soon-desc">Interactive CRON expression builder with human-readable descriptions.</p>
        </div>
      )}
    </div>
  );
}
