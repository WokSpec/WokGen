'use client';

import { useState, useRef, useCallback } from 'react';

type RGB = [number, number, number];
type ExportFormat = 'css' | 'tailwind' | 'json' | 'scss';

function rgbToHex([r, g, b]: RGB) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function rgbStr([r, g, b]: RGB) {
  return `rgb(${r}, ${g}, ${b})`;
}

function colorName(i: number) {
  return `color-${i + 1}`;
}

function exportColors(colors: RGB[], format: ExportFormat): string {
  if (format === 'css') {
    return `:root {\n${colors.map((c, i) => `  --${colorName(i)}: ${rgbToHex(c)};`).join('\n')}\n}`;
  }
  if (format === 'tailwind') {
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors.map((c, i) => `        '${colorName(i)}': '${rgbToHex(c)}',`).join('\n')}\n      },\n    },\n  },\n};`;
  }
  if (format === 'json') {
    return JSON.stringify(colors.map((c, i) => ({ name: colorName(i), hex: rgbToHex(c), rgb: rgbStr(c) })), null, 2);
  }
  if (format === 'scss') {
    return colors.map((c, i) => `$${colorName(i)}: ${rgbToHex(c)};`).join('\n');
  }
  return '';
}

function luminance([r, g, b]: RGB) {
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastColor(c: RGB) {
  return luminance(c) > 0.179 ? '#000' : '#fff';
}

export default function ColorPaletteTool() {
  const [colors, setColors] = useState<RGB[]>([]);
  const [count, setCount] = useState(6);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const extractColors = useCallback(async (src: string, colorCount: number) => {
    setLoading(true);
    setImgSrc(src);
    try {
      const { default: ColorThief } = await import('color-thief-browser');
      const ct = new ColorThief();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const palette = ct.getPalette(img, colorCount, 1);
          setColors(palette);
        } catch {
          setColors([]);
        }
        setLoading(false);
      };
      img.onerror = () => { setColors([]); setLoading(false); };
      img.src = src;
    } catch {
      setLoading(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target?.result as string;
      if (src) extractColors(src, count);
    };
    reader.readAsDataURL(file);
  }, [count, extractColors]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reExtract = () => {
    if (imgSrc) extractColors(imgSrc, count);
  };

  const copyColor = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(val);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const exported = exportColors(colors, format);
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      setCopied('__all__');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="cp-tool">
      {/* Drop zone */}
      <div
        className={`cp-drop-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        {imgSrc
          ? <img ref={imgRef} src={imgSrc} alt="source" className="cp-preview-img" />
          : (
            <div className="cp-drop-hint">
              <span className="cp-drop-text">Drop an image here or click to upload</span>
              <span className="cp-drop-sub">PNG, JPG, GIF, WebP…</span>
            </div>
          )
        }
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
      </div>

      {/* Controls */}
      <div className="cp-controls">
        <div className="cp-count-row">
          <label className="cp-count-label">Colors: <strong>{count}</strong></label>
          <input
            type="range" min={3} max={12} value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="cp-count-slider"
          />
        </div>
        {imgSrc && (
          <button className="btn-primary cp-extract-btn" onClick={reExtract} disabled={loading}>
            {loading ? 'Extracting…' : 'Extract Palette'}
          </button>
        )}
      </div>

      {/* Swatches */}
      {colors.length > 0 && (
        <>
          <div className="cp-swatches">
            {colors.map((c, i) => {
              const hex = rgbToHex(c);
              const rgb = rgbStr(c);
              const fg = contrastColor(c);
              return (
                <div key={i} className="cp-swatch-card">
                  <div
                    className="cp-swatch-color"
                    style={{ background: hex }}
                    onClick={() => copyColor(hex)}
                    title="Click to copy hex"
                  >
                    {copied === hex && <span className="cp-copied-flash" style={{ color: fg }}>Copied!</span>}
                  </div>
                  <div className="cp-swatch-vals">
                    <button className="cp-val-btn" onClick={() => copyColor(hex)} title="Copy HEX">
                      <span className="cp-val-label">HEX</span>
                      <span className="cp-val-text">{hex}</span>
                    </button>
                    <button className="cp-val-btn" onClick={() => copyColor(rgb)} title="Copy RGB">
                      <span className="cp-val-label">RGB</span>
                      <span className="cp-val-text cp-val-small">{rgb}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export */}
          <div className="cp-export">
            <div className="cp-export-header">
              <div className="cp-format-tabs">
                {(['css', 'tailwind', 'json', 'scss'] as ExportFormat[]).map(f => (
                  <button
                    key={f}
                    className={`cp-format-tab${format === f ? ' active' : ''}`}
                    onClick={() => setFormat(f)}
                  >
                    {f === 'css' ? 'CSS Vars' : f === 'tailwind' ? 'Tailwind' : f === 'json' ? 'JSON' : 'SCSS'}
                  </button>
                ))}
              </div>
              <button className="btn-ghost-xs" onClick={copyAll}>
                {copied === '__all__' ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <pre className="cp-export-code">{exported}</pre>
          </div>
        </>
      )}
    </div>
  );
}
