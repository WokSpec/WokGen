'use client';

import { useState } from 'react';

interface StandardRatio { label: string; w: number; h: number }
interface SocialPreset { label: string; w: number; h: number; platform: string }

const STD_RATIOS: StandardRatio[] = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '9:16', w: 9, h: 16 },
  { label: '21:9', w: 21, h: 9 },
  { label: '3:2', w: 3, h: 2 },
  { label: '2:3', w: 2, h: 3 },
  { label: '5:4', w: 5, h: 4 },
];

const SOCIAL_PRESETS: SocialPreset[] = [
  { platform: 'YouTube', label: 'Cover', w: 1920, h: 1080 },
  { platform: 'Instagram', label: 'Square', w: 1080, h: 1080 },
  { platform: 'Instagram', label: 'Portrait', w: 1080, h: 1350 },
  { platform: 'Twitter/X', label: 'Post', w: 1600, h: 900 },
  { platform: 'Twitter/X', label: 'Header', w: 1500, h: 500 },
  { platform: 'Facebook', label: 'Post', w: 1200, h: 630 },
  { platform: 'LinkedIn', label: 'Post', w: 1200, h: 627 },
  { platform: 'TikTok', label: 'Video', w: 1080, h: 1920 },
  { platform: 'Pinterest', label: 'Pin', w: 1000, h: 1500 },
  { platform: 'OG Image', label: 'Default', w: 1200, h: 630 },
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplify(w: number, h: number): string {
  if (!w || !h) return '?:?';
  const d = gcd(Math.round(w), Math.round(h));
  return `${Math.round(w) / d}:${Math.round(h) / d}`;
}

function closestStd(w: number, h: number): string {
  if (!w || !h) return '';
  const ratio = w / h;
  let best = STD_RATIOS[0];
  let bestDiff = Infinity;
  for (const r of STD_RATIOS) {
    const diff = Math.abs(ratio - r.w / r.h);
    if (diff < bestDiff) { bestDiff = diff; best = r; }
  }
  return best.label;
}

export default function AspectRatioTool() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [fixWidth, setFixWidth] = useState(1920);
  const [fixHeight, setFixHeight] = useState(1080);

  const ratio = width && height ? width / height : 1;
  const simplified = simplify(width, height);
  const closest = closestStd(width, height);

  const derivedHeight = width && height ? Math.round(fixWidth / ratio) : 0;
  const derivedWidth = width && height ? Math.round(fixHeight * ratio) : 0;

  return (
    <div className="tool-panel">
      <div className="grad-layout">
        <div className="grad-controls">
          <div className="grad-form-row">
            <label>Width (px)</label>
            <input
              type="number" min={1} value={width}
              onChange={e => setWidth(Number(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
          <div className="grad-form-row">
            <label>Height (px)</label>
            <input
              type="number" min={1} value={height}
              onChange={e => setHeight(Number(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <strong>Standard Ratios</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {STD_RATIOS.map(r => {
                const isClosest = r.label === closest;
                return (
                  <button
                    key={r.label}
                    className={`btn-ghost${isClosest ? ' active' : ''}`}
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => {
                      const newH = Math.round(width * r.h / r.w);
                      setHeight(newH);
                      setFixHeight(newH);
                    }}
                    title={isClosest ? 'Closest match' : ''}
                  >
                    {r.label}{isClosest ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <strong>Calculate Dimensions</strong>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="grad-form-row">
                <label>Fix width to</label>
                <input type="number" min={1} value={fixWidth} onChange={e => setFixWidth(Number(e.target.value))} style={{ width: '90px' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--fg-muted)' }}>→ height: <strong>{derivedHeight}px</strong></span>
              </div>
              <div className="grad-form-row">
                <label>Fix height to</label>
                <input type="number" min={1} value={fixHeight} onChange={e => setFixHeight(Number(e.target.value))} style={{ width: '90px' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--fg-muted)' }}>→ width: <strong>{derivedWidth}px</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="br-preview-area">
          {/* Visual ratio preview */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <div style={{
                width: Math.min(200, 200 * Math.min(1, ratio)),
                height: Math.min(150, 150 * Math.min(1, 1 / ratio)),
                background: 'linear-gradient(135deg, var(--accent-primary), #06b6d4)',
                borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{simplified}</span>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--fg-muted)' }}>
              {width} × {height} px · closest: <strong>{closest}</strong>
            </div>
          </div>

          {/* Social presets */}
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Social Media Dimensions</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {SOCIAL_PRESETS.map((p, i) => {
              const isSelected = p.w === width && p.h === height;
              return (
                <button
                  key={i}
                  className={`btn-ghost${isSelected ? ' active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0.6rem', textAlign: 'left' }}
                  onClick={() => { setWidth(p.w); setHeight(p.h); setFixWidth(p.w); setFixHeight(p.h); }}
                >
                  <span><strong>{p.platform}</strong> — {p.label}</span>
                  <span style={{ color: 'var(--fg-muted)' }}>{p.w}×{p.h}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
