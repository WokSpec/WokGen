'use client';

import { useState } from 'react';

// ── Color conversion helpers ──────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function parseInput(raw: string): [number, number, number] | null {
  const s = raw.trim();
  if (s.startsWith('#') || /^[0-9a-fA-F]{3,6}$/.test(s)) {
    return hexToRgb(s.startsWith('#') ? s : '#' + s);
  }
  // rgb(...)
  const rgb = s.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  // hsl(...)
  const hsl = s.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)$/i);
  if (hsl) {
    const h = parseInt(hsl[1]) / 360, sv = parseInt(hsl[2]) / 100, l = parseInt(hsl[3]) / 100;
    const q = l < 0.5 ? l * (1 + sv) : l + sv - l * sv;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    return [Math.round(hue2rgb(h + 1/3) * 255), Math.round(hue2rgb(h) * 255), Math.round(hue2rgb(h - 1/3) * 255)];
  }
  // Named colors via canvas
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = s;
      const computed = ctx.fillStyle;
      if (computed.startsWith('#')) return hexToRgb(computed);
      const m = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    }
  }
  return null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className="color-conv__copy-btn" onClick={copy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function ColorConverterTool() {
  const [input, setInput] = useState('#3b82f6');

  const rgb = parseInput(input);
  const hex  = rgb ? rgbToHex(...rgb) : null;
  const hsl  = rgb ? rgbToHsl(...rgb) : null;
  const hsv  = rgb ? rgbToHsv(...rgb) : null;

  const formats = rgb && hex && hsl && hsv ? [
    { label: 'HEX',  value: hex },
    { label: 'RGB',  value: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` },
    { label: 'HSL',  value: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)` },
    { label: 'HSV',  value: `hsv(${hsv[0]}, ${hsv[1]}%, ${hsv[2]}%)` },
  ] : null;

  return (
    <div className="color-conv">
      <div className="color-conv__input-row">
        <div className="color-conv__input-wrap">
          <label className="tool-label">Color value</label>
          <input
            className="color-conv__input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="#3b82f6 or rgb(59,130,246) or blue"
            spellCheck={false}
          />
          <div className="color-conv__hint">Accepts HEX, RGB, HSL, or named colors</div>
        </div>
        {hex && (
          <div className="color-conv__swatch" style={{ background: hex }} title={hex} />
        )}
      </div>

      {!rgb && input.trim() && (
        <div className="color-conv__error">Could not parse color. Try #hex, rgb(...), hsl(...), or a CSS color name.</div>
      )}

      {formats && (
        <div className="color-conv__results">
          {formats.map(f => (
            <div key={f.label} className="color-conv__row">
              <span className="color-conv__label">{f.label}</span>
              <span className="color-conv__value">{f.value}</span>
              <CopyButton text={f.value} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        .color-conv { display: flex; flex-direction: column; gap: 20px; }
        .color-conv__input-row { display: flex; gap: 16px; align-items: flex-end; }
        .color-conv__input-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .color-conv__input {
          padding: 10px 12px; font-size: 14px; font-family: 'Menlo','Consolas',monospace;
          background: var(--bg); color: var(--text); border: 1px solid var(--surface-border);
          border-radius: 6px; outline: none; width: 100%;
        }
        .color-conv__input:focus { border-color: #818cf8; }
        .color-conv__hint { font-size: 11px; color: var(--text-muted); }
        .color-conv__swatch {
          width: 64px; height: 64px; border-radius: 8px;
          border: 1px solid var(--surface-border); flex-shrink: 0;
        }
        .color-conv__error {
          padding: 10px 14px; background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2); border-radius: 6px;
          color: #f87171; font-size: 13px;
        }
        .color-conv__results {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; overflow: hidden;
        }
        .color-conv__row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-bottom: 1px solid var(--surface-border);
        }
        .color-conv__row:last-child { border-bottom: none; }
        .color-conv__label {
          font-size: 11px; font-weight: 700; width: 36px; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0;
        }
        .color-conv__value {
          flex: 1; font-size: 14px; font-family: 'Menlo','Consolas',monospace;
          color: var(--text-secondary);
        }
        .color-conv__copy-btn {
          padding: 4px 12px; font-size: 11px; cursor: pointer;
          background: rgba(255,255,255,0.05); color: var(--text-muted);
          border: 1px solid var(--surface-border); border-radius: 4px;
          transition: background 0.12s; flex-shrink: 0;
        }
        .color-conv__copy-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
