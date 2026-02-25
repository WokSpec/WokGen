'use client';

import { useState, useRef, useCallback } from 'react';

type Frame = 'macbook' | 'iphone' | 'ipad' | 'browser';

const FRAMES: { id: Frame; label: string; aspect: number }[] = [
  { id: 'macbook',  label: 'MacBook',  aspect: 16/10 },
  { id: 'iphone',   label: 'iPhone',   aspect: 9/19.5 },
  { id: 'ipad',     label: 'iPad',     aspect: 3/4 },
  { id: 'browser',  label: 'Browser',  aspect: 16/10 },
];

// Draw device frames using Canvas API
function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);

  if (frame === 'macbook') {
    // Screen bezel
    const bx = w * 0.05, by = h * 0.04, bw = w * 0.9, bh = h * 0.68;
    ctx.fillStyle = '#1a1a2e';
    roundRect(ctx, bx, by, bw, bh, 12);
    ctx.fill();
    // Screen
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx + 6, by + 6, bw - 12, bh - 12, 4);
    ctx.fill();
    // Camera dot
    ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(w/2, by + 5, 2, 0, Math.PI*2); ctx.fill();
    // Base
    ctx.fillStyle = '#c8c8c8';
    roundRect(ctx, w*0.02, h*0.72, w*0.96, h*0.06, 4);
    ctx.fill();
    ctx.fillStyle = '#b0b0b0';
    roundRect(ctx, w*0.35, h*0.77, w*0.3, h*0.025, 6);
    ctx.fill();
    return { x: bx + 8, y: by + 8, w: bw - 16, h: bh - 16 };
  }

  if (frame === 'iphone') {
    const bx = w * 0.18, by = h * 0.02, bw = w * 0.64, bh = h * 0.96;
    ctx.fillStyle = '#1a1a1a';
    roundRect(ctx, bx, by, bw, bh, 28);
    ctx.fill();
    ctx.fillStyle = '#2a2a2a';
    roundRect(ctx, bx + 3, by + 3, bw - 6, bh - 6, 25);
    ctx.fill();
    // Screen
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx + 6, by + 6, bw - 12, bh - 12, 22);
    ctx.fill();
    // Notch/island
    ctx.fillStyle = '#1a1a1a';
    roundRect(ctx, w/2 - 30, by + 8, 60, 20, 10);
    ctx.fill();
    // Home indicator
    ctx.fillStyle = '#888';
    roundRect(ctx, w/2 - 40, by + bh - 22, 80, 5, 3);
    ctx.fill();
    return { x: bx + 6, y: by + 30, w: bw - 12, h: bh - 50 };
  }

  if (frame === 'ipad') {
    const bx = w * 0.06, by = h * 0.04, bw = w * 0.88, bh = h * 0.92;
    ctx.fillStyle = '#2a2a2a';
    roundRect(ctx, bx, by, bw, bh, 20);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx + 8, by + 8, bw - 16, bh - 16, 12);
    ctx.fill();
    // Camera
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(bx + bw/2, by + 5, 3, 0, Math.PI*2); ctx.fill();
    // Home button
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(bx + bw - 5, by + bh/2, 8, 0, Math.PI*2); ctx.fill();
    return { x: bx + 9, y: by + 9, w: bw - 18, h: bh - 18 };
  }

  // Browser frame
  ctx.fillStyle = '#e8e8e8';
  roundRect(ctx, 0, 0, w, h, 10);
  ctx.fill();
  // Title bar
  ctx.fillStyle = '#d0d0d0';
  roundRect(ctx, 0, 0, w, 36, [10, 10, 0, 0]);
  ctx.fill();
  // Traffic lights
  [['#ff5f57', w*0.04], ['#febc2e', w*0.08], ['#28c840', w*0.12]].forEach(([c, x]) => {
    ctx.fillStyle = String(c);
    ctx.beginPath(); ctx.arc(Number(x), 18, 6, 0, Math.PI*2); ctx.fill();
  });
  // URL bar
  ctx.fillStyle = '#fff';
  roundRect(ctx, w*0.2, 8, w*0.6, 20, 4);
  ctx.fill();
  // Content area
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 36, w, h - 36);
  return { x: 0, y: 36, w, h: h - 36 };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  const radii = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + radii[0], y);
  ctx.lineTo(x + w - radii[1], y);
  ctx.arcTo(x + w, y, x + w, y + radii[1], radii[1]);
  ctx.lineTo(x + w, y + h - radii[2]);
  ctx.arcTo(x + w, y + h, x + w - radii[2], y + h, radii[2]);
  ctx.lineTo(x + radii[3], y + h);
  ctx.arcTo(x, y + h, x, y + h - radii[3], radii[3]);
  ctx.lineTo(x, y + radii[0]);
  ctx.arcTo(x, y, x + radii[0], y, radii[0]);
  ctx.closePath();
}

export default function MockupTool() {
  const [frame, setFrame] = useState<Frame>('macbook');
  const [bgColor, setBgColor] = useState('#6366f1');
  const [screenshot, setScreenshot] = useState<HTMLImageElement | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generate = useCallback(() => {
    if (!screenshot) return;
    const canvas = canvasRef.current!;
    const W = 1200, H = Math.round(1200 / (FRAMES.find(f => f.id === frame)?.aspect ?? 16/10));
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Draw device frame
    const frameW = Math.round(W * 0.8), frameH = Math.round(H * 0.85);
    const fx = (W - frameW) / 2, fy = (H - frameH) / 2;
    ctx.save();
    ctx.translate(fx, fy);
    const screenArea = drawFrame(ctx, frame, frameW, frameH);
    // Draw screenshot into screen area
    if (screenArea) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(screenArea.x, screenArea.y, screenArea.w, screenArea.h);
      ctx.clip();
      // Scale screenshot to fill screen area
      const sw = screenshot.naturalWidth, sh = screenshot.naturalHeight;
      const scale = Math.max(screenArea.w / sw, screenArea.h / sh);
      const dw = sw * scale, dh = sh * scale;
      const dx = screenArea.x + (screenArea.w - dw) / 2;
      const dy = screenArea.y + (screenArea.h - dh) / 2;
      ctx.drawImage(screenshot, dx, dy, dw, dh);
      ctx.restore();
    }
    ctx.restore();

    setResult(canvas.toDataURL('image/png'));
  }, [screenshot, frame, bgColor]);

  const loadFile = (file: File) => {
    const img = new window.Image();
    img.onload = () => { setScreenshot(img); setResult(null); };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="mockup-tool">
      {/* Config */}
      <div className="mockup-config">
        {/* Frame selector */}
        <div className="gen-row">
          <label className="gen-label">Frame:</label>
          {FRAMES.map(f => (
            <button key={f.id} className={`json-mode-btn${frame === f.id ? ' active' : ''}`} onClick={() => { setFrame(f.id); setResult(null); }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Background */}
        <div className="gen-row">
          <label className="gen-label">Background:</label>
          <input type="color" className="color-picker-native" value={bgColor} onChange={e => setBgColor(e.target.value)} />
          <input className="tool-input-sm" value={bgColor} onChange={e => setBgColor(e.target.value)} />
          {['#6366f1','#ec4899','#10b981','#f59e0b','#1e293b','#ffffff'].map(c => (
            <button key={c} className="color-swatch" style={{background:c, width:'1.5rem', height:'1.5rem'}} onClick={() => setBgColor(c)} />
          ))}
        </div>

        {/* Upload */}
        <div
          className={`tool-dropzone tool-dropzone-sm mockup-drop${screenshot ? ' has-image' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
        >
          {screenshot ? (
            <p className="tool-dropzone-text">Screenshot loaded — click to change</p>
          ) : (
            <>
              <p className="tool-dropzone-text">Drop your screenshot here</p>
              <p className="tool-dropzone-sub">PNG · JPG · WebP</p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="tool-file-input-hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>

        <button className="btn-primary" onClick={generate} disabled={!screenshot}>
          Generate Mockup
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mockup-result">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt="Mockup" className="mockup-result-img" />
          <div className="bgr-actions" style={{marginTop:'1rem'}}>
            <a href={result} download={`${frame}-mockup.png`} className="btn-primary">Download PNG (1200px)</a>
            <button className="btn-ghost" onClick={() => setResult(null)}>Generate New</button>
          </div>
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
