'use client';

import { useState } from 'react';

const RATIOS = [
  { name: 'Minor Second', value: 1.067 },
  { name: 'Major Second', value: 1.125 },
  { name: 'Minor Third', value: 1.2 },
  { name: 'Major Third', value: 1.25 },
  { name: 'Perfect Fourth', value: 1.333 },
  { name: 'Augmented Fourth', value: 1.414 },
  { name: 'Perfect Fifth', value: 1.5 },
  { name: 'Golden Ratio', value: 1.618 },
];

const STEPS = [
  { name: 'xs', exp: -2 },
  { name: 'sm', exp: -1 },
  { name: 'base', exp: 0 },
  { name: 'md', exp: 1 },
  { name: 'lg', exp: 2 },
  { name: 'xl', exp: 3 },
  { name: '2xl', exp: 4 },
  { name: '3xl', exp: 5 },
];

export default function TypeScaleTool() {
  const [base, setBase] = useState(16);
  const [ratioIdx, setRatioIdx] = useState(4);
  const [previewText, setPreviewText] = useState('The quick brown fox');
  const [copied, setCopied] = useState(false);

  const ratio = RATIOS[ratioIdx].value;
  const sizes = STEPS.map(s => {
    const px = Math.round(base * Math.pow(ratio, s.exp) * 100) / 100; // base * ratio^exp
    const rem = Math.round((px / 16) * 1000) / 1000;
    return { ...s, px, rem };
  });

  const copyCss = () => {
    const vars = sizes.map(s => `  --text-${s.name}: ${s.rem}rem;`).join('\n');
    navigator.clipboard.writeText(`:root {\n${vars}\n}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="tool-panel">
      <div className="type-scale-controls">
        <label className="type-scale-label">
          <span>Base size (px)</span>
          <input type="number" min={8} max={32} value={base} onChange={e => setBase(Number(e.target.value))} className="type-scale-input" />
        </label>
        <label className="type-scale-label">
          <span>Scale ratio</span>
          <select value={ratioIdx} onChange={e => setRatioIdx(Number(e.target.value))} className="type-scale-input">
            {RATIOS.map((r, i) => <option key={i} value={i}>{r.name} ({r.value})</option>)}
          </select>
        </label>
        <label className="type-scale-label" style={{ flex: '1 1 200px' }}>
          <span>Preview text</span>
          <input value={previewText} onChange={e => setPreviewText(e.target.value)} className="type-scale-input" />
        </label>
      </div>

      <div className="type-scale-preview">
        {[...sizes].reverse().map(s => (
          <div key={s.name} className="type-scale-row">
            <div className="type-scale-meta">
              <code className="type-scale-name">{s.name}</code>
              <span className="type-scale-size">{s.px}px / {s.rem}rem</span>
            </div>
            <div className="type-scale-sample" style={{ fontSize: `${s.rem}rem`, lineHeight: 1.2 }}>
              {previewText}
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={copyCss}>
        {copied ? 'Copied!' : 'Copy CSS variables'}
      </button>
    </div>
  );
}
