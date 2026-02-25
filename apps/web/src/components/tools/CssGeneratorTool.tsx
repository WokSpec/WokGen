'use client';

import { useState, useMemo } from 'react';

type Tab = 'gradient' | 'shadow' | 'glass' | 'border' | 'animation';

export default function CssGeneratorTool() {
  const [tab, setTab] = useState<Tab>('gradient');
  const [copied, setCopied] = useState(false);

  // ── Gradient ──────────────────────────────────────────────────────────────
  const [gType, setGType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [gAngle, setGAngle] = useState(135);
  const [gStops, setGStops] = useState([{ color: '#6366f1', pos: 0 }, { color: '#ec4899', pos: 100 }]);

  // ── Shadow ────────────────────────────────────────────────────────────────
  const [shX, setShX] = useState(0);
  const [shY, setShY] = useState(4);
  const [shBlur, setShBlur] = useState(16);
  const [shSpread, setShSpread] = useState(0);
  const [shColor, setShColor] = useState('#00000040');
  const [shInset, setShInset] = useState(false);

  // ── Glass ─────────────────────────────────────────────────────────────────
  const [glBlur, setGlBlur] = useState(10);
  const [glSat, setGlSat] = useState(180);
  const [glBg, setGlBg] = useState('rgba(255,255,255,0.15)');
  const [glBorder, setGlBorder] = useState('rgba(255,255,255,0.2)');

  // ── Border ────────────────────────────────────────────────────────────────
  const [brTl, setBrTl] = useState(8);
  const [brTr, setBrTr] = useState(8);
  const [brBl, setBrBl] = useState(8);
  const [brBr, setBrBr] = useState(8);
  const [brLink, setBrLink] = useState(true);

  const setBr = (val: number) => { if (brLink) { setBrTl(val); setBrTr(val); setBrBl(val); setBrBr(val); } }

  // ── Generate CSS ─────────────────────────────────────────────────────────
  const css = useMemo(() => {
    switch (tab) {
      case 'gradient': {
        const stops = gStops.map(s => `${s.color} ${s.pos}%`).join(', ');
        if (gType === 'linear') return `background: linear-gradient(${gAngle}deg, ${stops});`;
        if (gType === 'radial') return `background: radial-gradient(circle, ${stops});`;
        return `background: conic-gradient(from ${gAngle}deg, ${stops});`;
      }
      case 'shadow':
        return `box-shadow: ${shInset ? 'inset ' : ''}${shX}px ${shY}px ${shBlur}px ${shSpread}px ${shColor};`;
      case 'glass':
        return [
          `background: ${glBg};`,
          `backdrop-filter: blur(${glBlur}px) saturate(${glSat}%);`,
          `-webkit-backdrop-filter: blur(${glBlur}px) saturate(${glSat}%);`,
          `border: 1px solid ${glBorder};`,
          `border-radius: 12px;`,
        ].join('\n');
      case 'border':
        return `border-radius: ${brTl}px ${brTr}px ${brBr}px ${brBl}px;`;
      case 'animation':
        return `/* Select an animation below */`;
    }
  }, [tab, gType, gAngle, gStops, shX, shY, shBlur, shSpread, shColor, shInset, glBlur, glSat, glBg, glBorder, brTl, brTr, brBr, brBl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const gradientPreview = useMemo(() => {
    const stops = gStops.map(s => `${s.color} ${s.pos}%`).join(', ');
    if (gType === 'linear') return `linear-gradient(${gAngle}deg, ${stops})`;
    if (gType === 'radial') return `radial-gradient(circle, ${stops})`;
    return `conic-gradient(from ${gAngle}deg, ${stops})`;
  }, [gType, gAngle, gStops]);

  return (
    <div className="css-gen-tool">
      {/* Tabs */}
      <div className="json-tool-modes">
        {(['gradient','shadow','glass','border','animation'] as Tab[]).map(t => (
          <button key={t} className={`json-mode-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="css-gen-body">
        {/* Gradient */}
        {tab === 'gradient' && (
          <div className="css-controls">
            <div className="css-gen-preview" style={{ background: gradientPreview }} />

            <div className="gen-row">
              {(['linear','radial','conic'] as const).map(t => (
                <button key={t} className={`json-mode-btn${gType === t ? ' active' : ''}`} onClick={() => setGType(t)}>{t}</button>
              ))}
            </div>

            {(gType === 'linear' || gType === 'conic') && (
              <div className="gen-row">
                <label className="gen-label">Angle: {gAngle}°</label>
                <input type="range" min={0} max={360} value={gAngle} onChange={e => setGAngle(+e.target.value)} className="gen-slider" />
              </div>
            )}

            <div className="css-stops">
              {gStops.map((s, i) => (
                <div key={i} className="css-stop-row">
                  <input type="color" className="color-picker-native" value={s.color} onChange={e => setGStops(p => p.map((x, j) => j===i ? {...x, color: e.target.value} : x))} />
                  <input className="tool-input-sm" value={s.color} onChange={e => setGStops(p => p.map((x, j) => j===i ? {...x, color: e.target.value} : x))} />
                  <input type="range" min={0} max={100} value={s.pos} onChange={e => setGStops(p => p.map((x, j) => j===i ? {...x, pos: +e.target.value} : x))} className="gen-slider" />
                  <span className="gen-label">{s.pos}%</span>
                  {gStops.length > 2 && <button className="btn-ghost-xs" onClick={() => setGStops(p => p.filter((_,j) => j!==i))}>Remove</button>}
                </div>
              ))}
              {gStops.length < 6 && <button className="btn-ghost" onClick={() => setGStops(p => [...p, { color: '#ffffff', pos: 100 }])}>+ Add Stop</button>}
            </div>
          </div>
        )}

        {/* Shadow */}
        {tab === 'shadow' && (
          <div className="css-controls">
            <div className="css-gen-preview css-shadow-preview" style={{ boxShadow: `${shInset ? 'inset ' : ''}${shX}px ${shY}px ${shBlur}px ${shSpread}px ${shColor}` }}>
              Preview Box
            </div>
            {([
              ['X offset', shX, setShX, -50, 50],
              ['Y offset', shY, setShY, -50, 50],
              ['Blur', shBlur, setShBlur, 0, 100],
              ['Spread', shSpread, setShSpread, -50, 50],
            ] as [string, number, (v: number) => void, number, number][]).map(([label, val, setter, min, max]) => (
              <div key={String(label)} className="gen-row">
                <label className="gen-label">{label}: {val}px</label>
                <input type="range" min={Number(min)} max={Number(max)} value={Number(val)}
                  onChange={e => (setter as (v: number) => void)(+e.target.value)} className="gen-slider" />
              </div>
            ))}
            <div className="gen-row">
              <label className="gen-label">Color</label>
              <input type="color" className="color-picker-native" value={shColor.slice(0,7)} onChange={e => setShColor(e.target.value + '40')} />
              <input className="tool-input-sm" value={shColor} onChange={e => setShColor(e.target.value)} placeholder="rgba/hex" />
            </div>
            <label className="gen-check-label"><input type="checkbox" checked={shInset} onChange={e => setShInset(e.target.checked)} /> Inset</label>
          </div>
        )}

        {/* Glass */}
        {tab === 'glass' && (
          <div className="css-controls">
            <div className="css-gen-preview css-glass-preview" style={{
              background: glBg,
              backdropFilter: `blur(${glBlur}px) saturate(${glSat}%)`,
              WebkitBackdropFilter: `blur(${glBlur}px) saturate(${glSat}%)`,
              border: `1px solid ${glBorder}`,
              borderRadius: '12px',
            }}>
              Glassmorphism Preview
            </div>
            <div className="gen-row">
              <label className="gen-label">Blur: {glBlur}px</label>
              <input type="range" min={0} max={40} value={glBlur} onChange={e => setGlBlur(+e.target.value)} className="gen-slider" />
            </div>
            <div className="gen-row">
              <label className="gen-label">Saturation: {glSat}%</label>
              <input type="range" min={100} max={300} value={glSat} onChange={e => setGlSat(+e.target.value)} className="gen-slider" />
            </div>
            <div className="gen-row">
              <label className="gen-label">Background</label>
              <input className="tool-input" value={glBg} onChange={e => setGlBg(e.target.value)} placeholder="rgba(255,255,255,0.15)" />
            </div>
            <div className="gen-row">
              <label className="gen-label">Border color</label>
              <input className="tool-input" value={glBorder} onChange={e => setGlBorder(e.target.value)} placeholder="rgba(255,255,255,0.2)" />
            </div>
          </div>
        )}

        {/* Border radius */}
        {tab === 'border' && (
          <div className="css-controls">
            <div className="css-gen-preview" style={{ borderRadius: `${brTl}px ${brTr}px ${brBr}px ${brBl}px`, background: 'var(--accent-primary)' }} />
            <label className="gen-check-label" style={{marginBottom:'0.5rem'}}><input type="checkbox" checked={brLink} onChange={e => setBrLink(e.target.checked)} /> Link all corners</label>
            {brLink ? (
              <div className="gen-row">
                <label className="gen-label">All corners: {brTl}px</label>
                <input type="range" min={0} max={200} value={brTl} onChange={e => setBr(+e.target.value)} className="gen-slider" />
              </div>
            ) : (
              ([
                ['Top Left', brTl, setBrTl],
                ['Top Right', brTr, setBrTr],
                ['Bottom Right', brBr, setBrBr],
                ['Bottom Left', brBl, setBrBl],
              ] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
                <div key={String(label)} className="gen-row">
                  <label className="gen-label">{label}: {val}px</label>
                  <input type="range" min={0} max={200} value={Number(val)} onChange={e => (setter as (v: number) => void)(+e.target.value)} className="gen-slider" />
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'animation' && (
          <div className="gen-coming-soon">
            <p>Animation builder coming soon</p>
          </div>
        )}

        {/* Output */}
        <div className="css-gen-output">
          <div className="json-panel-header">
            <span className="json-panel-label">Generated CSS</span>
            <button className="btn-ghost-xs" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
          </div>
          <pre className="css-gen-code">{css}</pre>
        </div>
      </div>
    </div>
  );
}
