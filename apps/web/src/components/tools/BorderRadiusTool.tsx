'use client';

import { useState } from 'react';

type Unit = 'px' | '%';

export default function BorderRadiusTool() {
  const [tl, setTl] = useState(8);
  const [tr, setTr] = useState(8);
  const [br, setBr] = useState(8);
  const [bl, setBl] = useState(8);
  const [unit, setUnit] = useState<Unit>('px');
  const [linked, setLinked] = useState(false);
  const [copied, setCopied] = useState(false);

  const max = unit === 'px' ? 100 : 50;

  const setAll = (val: number) => { setTl(val); setTr(val); setBr(val); setBl(val); };
  const handle = (setter: (v: number) => void, val: number) => { if (linked) setAll(val); else setter(val); };

  const cssVal = `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
  const css = `border-radius: ${cssVal};`;

  const copy = () => {
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const corners: Array<{ label: string; val: number; set: (v: number) => void }> = [
    { label: 'Top Left', val: tl, set: setTl },
    { label: 'Top Right', val: tr, set: setTr },
    { label: 'Bottom Right', val: br, set: setBr },
    { label: 'Bottom Left', val: bl, set: setBl },
  ];

  return (
    <div className="tool-panel">
      <div className="br-layout">
        <div className="br-controls">
          <div className="br-top-row">
            <div className="br-unit-toggle">
              {(['px', '%'] as Unit[]).map(u => (
                <button key={u} className={`btn-ghost${unit === u ? ' active' : ''}`} onClick={() => setUnit(u)}>{u}</button>
              ))}
            </div>
            <button
              className={`btn-ghost${linked ? ' active' : ''}`}
              onClick={() => setLinked(!linked)}
              title="Link all corners"
            >
              {linked ? 'Linked' : 'Individual'}
            </button>
          </div>

          {corners.map(({ label, val, set }) => (
            <div key={label} className="br-row">
              <div className="br-row-label">
                <span>{label}</span>
                <strong>{val}{unit}</strong>
              </div>
              <input type="range" min={0} max={max} value={val} onChange={e => handle(set, Number(e.target.value))} />
            </div>
          ))}
        </div>

        <div className="br-preview-area">
          <div className="br-preview-box" style={{ borderRadius: cssVal }} />
          <pre className="grad-code" style={{ marginTop: '1rem' }}>{css}</pre>
          <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={copy}>
            {copied ? '✓ Copied!' : 'Copy CSS'}
          </button>
        </div>
      </div>
    </div>
  );
}
