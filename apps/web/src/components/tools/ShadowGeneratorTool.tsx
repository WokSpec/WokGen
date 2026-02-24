'use client';

import { useState } from 'react';

interface Shadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

type ShadowMode = 'box' | 'text';

const defaultShadow = (): Shadow => ({
  offsetX: 4,
  offsetY: 4,
  blur: 8,
  spread: 0,
  color: '#000000',
  opacity: 30,
  inset: false,
});

function shadowToCss(s: Shadow, mode: ShadowMode): string {
  const r = parseInt(s.color.slice(1, 3), 16);
  const g = parseInt(s.color.slice(3, 5), 16);
  const b = parseInt(s.color.slice(5, 7), 16);
  const alpha = (s.opacity / 100).toFixed(2);
  const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  if (mode === 'text') return `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${rgba}`;
  return `${s.inset ? 'inset ' : ''}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${rgba}`;
}

export default function ShadowGeneratorTool() {
  const [mode, setMode] = useState<ShadowMode>('box');
  const [shadows, setShadows] = useState<Shadow[]>([defaultShadow()]);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof Shadow, val: number | string | boolean) => {
    setShadows(prev => prev.map((s, i) => i === active ? { ...s, [key]: val } : s));
  };

  const addShadow = () => {
    setShadows(prev => [...prev, defaultShadow()]);
    setActive(shadows.length);
  };

  const removeShadow = (i: number) => {
    if (shadows.length === 1) return;
    setShadows(prev => prev.filter((_, idx) => idx !== i));
    setActive(Math.max(0, active - (i <= active ? 1 : 0)));
  };

  const allCss = shadows.map(s => shadowToCss(s, mode)).join(',\n  ');
  const prop = mode === 'box' ? 'box-shadow' : 'text-shadow';
  const cssOutput = `${prop}: ${allCss};`;

  const copy = () => {
    navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const s = shadows[active] ?? shadows[0];

  return (
    <div className="tool-panel">
      <div className="grad-layout">
        <div className="grad-controls">
          {/* Mode toggle */}
          <div className="grad-form-row">
            <label>Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['box', 'text'] as ShadowMode[]).map(m => (
                <button key={m} className={`btn-ghost${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
                  {m === 'box' ? 'Box Shadow' : 'Text Shadow'}
                </button>
              ))}
            </div>
          </div>

          {/* Shadow layers */}
          <div className="grad-stops-header">
            <strong>Shadow Layers</strong>
            {shadows.length < 5 && (
              <button className="btn-ghost" style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem' }} onClick={addShadow}>+ Add</button>
            )}
          </div>
          {shadows.map((_, i) => (
            <div key={i} className="grad-stop-row">
              <button
                className={`btn-ghost${active === i ? ' active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem' }}
                onClick={() => setActive(i)}
              >
                Layer {i + 1}
              </button>
              {shadows.length > 1 && (
                <button className="btn-ghost" style={{ padding: '0.1rem 0.35rem', fontSize: '0.75rem', marginLeft: 'auto' }} onClick={() => removeShadow(i)}>✕</button>
              )}
            </div>
          ))}

          {/* Controls for active shadow */}
          <div style={{ marginTop: '1rem' }}>
            {[
              { label: 'Offset X', key: 'offsetX', min: -50, max: 50, val: s.offsetX },
              { label: 'Offset Y', key: 'offsetY', min: -50, max: 50, val: s.offsetY },
              { label: 'Blur', key: 'blur', min: 0, max: 80, val: s.blur },
              ...(mode === 'box' ? [{ label: 'Spread', key: 'spread', min: -20, max: 40, val: s.spread }] : []),
              { label: 'Opacity', key: 'opacity', min: 0, max: 100, val: s.opacity },
            ].map(({ label, key, min, max, val }) => (
              <div key={key} className="br-row">
                <div className="br-row-label">
                  <span>{label}</span>
                  <strong>{val}{key === 'opacity' ? '%' : 'px'}</strong>
                </div>
                <input type="range" min={min} max={max} value={val}
                  onChange={e => update(key as keyof Shadow, Number(e.target.value))} />
              </div>
            ))}

            <div className="grad-form-row" style={{ marginTop: '0.75rem' }}>
              <label>Color</label>
              <input type="color" value={s.color} onChange={e => update('color', e.target.value)} />
            </div>

            {mode === 'box' && (
              <div className="grad-form-row">
                <label>Inset</label>
                <button className={`btn-ghost${s.inset ? ' active' : ''}`} onClick={() => update('inset', !s.inset)}>
                  {s.inset ? 'On' : 'Off'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="br-preview-area">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '2rem' }}>
            {mode === 'box' ? (
              <div style={{
                width: '120px',
                height: '120px',
                background: 'var(--bg-card)',
                borderRadius: '0.75rem',
                boxShadow: shadows.map(s => shadowToCss(s, 'box')).join(', '),
              }} />
            ) : (
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--fg)',
                textShadow: shadows.map(s => shadowToCss(s, 'text')).join(', '),
              }}>
                WokGen
              </span>
            )}
          </div>
          <pre className="grad-code" style={{ marginTop: '1rem' }}>{cssOutput}</pre>
          <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={copy}>
            {copied ? '✓ Copied!' : 'Copy CSS'}
          </button>
        </div>
      </div>
    </div>
  );
}
