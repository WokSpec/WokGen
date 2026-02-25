'use client';

import { useState } from 'react';

type GradientType = 'linear' | 'radial' | 'conic';
interface Stop { color: string; position: number }

export default function GradientGeneratorTool() {
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<Stop[]>([
    { color: '#8b5cf6', position: 0 },
    { color: '#06b6d4', position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const stopStr = stops.map(s => `${s.color} ${s.position}%`).join(', ');
  const getGradient = () => {
    if (type === 'linear') return `linear-gradient(${angle}deg, ${stopStr})`;
    if (type === 'radial') return `radial-gradient(circle, ${stopStr})`;
    return `conic-gradient(from ${angle}deg, ${stopStr})`;
  };
  const getCss = () => `background: ${getGradient()};`;

  const updateStop = (i: number, key: keyof Stop, val: string | number) =>
    setStops(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  const addStop = () =>
    setStops(prev => [...prev, { color: '#f59e0b', position: Math.round((prev[prev.length - 1].position + 100) / 2) }]);

  const removeStop = (i: number) => {
    setStops(prev => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getCss());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="tool-panel">
      <div className="grad-preview" style={{ background: getGradient() }} />

      <div className="grad-layout">
        <div className="grad-controls">
          <div className="grad-form-row">
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value as GradientType)}>
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
              <option value="conic">Conic</option>
            </select>
          </div>

          {type !== 'radial' && (
            <div className="grad-form-row">
              <label>Angle: {angle}°</label>
              <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(Number(e.target.value))} />
            </div>
          )}

          <div className="grad-stops-header">
            <strong>Color stops</strong>
            {stops.length < 5 && (
              <button className="btn-ghost" style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem' }} onClick={addStop}>+ Add</button>
            )}
          </div>

          {stops.map((s, i) => (
            <div key={i} className="grad-stop-row">
              <input type="color" value={s.color} onChange={e => updateStop(i, 'color', e.target.value)} />
              <code style={{ fontSize: '0.78rem', width: '5.5em', flexShrink: 0 }}>{s.color}</code>
              <input type="range" min={0} max={100} value={s.position}
                onChange={e => updateStop(i, 'position', Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: '0.78rem', width: '3em', textAlign: 'right', flexShrink: 0 }}>{s.position}%</span>
              {stops.length > 2 && (
                <button className="btn-ghost" style={{ padding: '0.1rem 0.35rem', fontSize: '0.75rem' }} onClick={() => removeStop(i)}>Remove</button>
              )}
            </div>
          ))}
        </div>

        <div className="grad-output">
          <pre className="grad-code">{getCss()}</pre>
          <button className="btn-primary" onClick={copy}>{copied ? 'Copied!' : 'Copy CSS'}</button>
        </div>
      </div>
    </div>
  );
}
