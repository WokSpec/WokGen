'use client';

import { useState, useRef, useCallback } from 'react';

type RGB = [number, number, number];

function rgbToHex([r, g, b]: RGB) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toLowerCase();
}

function colorDist([r1, g1, b1]: RGB, [r2, g2, b2]: RGB) {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

function kMeans(pixels: RGB[], k: number, iterations = 12): RGB[] {
  if (pixels.length === 0) return [];
  let centers: RGB[] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) centers.push(pixels[i * step]);

  for (let iter = 0; iter < iterations; iter++) {
    const clusters: RGB[][] = Array.from({ length: k }, () => []);
    for (const px of pixels) {
      let minD = Infinity, minI = 0;
      for (let i = 0; i < k; i++) {
        const d = colorDist(px, centers[i]);
        if (d < minD) { minD = d; minI = i; }
      }
      clusters[minI].push(px);
    }
    centers = clusters.map((cl, i) => {
      if (cl.length === 0) return centers[i];
      const sum = cl.reduce(([ar, ag, ab], [r, g, b]) => [ar + r, ag + g, ab + b] as RGB, [0, 0, 0] as RGB);
      return [Math.round(sum[0] / cl.length), Math.round(sum[1] / cl.length), Math.round(sum[2] / cl.length)] as RGB;
    });
  }
  return centers;
}

function luminance([r, g, b]: RGB) {
  const toL = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
}

export default function ColorExtractorTool() {
  const [colors, setColors] = useState<RGB[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [count, setCount] = useState(8);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setLoading(true);
    setColors([]);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const MAX = 300;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const pixels: RGB[] = [];
      for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3] < 128) continue;
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }
      setColors(kMeans(pixels, count, 15));
      setLoading(false);
    };
    img.src = url;
  }, [count]);

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(colors.map(c => rgbToHex(c)).join('\n'));
  };

  return (
    <div className="tool-panel">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          Colors to extract:
          <select value={count} onChange={e => setCount(Number(e.target.value))}>
            {[4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div
        className="tool-dropzone"
        style={{ cursor: 'pointer' }}
        onClick={() => document.getElementById('ce-file-input')?.click()}
        onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
        onDragOver={e => e.preventDefault()}
      >
        <input id="ce-file-input" type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
        ) : (
          <>
            <p className="tool-dropzone-text">Drop an image or click to upload</p>
            <p className="tool-dropzone-sub">PNG, JPG, WebP, GIF supported</p>
          </>
        )}
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1rem' }}>Extracting colors…</p>}

      {colors.length > 0 && !loading && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Extracted Palette</h3>
            <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={copyAll}>Copy all hex</button>
          </div>
          <div className="colorext-swatches">
            {colors.map((c, i) => {
              const hex = rgbToHex(c);
              const dark = luminance(c) > 0.179;
              return (
                <button key={i} className="colorext-swatch" style={{ background: hex }} onClick={() => copyHex(hex)} title={`Copy ${hex}`}>
                  <span className="colorext-swatch-label" style={{ color: dark ? '#000' : '#fff' }}>
                    {copiedHex === hex ? 'Copied' : hex}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
