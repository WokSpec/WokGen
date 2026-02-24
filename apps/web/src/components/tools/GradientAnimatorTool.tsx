'use client';

import { useState, useEffect, useRef } from 'react';

interface Stop { color: string; position: number }

export default function GradientAnimatorTool() {
  const [stops, setStops] = useState<Stop[]>([
    { color: '#8b5cf6', position: 0 },
    { color: '#06b6d4', position: 50 },
    { color: '#f59e0b', position: 100 },
  ]);
  const [angle, setAngle] = useState(135);
  const [speed, setSpeed] = useState(4);
  const [playing, setPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const stopStr = stops.map(s => `${s.color} ${s.position}%`).join(', ');
  const shifted = [...stops.map(s => ({ ...s, position: (s.position + 50) % 100 }))].sort((a, b) => a.position - b.position);
  const shiftedStr = shifted.map(s => `${s.color} ${s.position}%`).join(', ');

  const animName = 'wg-grad-anim';
  const keyframes = `@keyframes ${animName} {
  0%   { background: linear-gradient(${angle}deg, ${stopStr}); }
  50%  { background: linear-gradient(${angle + 180}deg, ${shiftedStr}); }
  100% { background: linear-gradient(${angle}deg, ${stopStr}); }
}`;

  const cssOutput = `${keyframes}

.animated-gradient {
  animation: ${animName} ${speed}s ease infinite;
}`;

  useEffect(() => {
    if (!styleRef.current) {
      const el = document.createElement('style');
      el.id = 'wg-grad-anim-style';
      document.head.appendChild(el);
      styleRef.current = el;
    }
    styleRef.current.textContent = keyframes;
  }, [keyframes]);

  const updateStop = (i: number, key: keyof Stop, val: string | number) =>
    setStops(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  const addStop = () =>
    setStops(prev => [...prev, { color: '#ec4899', position: 75 }]);

  const removeStop = (i: number) => {
    if (stops.length <= 2) return;
    setStops(prev => prev.filter((_, idx) => idx !== i));
  };

  const copy = () => {
    navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="tool-panel">
      <div className="grad-layout">
        <div className="grad-controls">
          <div className="br-row">
            <div className="br-row-label">
              <span>Angle</span>
              <strong>{angle}°</strong>
            </div>
            <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(Number(e.target.value))} />
          </div>

          <div className="br-row">
            <div className="br-row-label">
              <span>Speed</span>
              <strong>{speed}s</strong>
            </div>
            <input type="range" min={1} max={20} step={0.5} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
          </div>

          <div className="grad-stops-header" style={{ marginTop: '0.75rem' }}>
            <strong>Color Stops</strong>
            {stops.length < 6 && (
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
                <button className="btn-ghost" style={{ padding: '0.1rem 0.35rem', fontSize: '0.75rem' }} onClick={() => removeStop(i)}>✕</button>
              )}
            </div>
          ))}

          <button
            className={`btn-ghost${playing ? ' active' : ''}`}
            style={{ marginTop: '0.75rem' }}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        <div className="br-preview-area">
          <div
            style={{
              height: '200px',
              borderRadius: '0.75rem',
              animation: playing ? `${animName} ${speed}s ease infinite` : 'none',
              background: `linear-gradient(${angle}deg, ${stopStr})`,
            }}
          />
          <pre className="grad-code" style={{ marginTop: '1rem', fontSize: '0.72rem' }}>{cssOutput}</pre>
          <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={copy}>
            {copied ? '✓ Copied!' : 'Copy CSS'}
          </button>
        </div>
      </div>
    </div>
  );
}
