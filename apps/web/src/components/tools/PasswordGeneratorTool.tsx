'use client';

import { useState, useCallback } from 'react';

const UPPER  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER  = 'abcdefghijklmnopqrstuvwxyz';
const NUMS   = '0123456789';
const SYMS   = '!@#$%^&*()-_=+[]{}|;:,.<>?';

function generatePassword(length: number, useUpper: boolean, useLower: boolean, useNums: boolean, useSyms: boolean): string {
  let charset = '';
  if (useUpper) charset += UPPER;
  if (useLower) charset += LOWER;
  if (useNums)  charset += NUMS;
  if (useSyms)  charset += SYMS;
  if (!charset) charset = LOWER;

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => charset[v % charset.length]).join('');
}

function calcStrength(pwd: string): { label: string; level: number } {
  if (pwd.length < 8)  return { label: 'Weak',        level: 1 };
  let score = 0;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length >= 16) score++;
  if (pwd.length >= 24) score++;
  if (score <= 2) return { label: 'Weak',        level: 1 };
  if (score === 3) return { label: 'Medium',      level: 2 };
  if (score === 4) return { label: 'Strong',      level: 3 };
  return             { label: 'Very Strong',   level: 4 };
}

const STRENGTH_COLORS = ['', '#f87171', '#fbbf24', '#34d399', '#818cf8'];

export default function PasswordGeneratorTool() {
  const [length,   setLength]   = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNums,  setUseNums]  = useState(true);
  const [useSyms,  setUseSyms]  = useState(false);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = useCallback(() => {
    const list = Array.from({ length: 5 }, () =>
      generatePassword(length, useUpper, useLower, useNums, useSyms)
    );
    setPasswords(list);
  }, [length, useUpper, useLower, useNums, useSyms]);

  const copy = (pwd: string, idx: number) => {
    navigator.clipboard.writeText(pwd).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="pwd-tool">
      <div className="pwd-tool__controls">
        <div className="pwd-tool__slider-wrap">
          <div className="pwd-tool__slider-label">
            <span className="tool-label" style={{ margin: 0 }}>Length</span>
            <span className="pwd-tool__length-val">{length}</span>
          </div>
          <input
            type="range" min={8} max={128} value={length}
            onChange={e => setLength(Number(e.target.value))}
            className="pwd-tool__slider"
          />
          <div className="pwd-tool__slider-ends"><span>8</span><span>128</span></div>
        </div>

        <div className="pwd-tool__checkboxes">
          {[
            { label: 'Uppercase A-Z', val: useUpper, set: setUseUpper },
            { label: 'Lowercase a-z', val: useLower, set: setUseLower },
            { label: 'Numbers 0-9',   val: useNums,  set: setUseNums  },
            { label: 'Symbols !@#…',  val: useSyms,  set: setUseSyms  },
          ].map(opt => (
            <label key={opt.label} className="pwd-tool__checkbox">
              <input type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={generate}>Generate 5 Passwords</button>

      {passwords.length > 0 && (
        <div className="pwd-tool__list">
          {passwords.map((pwd, i) => {
            const strength = calcStrength(pwd);
            return (
              <div key={i} className="pwd-tool__item">
                <span className="pwd-tool__pwd">{pwd}</span>
                <span className="pwd-tool__strength" style={{ color: STRENGTH_COLORS[strength.level] }}>
                  {strength.label}
                </span>
                <button className="pwd-tool__copy-btn" onClick={() => copy(pwd, i)}>
                  {copied === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .pwd-tool { display: flex; flex-direction: column; gap: 20px; }
        .pwd-tool__controls {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 16px;
        }
        .pwd-tool__slider-wrap { display: flex; flex-direction: column; gap: 6px; }
        .pwd-tool__slider-label { display: flex; justify-content: space-between; align-items: center; }
        .pwd-tool__length-val {
          font-size: 20px; font-weight: 700; font-family: 'Menlo','Consolas',monospace;
          color: #818cf8;
        }
        .pwd-tool__slider { width: 100%; accent-color: #818cf8; cursor: pointer; }
        .pwd-tool__slider-ends { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
        .pwd-tool__checkboxes { display: flex; flex-wrap: wrap; gap: 12px; }
        .pwd-tool__checkbox {
          display: flex; align-items: center; gap: 6px; font-size: 13px;
          color: var(--text-secondary); cursor: pointer; user-select: none;
        }
        .pwd-tool__list {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; overflow: hidden;
        }
        .pwd-tool__item {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 10px 14px; border-bottom: 1px solid var(--surface-border);
        }
        .pwd-tool__item:last-child { border-bottom: none; }
        .pwd-tool__pwd {
          flex: 1; font-size: 13px; font-family: 'Menlo','Consolas',monospace;
          color: var(--text); word-break: break-all;
        }
        .pwd-tool__strength {
          font-size: 11px; font-weight: 600; flex-shrink: 0;
          min-width: 72px; text-align: right;
        }
        .pwd-tool__copy-btn {
          padding: 4px 12px; font-size: 11px; cursor: pointer;
          background: rgba(255,255,255,0.05); color: var(--text-muted);
          border: 1px solid var(--surface-border); border-radius: 4px;
          transition: background 0.12s; flex-shrink: 0;
        }
        .pwd-tool__copy-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
