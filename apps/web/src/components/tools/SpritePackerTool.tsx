'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Sprite {
  id: string;
  name: string;
  img: HTMLImageElement;
  w: number;
  h: number;
  x: number;
  y: number;
}

interface PackedSprite extends Sprite {
  px: number;
  py: number;
}

// Simple shelf-packing algorithm
function packSprites(sprites: Sprite[], padding = 1): { items: PackedSprite[]; width: number; height: number } {
  const sorted = [...sprites].sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));
  const items: PackedSprite[] = [];
  const shelves: { y: number; x: number; h: number }[] = [];
  const maxW = Math.pow(2, Math.ceil(Math.log2(Math.sqrt(sprites.reduce((a, s) => a + s.w * s.h, 0)) * 1.2)));
  let totalH = 0;

  for (const s of sorted) {
    const sw = s.w + padding;
    const sh = s.h + padding;
    let placed = false;
    for (const shelf of shelves) {
      if (shelf.x + sw <= maxW && sh <= shelf.h + padding) {
        items.push({ ...s, px: shelf.x, py: shelf.y });
        shelf.x += sw;
        placed = true;
        break;
      }
    }
    if (!placed) {
      items.push({ ...s, px: 0, py: totalH });
      shelves.push({ y: totalH, x: sw, h: sh });
      totalH += sh;
    }
  }

  const w = nextPow2(Math.max(...items.map(i => i.px + i.w + padding), 1));
  const h = nextPow2(Math.max(...items.map(i => i.py + i.h + padding), 1));
  return { items, width: w, height: h };
}

function nextPow2(n: number) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export default function SpritePackerTool() {
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [packed, setPacked] = useState<{ items: PackedSprite[]; width: number; height: number } | null>(null);
  const [padding, setPadding] = useState(2);
  const [format, setFormat] = useState<'json-hash' | 'json-array' | 'css'>('json-hash');
  const [showGrid, setShowGrid] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFiles = (files: FileList | null) => {
    if (!files) return;
    const newSprites: Sprite[] = [];
    let loaded = 0;
    Array.from(files).forEach(f => {
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        newSprites.push({ id: crypto.randomUUID(), name: f.name.replace(/\.[^.]+$/, ''), img, w: img.width, h: img.height, x: 0, y: 0 });
        loaded++;
        if (loaded === files.length) {
          setSprites(prev => [...prev, ...newSprites]);
          URL.revokeObjectURL(url);
        }
      };
      img.src = url;
    });
  };

  const removeSprite = (id: string) => {
    setSprites(prev => prev.filter(s => s.id !== id));
    setPacked(null);
  };

  const doPack = useCallback(() => {
    if (sprites.length === 0) return;
    const result = packSprites(sprites, padding);
    setPacked(result);
  }, [sprites, padding]);

  // Draw canvas when packed changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !packed) return;
    canvas.width = packed.width;
    canvas.height = packed.height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, packed.width, packed.height);

    packed.items.forEach(s => {
      ctx.drawImage(s.img, s.px, s.py, s.w, s.h);
    });

    if (showGrid) {
      ctx.strokeStyle = 'rgba(99,102,241,0.4)';
      ctx.lineWidth = 0.5;
      packed.items.forEach(s => {
        ctx.strokeRect(s.px, s.py, s.w, s.h);
      });
    }
  }, [packed, showGrid]);

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'spritesheet.png';
    a.click();
  };

  const getManifest = (): string => {
    if (!packed) return '';
    if (format === 'json-hash') {
      const frames: Record<string, object> = {};
      packed.items.forEach(s => {
        frames[s.name] = { frame: { x: s.px, y: s.py, w: s.w, h: s.h }, rotated: false, trimmed: false, sourceSize: { w: s.w, h: s.h } };
      });
      return JSON.stringify({ frames, meta: { app: 'WokGen Sprite Packer', size: { w: packed.width, h: packed.height }, image: 'spritesheet.png' } }, null, 2);
    }
    if (format === 'json-array') {
      return JSON.stringify(packed.items.map(s => ({ name: s.name, x: s.px, y: s.py, w: s.w, h: s.h })), null, 2);
    }
    // CSS
    return packed.items.map(s =>
      `.sprite-${s.name} { width: ${s.w}px; height: ${s.h}px; background: url('spritesheet.png') -${s.px}px -${s.py}px; }`
    ).join('\n');
  };

  const exportManifest = () => {
    const content = getManifest();
    const ext = format === 'css' ? 'css' : 'json';
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `spritesheet.${ext}`;
    a.click();
  };

  const [manifestCopied, setManifestCopied] = useState(false);
  const copyManifest = async () => {
    await navigator.clipboard.writeText(getManifest());
    setManifestCopied(true);
    setTimeout(() => setManifestCopied(false), 1500);
  };

  return (
    <div className="sprite-packer">
      <div className="sprite-packer-layout">
        {/* Controls */}
        <div className="sprite-packer-controls">
          <label
            className="tool-file-label sprite-drop-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); loadFiles(e.dataTransfer.files); }}
          >
            <div>Upload</div>
            <p>Drop PNGs here or click to browse</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports PNG, JPG, WebP, GIF</p>
            <input type="file" accept="image/*" multiple onChange={e => loadFiles(e.target.files)} style={{ display: 'none' }} />
          </label>

          {sprites.length > 0 && (
            <div className="sprite-list">
              {sprites.map(s => (
                <div key={s.id} className="sprite-list-item">
                  <img src={s.img.src} alt={s.name} className="sprite-list-thumb" />
                  <span className="sprite-list-name">{s.name}</span>
                  <span className="sprite-list-size">{s.w}×{s.h}</span>
                  <button className="sprite-list-del" onClick={() => removeSprite(s.id)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="sprite-control-row">
              <label className="tilemap-label">Padding (px)</label>
              <input type="number" className="tool-input" value={padding} min={0} max={16}
                onChange={e => setPadding(Math.max(0, Number(e.target.value)))}
                style={{ width: '70px' }} />
              <label className="tilemap-label" style={{ marginLeft: '0.5rem' }}>
                <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} style={{ marginRight: '0.3rem' }} />
                Grid overlay
              </label>
            </div>

            <div className="sprite-control-row">
              <label className="tilemap-label">Manifest</label>
              <select className="tool-select" value={format} onChange={e => setFormat(e.target.value as typeof format)}>
                <option value="json-hash">JSON (TexturePacker)</option>
                <option value="json-array">JSON (array)</option>
                <option value="css">CSS sprites</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={doPack}
              disabled={sprites.length === 0}
            >
              Pack {sprites.length > 0 ? `${sprites.length} sprites` : '…'}
            </button>
          </div>
        </div>

        {/* Preview + export */}
        <div className="sprite-packer-preview">
          {packed ? (
            <>
              <div className="sprite-preview-header">
                <span className="sprite-preview-size">{packed.width}×{packed.height}px · {packed.items.length} sprites</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-ghost-xs" onClick={exportManifest}>Export manifest</button>
                  <button className="btn-secondary btn-sm" onClick={exportPng}>Export PNG</button>
                </div>
              </div>
              <div className="sprite-canvas-wrap">
                <canvas ref={canvasRef} className="sprite-canvas" />
              </div>

              <div className="css-gen-output" style={{ marginTop: '0.75rem' }}>
                <div className="json-panel-header">
                  <span className="json-panel-label">Manifest — {format}</span>
                  <button className="btn-ghost-xs" onClick={copyManifest}>{manifestCopied ? '✓ Copied' : 'Copy'}</button>
                </div>
                <pre className="css-gen-code" style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.72rem' }}>
                  {getManifest()}
                </pre>
              </div>
            </>
          ) : (
            <div className="sprite-empty">
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <p>Add sprites and click Pack to generate your atlas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
