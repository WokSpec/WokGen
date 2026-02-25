'use client';

import { useState, useMemo } from 'react';

// ── Color math helpers ────────────────────────────────────────────────────

function hexToRgb(hex: string): [number,number,number] | null {
  const clean = hex.replace('#','');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const m = full.match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r,g,b].map(v => Math.round(v).toString(16).padStart(2,'0')).join('').toLowerCase();
}

function rgbToHsl(r: number, g: number, b: number): [number,number,number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToRgb(h: number, s: number, l: number): [number,number,number] {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = (n: number) => {
    const k = (n + h/30) % 12;
    return l - a * Math.max(Math.min(k-3,9-k,1),-1);
  };
  return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
}

function luminance(r: number, g: number, b: number) {
  const srgb = [r,g,b].map(c => {
    c /= 255;
    return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
  });
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}

function contrast(r1:number,g1:number,b1:number,r2:number,g2:number,b2:number) {
  const l1 = luminance(r1,g1,b1), l2 = luminance(r2,g2,b2);
  return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
}

function harmonies(h: number, s: number, l: number) {
  return {
    complementary: [[(h+180)%360, s, l]],
    triadic:       [[(h+120)%360, s, l],[(h+240)%360, s, l]],
    analogous:     [[(h+30)%360, s, l],[(h-30+360)%360, s, l]],
    split:         [[(h+150)%360, s, l],[(h+210)%360, s, l]],
    tetradic:      [[(h+90)%360, s, l],[(h+180)%360, s, l],[(h+270)%360, s, l]],
  };
}

export default function ColorTool() {
  const [hex, setHex] = useState('#6366f1');
  const [bgHex, setBgHex] = useState('#ffffff');
  const [tab, setTab] = useState<'convert' | 'contrast' | 'harmonies'>('convert');
  const [copied, setCopied] = useState<string|null>(null);

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => rgb ? rgbToHsl(...rgb) : null, [rgb]);
  const bgRgb = useMemo(() => hexToRgb(bgHex), [bgHex]);

  const contrastRatio = useMemo(() => {
    if (!rgb || !bgRgb) return null;
    return contrast(...rgb, ...bgRgb);
  }, [rgb, bgRgb]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text); setTimeout(() => setCopied(null), 1500);
  };

  const harmColors = useMemo(() => {
    if (!hsl) return null;
    const h = harmonies(...hsl);
    return Object.entries(h).map(([key, vals]) => ({
      key,
      colors: (vals as [number,number,number][]).map(([hh,ss,ll]) => {
        const norm = ((hh % 360) + 360) % 360;
        const [r,g,b] = hslToRgb(norm,ss,ll);
        return rgbToHex(r,g,b);
      }),
    }));
  }, [hsl]);

  return (
    <div className="color-tool">
      {/* Picker */}
      <div className="color-picker-row">
        <input type="color" className="color-picker-native" value={hex} onChange={e => setHex(e.target.value)} />
        <input className="tool-input" value={hex} onChange={e => setHex(e.target.value)} placeholder="#6366f1" maxLength={7} />
        <div className="color-swatch" style={{ background: hex }} />
      </div>

      {/* Tabs */}
      <div className="json-tool-modes">
        {(['convert','contrast','harmonies'] as const).map(t => (
          <button key={t} className={`json-mode-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Convert */}
      {tab === 'convert' && rgb && hsl && (
        <div className="color-values-grid">
          {[
            ['HEX', hex],
            ['RGB', `rgb(${rgb.join(', ')})`],
            ['HSL', `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`],
            ['R', String(rgb[0])],
            ['G', String(rgb[1])],
            ['B', String(rgb[2])],
            ['H', String(hsl[0]) + '°'],
            ['S', hsl[1] + '%'],
            ['L', hsl[2] + '%'],
            ['Luminance', luminance(...rgb).toFixed(4)],
          ].map(([label, val]) => (
            <div key={label} className="color-value-row" onClick={() => copy(val)}>
              <span className="color-value-label">{label}</span>
              <code className="color-value">{val}</code>
              <span className="color-copy-hint">{copied === val ? 'Copied' : 'Copy'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contrast */}
      {tab === 'contrast' && (
        <div className="color-contrast-section">
          <div className="color-contrast-pickers">
            <div className="color-picker-row">
              <label className="gen-label">Foreground</label>
              <input type="color" className="color-picker-native" value={hex} onChange={e => setHex(e.target.value)} />
              <input className="tool-input" value={hex} onChange={e => setHex(e.target.value)} maxLength={7} />
            </div>
            <div className="color-picker-row">
              <label className="gen-label">Background</label>
              <input type="color" className="color-picker-native" value={bgHex} onChange={e => setBgHex(e.target.value)} />
              <input className="tool-input" value={bgHex} onChange={e => setBgHex(e.target.value)} maxLength={7} />
            </div>
          </div>
          {contrastRatio && (
            <>
              <div className="color-contrast-preview" style={{ background: bgHex, color: hex }}>
                <span className="color-contrast-preview-text">Aa Preview Text — How does this look?</span>
              </div>
              <div className="color-contrast-ratio">
                Contrast ratio: <strong>{contrastRatio.toFixed(2)}:1</strong>
              </div>
              <div className="color-wcag-grid">
                {[
                  ['AA Normal',  contrastRatio >= 4.5],
                  ['AA Large',   contrastRatio >= 3.0],
                  ['AAA Normal', contrastRatio >= 7.0],
                  ['AAA Large',  contrastRatio >= 4.5],
                ].map(([label, pass]) => (
                  <div key={String(label)} className={`wcag-badge ${pass ? 'pass' : 'fail'}`}>
                    {pass ? 'Pass' : 'Fail'} {label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Harmonies */}
      {tab === 'harmonies' && harmColors && (
        <div className="color-harmonies">
          {harmColors.map(({ key, colors }) => (
            <div key={key} className="color-harmony-row">
              <span className="color-harmony-label">{key}</span>
              <div className="color-harmony-swatches">
                <div className="color-swatch" style={{ background: hex }} title={hex} onClick={() => copy(hex)} />
                {colors.map(c => (
                  <div key={c} className="color-swatch" style={{ background: c }} title={c} onClick={() => copy(c)} />
                ))}
              </div>
              <div className="color-harmony-vals">
                {[hex, ...colors].map(c => (
                  <code key={c} className="color-harmony-hex" onClick={() => copy(c)}>{c}</code>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
