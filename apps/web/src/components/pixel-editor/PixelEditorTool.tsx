'use client';

import { useEffect, useRef, useState, useCallback, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useSearchParams } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'line' | 'rect' | 'circle' | 'move';

interface Frame {
  id: string;
  pixels: string[]; // index = y * MAX_DIM + x
  label: string;
}

const MAX_DIM = 64;
const GRID_SIZES = [8, 16, 32, 48, 64] as const;
const ZOOM_LEVELS = [1, 2, 3, 4] as const;
const FPS_OPTIONS = [4, 8, 12, 16, 24] as const;

const BUILT_IN_PALETTES: Record<string, string[]> = {
  'Default': [
    '#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00',
    '#ff00ff','#00ffff','#ff8800','#8800ff','#008800','#884400',
    '#444444','#888888','#cccccc','#ff8888',
  ],
  'PICO-8': [
    '#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f',
    '#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436',
    '#29adff','#83769c','#ff77a8','#ffccaa',
  ],
  'NES': [
    '#7c7c7c','#0000fc','#0000bc','#4428bc','#940084','#a80020',
    '#a81000','#881400','#503000','#007800','#006800','#005800',
    '#004058','#000000','#000000','#000000',
  ],
  'Game Boy': [
    '#0f380f','#306230','#8bac0f','#9bbc0f','#ffffff','#000000',
    '#1a1c2c','#5d275d','#b13e53','#ef7d57','#ffcd75','#a7f070',
    '#38b764','#257179','#29366f','#3b5dc9',
  ],
  'CGA': [
    '#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa',
    '#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff',
    '#ff5555','#ff55ff','#ffff55','#ffffff',
  ],
  'Endesga 32': [
    '#be4a2f','#d77643','#ead4aa','#e4a672','#b86f50','#733e39',
    '#3e2731','#a22633','#e43b44','#f77622','#feae34','#fee761',
    '#63c74d','#3e8948','#265c42','#193c3e','#124e89','#0099db',
    '#2ce8f5','#ffffff','#c0cbdc','#8b9bb4','#5a6988','#3a4466',
    '#262b44','#181425','#ff0044','#68386c','#b55088','#f6757a',
    '#e8b796','#c28569',
  ],
};

const TOOL_ICONS: Record<Tool, string> = {
  pencil: '✏️', eraser: '⬜', fill: '🪣', eyedropper: '🔬',
  line: '╱', rect: '▭', circle: '○', move: '✥',
};
const TOOL_KEYS: Record<string, Tool> = {
  b: 'pencil', e: 'eraser', g: 'fill', f: 'fill',
  i: 'eyedropper', l: 'line', r: 'rect', c: 'circle', v: 'move',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlankPixels(): string[] {
  return new Array(MAX_DIM * MAX_DIM).fill('');
}

function frameId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

// Bresenham line
function linePixels(x0: number, y0: number, x1: number, y1: number): [number,number][] {
  const pts: [number,number][] = [];
  let dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
  let sx = x0<x1?1:-1, sy = y0<y1?1:-1;
  let err = dx-dy;
  while (true) {
    pts.push([x0,y0]);
    if (x0===x1 && y0===y1) break;
    const e2 = 2*err;
    if (e2>-dy) { err-=dy; x0+=sx; }
    if (e2<dx)  { err+=dx; y0+=sy; }
  }
  return pts;
}

// Rectangle outline
function rectPixels(x0: number, y0: number, x1: number, y1: number, filled: boolean): [number,number][] {
  const pts: [number,number][] = [];
  const minX = Math.min(x0,x1), maxX = Math.max(x0,x1);
  const minY = Math.min(y0,y1), maxY = Math.max(y0,y1);
  if (filled) {
    for (let y=minY; y<=maxY; y++) for (let x=minX; x<=maxX; x++) pts.push([x,y]);
  } else {
    for (let x=minX; x<=maxX; x++) { pts.push([x,minY]); pts.push([x,maxY]); }
    for (let y=minY+1; y<maxY; y++) { pts.push([minX,y]); pts.push([maxX,y]); }
  }
  return pts;
}

// Midpoint circle
function circlePixels(cx: number, cy: number, rx: number, ry: number, filled: boolean): [number,number][] {
  const set = new Set<string>();
  const add = (x: number, y: number) => set.add(`${x},${y}`);
  if (filled) {
    const r = Math.max(rx,ry);
    for (let y=-r; y<=r; y++) for (let x=-r; x<=r; x++) {
      if ((x/Math.max(rx,1))**2+(y/Math.max(ry,1))**2 <= 1) add(cx+x,cy+y);
    }
  } else {
    for (let a=0; a<360; a++) {
      const rad = a*Math.PI/180;
      add(Math.round(cx+rx*Math.cos(rad)), Math.round(cy+ry*Math.sin(rad)));
    }
  }
  return Array.from(set).map(s => s.split(',').map(Number) as [number,number]);
}

// Iterative flood fill to avoid stack overflow on large canvases
function floodFill(
  pixels: string[], gridSize: number,
  sx: number, sy: number,
  targetColor: string, newColor: string
): void {
  if (targetColor === newColor) return;
  const stack: [number,number][] = [[sx,sy]];
  while (stack.length) {
    const [x,y] = stack.pop()!;
    if (x<0||x>=gridSize||y<0||y>=gridSize) continue;
    const idx = y*MAX_DIM+x;
    if (pixels[idx] !== targetColor) continue;
    pixels[idx] = newColor;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
}

// Render a frame's pixel data to a canvas context
function renderToCtx(
  ctx: CanvasRenderingContext2D, pixelData: string[],
  gridSize: number, cellSize: number, showGrid: boolean
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let y=0; y<gridSize; y++) {
    for (let x=0; x<gridSize; x++) {
      const c = pixelData[y*MAX_DIM+x];
      if (c) {
        ctx.fillStyle = c;
        ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
      }
    }
  }
  if (showGrid && cellSize >= 4) {
    ctx.strokeStyle = 'rgba(128,128,128,0.25)';
    ctx.lineWidth = 0.5;
    for (let x=0; x<=gridSize; x++) {
      ctx.beginPath(); ctx.moveTo(x*cellSize,0); ctx.lineTo(x*cellSize,gridSize*cellSize); ctx.stroke();
    }
    for (let y=0; y<=gridSize; y++) {
      ctx.beginPath(); ctx.moveTo(0,y*cellSize); ctx.lineTo(gridSize*cellSize,y*cellSize); ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PixelEditorTool() {
  // Canvas & rendering refs
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const previewRef   = useRef<HTMLCanvasElement>(null);
  const importRef    = useRef<HTMLInputElement>(null);
  const loadRef      = useRef<HTMLInputElement>(null);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const searchParams = useSearchParams();

  // State
  const [gridSize,    setGridSize]    = useState<typeof GRID_SIZES[number]>(16);
  const [zoom,        setZoom]        = useState<typeof ZOOM_LEVELS[number]>(2);
  const [tool,        setTool]        = useState<Tool>('pencil');
  const [color,       setColor]       = useState('#000000');
  const [palette,     setPalette]     = useState<string[]>(BUILT_IN_PALETTES['Default']);
  const [paletteName, setPaletteName] = useState<string>('Default');
  const [showGrid,    setShowGrid]    = useState(true);
  const [mirrorX,     setMirrorX]     = useState(false);
  const [mirrorY,     setMirrorY]     = useState(false);
  const [filled,      setFilled]      = useState(false);   // rect/circle filled mode
  const [frames,      setFrames]      = useState<Frame[]>([{ id: frameId(), pixels: makeBlankPixels(), label: 'Frame 1' }]);
  const [activeFrame, setActiveFrame] = useState(0);
  const [fps,         setFps]         = useState<typeof FPS_OPTIONS[number]>(8);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [playHead,    setPlayHead]    = useState(0);
  const [exportScale, setExportScale] = useState(4);
  const [showHelp,    setShowHelp]    = useState(false);

  // Undo / redo
  const history     = useRef<string[][]>([]);
  const historyIdx  = useRef(-1);
  const MAX_HISTORY = 50;

  // Stroke state
  const isDrawing   = useRef(false);
  const strokeStart = useRef<[number,number] | null>(null); // for line/rect/circle
  const strokeSnap  = useRef<string[]>(makeBlankPixels()); // pre-stroke pixel state for preview

  // Derived
  const cellSize = Math.max(2, Math.floor(480 / gridSize) * zoom);

  // ------- History helpers -------------------------------------------------

  const pushHistory = useCallback((px: string[]) => {
    const next = [...px];
    if (historyIdx.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIdx.current + 1);
    }
    history.current.push(next);
    if (history.current.length > MAX_HISTORY) history.current.shift();
    historyIdx.current = history.current.length - 1;
  }, []);

  const getActivePixels = useCallback((): string[] => {
    return frames[activeFrame]?.pixels ?? makeBlankPixels();
  }, [frames, activeFrame]);

  const setActivePixels = useCallback((px: string[]) => {
    setFrames(prev => prev.map((f, i) => i === activeFrame ? { ...f, pixels: [...px] } : f));
  }, [activeFrame]);

  // ------- Rendering -------------------------------------------------------

  const redraw = useCallback((overridePx?: string[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const px = overridePx ?? getActivePixels();
    renderToCtx(ctx, px, gridSize, cellSize, showGrid);
  }, [getActivePixels, gridSize, cellSize, showGrid]);

  useEffect(() => { redraw(); }, [redraw]);

  // ------- Import from ?import= URL param ----------------------------------

  useEffect(() => {
    const importUrl = searchParams?.get('import');
    if (!importUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      offscreen.width  = gridSize;
      offscreen.height = gridSize;
      const ctx = offscreen.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, gridSize, gridSize);
      const data = ctx.getImageData(0, 0, gridSize, gridSize);
      const px = makeBlankPixels();
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const i = (y * gridSize + x) * 4;
          const a = data.data[i + 3];
          if (a > 0) {
            const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
            px[y * MAX_DIM + x] = `rgba(${r},${g},${b},${(a/255).toFixed(2)})`;
          }
        }
      }
      setFrames([{ id: frameId(), pixels: px, label: 'Imported' }]);
      setActiveFrame(0);
    };
    img.src = importUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- Animation preview -----------------------------------------------

  const stopAnimation = useCallback(() => {
    if (animTimerRef.current) { clearInterval(animTimerRef.current); animTimerRef.current = null; }
    setIsPlaying(false);
  }, []);

  const startAnimation = useCallback(() => {
    stopAnimation();
    setIsPlaying(true);
    let head = 0;
    animTimerRef.current = setInterval(() => {
      setPlayHead(head);
      const canvas = previewRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d')!;
        const f = frames[head];
        if (f) renderToCtx(ctx, f.pixels, gridSize, 2, false);
      }
      head = (head + 1) % Math.max(1, frames.length);
    }, 1000 / fps);
  }, [frames, fps, gridSize, stopAnimation]);

  useEffect(() => {
    if (isPlaying) startAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fps, frames.length]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  // ------- Keyboard shortcuts ----------------------------------------------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ignore if inside an input/textarea
      if (['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)) return;

      // Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (historyIdx.current > 0) {
          historyIdx.current--;
          const px = history.current[historyIdx.current];
          setFrames(prev => prev.map((f, i) => i === activeFrame ? { ...f, pixels: [...px] } : f));
        }
        return;
      }
      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        if (historyIdx.current < history.current.length - 1) {
          historyIdx.current++;
          const px = history.current[historyIdx.current];
          setFrames(prev => prev.map((f, i) => i === activeFrame ? { ...f, pixels: [...px] } : f));
        }
        return;
      }
      // Tool shortcuts
      const t = TOOL_KEYS[e.key.toLowerCase()];
      if (t && !e.ctrlKey && !e.metaKey) { setTool(t); return; }
      // Zoom
      if (e.key === '=' || e.key === '+') {
        setZoom(z => Math.min(4, z + 1) as typeof ZOOM_LEVELS[number]);
      }
      if (e.key === '-') {
        setZoom(z => Math.max(1, z - 1) as typeof ZOOM_LEVELS[number]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeFrame]);

  // ------- Canvas event helpers --------------------------------------------

  const getCell = (e: React.MouseEvent<HTMLCanvasElement>): [number,number] | null => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return null;
    return [x, y];
  };

  const plotWithMirror = (px: string[], x: number, y: number, c: string) => {
    const set = (px_: string[], xx: number, yy: number) => {
      if (xx >= 0 && xx < gridSize && yy >= 0 && yy < gridSize) px_[yy*MAX_DIM+xx] = c;
    };
    set(px, x, y);
    if (mirrorX) set(px, gridSize-1-x, y);
    if (mirrorY) set(px, x, gridSize-1-y);
    if (mirrorX && mirrorY) set(px, gridSize-1-x, gridSize-1-y);
  };

  const applyToolAt = (px: string[], x: number, y: number) => {
    if (tool === 'pencil') plotWithMirror(px, x, y, color);
    else if (tool === 'eraser') plotWithMirror(px, x, y, '');
    else if (tool === 'fill') {
      const target = px[y*MAX_DIM+x];
      floodFill(px, gridSize, x, y, target, color);
    } else if (tool === 'eyedropper') {
      const c = px[y*MAX_DIM+x];
      if (c) setColor(c);
    }
  };

  // ------- Mouse handlers --------------------------------------------------

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cell = getCell(e);
    if (!cell) return;
    isDrawing.current = true;
    const px = [...getActivePixels()];

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      strokeStart.current = cell;
      strokeSnap.current = [...px];
    } else {
      pushHistory(px);
      applyToolAt(px, cell[0], cell[1]);
      setActivePixels(px);
      redraw(px);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const cell = getCell(e);
    if (!cell) return;

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      // Preview stroke without committing
      const [x0,y0] = strokeStart.current!;
      const [x1,y1] = cell;
      const preview = [...strokeSnap.current];
      let pts: [number,number][];
      if (tool === 'line')   pts = linePixels(x0,y0,x1,y1);
      else if (tool === 'rect') pts = rectPixels(x0,y0,x1,y1,filled);
      else pts = circlePixels(
        Math.round((x0+x1)/2), Math.round((y0+y1)/2),
        Math.abs(x1-x0)/2, Math.abs(y1-y0)/2, filled
      );
      for (const [px,py] of pts) plotWithMirror(preview, px, py, color);
      redraw(preview);
    } else if (tool === 'pencil' || tool === 'eraser') {
      const px = [...getActivePixels()];
      applyToolAt(px, cell[0], cell[1]);
      setActivePixels(px);
      redraw(px);
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const cell = getCell(e);

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      const base = [...strokeSnap.current];
      pushHistory(base);
      if (cell && strokeStart.current) {
        const [x0,y0] = strokeStart.current;
        const [x1,y1] = cell;
        let pts: [number,number][];
        if (tool === 'line')   pts = linePixels(x0,y0,x1,y1);
        else if (tool === 'rect') pts = rectPixels(x0,y0,x1,y1,filled);
        else pts = circlePixels(
          Math.round((x0+x1)/2), Math.round((y0+y1)/2),
          Math.abs(x1-x0)/2, Math.abs(y1-y0)/2, filled
        );
        for (const [px,py] of pts) plotWithMirror(base, px, py, color);
        setActivePixels(base);
        redraw(base);
      }
      strokeStart.current = null;
    }
  };

  // ------- Frame operations ------------------------------------------------

  const addFrame = () => {
    const newFrame: Frame = {
      id: frameId(),
      pixels: makeBlankPixels(),
      label: `Frame ${frames.length + 1}`,
    };
    setFrames(prev => [...prev, newFrame]);
    setActiveFrame(frames.length);
  };

  const duplicateFrame = (idx: number) => {
    const src = frames[idx];
    const dup: Frame = { id: frameId(), pixels: [...src.pixels], label: src.label + ' copy' };
    const next = [...frames];
    next.splice(idx + 1, 0, dup);
    setFrames(next);
    setActiveFrame(idx + 1);
  };

  const deleteFrame = (idx: number) => {
    if (frames.length === 1) return;
    const next = frames.filter((_, i) => i !== idx);
    setFrames(next);
    setActiveFrame(Math.min(idx, next.length - 1));
  };

  // ------- Export ----------------------------------------------------------

  const exportCurrentPng = (scale = exportScale) => {
    const exp = document.createElement('canvas');
    exp.width  = gridSize * scale;
    exp.height = gridSize * scale;
    const ctx = exp.getContext('2d')!;
    const px = getActivePixels();
    for (let y=0; y<gridSize; y++) for (let x=0; x<gridSize; x++) {
      const c = px[y*MAX_DIM+x];
      if (c) { ctx.fillStyle=c; ctx.fillRect(x*scale,y*scale,scale,scale); }
    }
    const a = document.createElement('a');
    a.download = `pixel-art-${gridSize}x${gridSize}@${scale}x.png`;
    a.href = exp.toDataURL();
    a.click();
  };

  const exportSpritesheet = (scale = exportScale) => {
    const n = frames.length;
    const exp = document.createElement('canvas');
    exp.width  = gridSize * scale * n;
    exp.height = gridSize * scale;
    const ctx = exp.getContext('2d')!;
    frames.forEach((frame, fi) => {
      for (let y=0; y<gridSize; y++) for (let x=0; x<gridSize; x++) {
        const c = frame.pixels[y*MAX_DIM+x];
        if (c) {
          ctx.fillStyle=c;
          ctx.fillRect(fi*gridSize*scale + x*scale, y*scale, scale, scale);
        }
      }
    });
    const a = document.createElement('a');
    a.download = `spritesheet-${n}frames-${gridSize}x${gridSize}@${scale}x.png`;
    a.href = exp.toDataURL();
    a.click();
  };

  const exportGif = async () => {
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const gif = GIFEncoder();
      const w = gridSize, h = gridSize;
      for (const frame of frames) {
        const rgba = new Uint8ClampedArray(w * h * 4);
        for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
          const c = frame.pixels[y*MAX_DIM+x];
          const i = (y*w+x)*4;
          if (c) {
            const [r,g,b] = hexToRgb(c);
            rgba[i]=r; rgba[i+1]=g; rgba[i+2]=b; rgba[i+3]=255;
          } else {
            rgba[i]=rgba[i+1]=rgba[i+2]=0; rgba[i+3]=0;
          }
        }
        const palette_ = quantize(rgba, 256, { format:'rgba4444' });
        const index = applyPalette(rgba, palette_, 'rgba4444');
        gif.writeFrame(index, w, h, { palette: palette_, delay: Math.round(100/fps) });
      }
      gif.finish();
      const bytes = gif.bytes();
      const blob = new Blob([bytes], { type:'image/gif' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `animation-${frames.length}frames-${gridSize}x${gridSize}.gif`;
      a.href = url;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      alert('GIF export failed. Try exporting as spritesheet instead.');
    }
  };

  // ------- Import PNG ------------------------------------------------------

  const importPng = (file: File) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const tmp = document.createElement('canvas');
      tmp.width = gridSize; tmp.height = gridSize;
      const ctx = tmp.getContext('2d')!;
      ctx.drawImage(img, 0, 0, gridSize, gridSize);
      const { data } = ctx.getImageData(0, 0, gridSize, gridSize);
      const px = makeBlankPixels();
      for (let y=0; y<gridSize; y++) for (let x=0; x<gridSize; x++) {
        const i = (y*gridSize+x)*4;
        if (data[i+3] > 0) {
          const r = data[i].toString(16).padStart(2,'0');
          const g = data[i+1].toString(16).padStart(2,'0');
          const b = data[i+2].toString(16).padStart(2,'0');
          px[y*MAX_DIM+x] = `#${r}${g}${b}`;
        }
      }
      pushHistory(getActivePixels());
      setActivePixels(px);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // ------- Save / Load project ---------------------------------------------

  const saveProject = () => {
    const project = { version: 1, gridSize, fps, frames };
    const blob = new Blob([JSON.stringify(project)], { type:'application/json' });
    const a = document.createElement('a');
    a.download = `pixel-project-${gridSize}x${gridSize}.json`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const loadProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.gridSize) setGridSize(data.gridSize);
        if (data.fps)      setFps(data.fps);
        if (data.frames)   setFrames(data.frames);
        setActiveFrame(0);
        history.current = [];
        historyIdx.current = -1;
      } catch {
        alert('Invalid project file.');
      }
    };
    reader.readAsText(file);
  };

  // ------- Clear / Palette -------------------------------------------------

  const clearCanvas = () => {
    const blank = makeBlankPixels();
    pushHistory(getActivePixels());
    setActivePixels(blank);
  };

  const switchPalette = (name: string) => {
    setPaletteName(name);
    setPalette(BUILT_IN_PALETTES[name]);
  };

  const addColorToPalette = () => {
    if (!palette.includes(color)) setPalette(p => [...p, color]);
  };

  const removeColorFromPalette = (c: string) => {
    setPalette(p => p.filter(x => x !== c));
  };

  // ------- Render ----------------------------------------------------------

  return (
    <div className="pxe-root">
      {/* ---------------------------------------------------------------- Top Toolbar */}
      <div className="pxe-topbar">
        {/* Tools */}
        <div className="pxe-toolgroup">
          {(Object.entries(TOOL_ICONS) as [Tool, string][]).map(([t, icon]) => (
            <button
              key={t}
              className={`pxe-tool-btn${tool === t ? ' active' : ''}`}
              onClick={() => setTool(t)}
              title={`${t} (${Object.entries(TOOL_KEYS).find(([,v])=>v===t)?.[0] ?? ''})`}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="pxe-sep" />

        {/* Grid size */}
        <div className="pxe-toolgroup">
          <span className="pxe-label">Canvas:</span>
          {GRID_SIZES.map(s => (
            <button
              key={s}
              className={`pxe-size-btn${gridSize === s ? ' active' : ''}`}
              onClick={() => {
                if (s !== gridSize && !confirm(`Change canvas to ${s}×${s}? Pixel data will be cleared.`)) return;
                setGridSize(s);
                const blank = makeBlankPixels();
                setFrames(prev => prev.map(f => ({ ...f, pixels: blank })));
                history.current = []; historyIdx.current = -1;
              }}
            >{s}</button>
          ))}
        </div>

        <div className="pxe-sep" />

        {/* Zoom */}
        <div className="pxe-toolgroup">
          <span className="pxe-label">Zoom:</span>
          {ZOOM_LEVELS.map(z => (
            <button
              key={z}
              className={`pxe-size-btn${zoom === z ? ' active' : ''}`}
              onClick={() => setZoom(z)}
            >{z}×</button>
          ))}
        </div>

        <div className="pxe-sep" />

        {/* Modifiers */}
        <div className="pxe-toolgroup">
          <label className="pxe-toggle" title="Mirror X">
            <input type="checkbox" checked={mirrorX} onChange={e => setMirrorX(e.target.checked)} />
            ↔ Mirror X
          </label>
          <label className="pxe-toggle" title="Mirror Y">
            <input type="checkbox" checked={mirrorY} onChange={e => setMirrorY(e.target.checked)} />
            ↕ Mirror Y
          </label>
          {(tool === 'rect' || tool === 'circle') && (
            <label className="pxe-toggle" title="Fill shape">
              <input type="checkbox" checked={filled} onChange={e => setFilled(e.target.checked)} />
              Filled
            </label>
          )}
          <label className="pxe-toggle" title="Show grid lines">
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            Grid
          </label>
        </div>

        <div className="pxe-sep pxe-spacer" />

        {/* Action buttons */}
        <div className="pxe-toolgroup">
          <button className="pxe-btn" onClick={() => importRef.current?.click()} title="Import PNG">📥 Import</button>
          <button className="pxe-btn" onClick={saveProject} title="Save project as JSON">💾 Save</button>
          <button className="pxe-btn" onClick={() => loadRef.current?.click()} title="Load project JSON">📂 Load</button>
          <button className="pxe-btn pxe-btn-danger" onClick={() => { if (confirm('Clear canvas?')) clearCanvas(); }}>🗑 Clear</button>
        </div>

        <div className="pxe-sep" />

        {/* Export */}
        <div className="pxe-toolgroup">
          <span className="pxe-label">Export @</span>
          <select className="pxe-select" value={exportScale} onChange={e => setExportScale(+e.target.value)}>
            {[1,2,4,8].map(s => <option key={s} value={s}>{s}×</option>)}
          </select>
          <button className="pxe-btn pxe-btn-primary" onClick={() => exportCurrentPng()}>PNG</button>
          <button className="pxe-btn pxe-btn-primary" onClick={() => exportSpritesheet()}>Sheet</button>
          <button className="pxe-btn pxe-btn-primary" onClick={exportGif}>GIF</button>
        </div>

        <button className="pxe-btn pxe-help-btn" onClick={() => setShowHelp(h => !h)} title="Keyboard shortcuts">?</button>

        {/* Hidden file inputs */}
        <input ref={importRef} type="file" accept="image/png,image/gif,image/webp" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) importPng(f); e.target.value=''; }} />
        <input ref={loadRef} type="file" accept="application/json" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) loadProject(f); e.target.value=''; }} />
      </div>

      {/* ---------------------------------------------------------------- Help overlay */}
      {showHelp && (
        <div className="pxe-help-panel">
          <div className="pxe-help-grid">
            {[
              ['B','Pencil'], ['E','Eraser'], ['G / F','Fill'],
              ['I','Eyedropper'], ['L','Line'], ['R','Rectangle'],
              ['C','Circle'], ['V','Move (pan)'],
              ['Ctrl+Z','Undo'], ['Ctrl+Shift+Z','Redo'],
              ['+ / =','Zoom in'], ['-','Zoom out'],
            ].map(([k,v]) => (
              <span key={k} className="pxe-help-row"><kbd>{k}</kbd>{v}</span>
            ))}
          </div>
          <button className="pxe-btn" style={{marginTop:'0.5rem'}} onClick={() => setShowHelp(false)}>Close</button>
        </div>
      )}

      {/* ---------------------------------------------------------------- Main body */}
      <div className="pxe-body">
        {/* Canvas area */}
        <div className="pxe-canvas-area">
          <div className="pxe-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={gridSize * cellSize}
              height={gridSize * cellSize}
              className="pxe-canvas"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={e => { if (isDrawing.current) onMouseUp(e); }}
              style={{ cursor: tool === 'eyedropper' ? 'crosshair' : tool === 'move' ? 'grab' : 'crosshair' }}
            />
          </div>
          <p className="pxe-canvas-info">{gridSize}×{gridSize} · {zoom}× zoom · {frames.length} frame{frames.length!==1?'s':''}</p>
        </div>

        {/* Color panel */}
        <div className="pxe-color-panel">
          {/* Current color swatch + input */}
          <div className="pxe-current-color-row">
            <div className="pxe-current-swatch" style={{ background: color }} />
            <input type="color" className="pxe-color-native" value={color} onChange={e => setColor(e.target.value)} />
            <input className="pxe-hex-input" value={color} maxLength={7}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setColor(e.target.value); }} />
          </div>

          {/* Palette selector */}
          <div className="pxe-palette-header">
            <span className="pxe-label">Palette</span>
            <select className="pxe-select" value={paletteName} onChange={e => switchPalette(e.target.value)}>
              {Object.keys(BUILT_IN_PALETTES).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Swatches */}
          <div className="pxe-palette-grid">
            {palette.map((c, i) => (
              <button
                key={i}
                className={`pxe-swatch${color === c ? ' active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                onContextMenu={e => { e.preventDefault(); removeColorFromPalette(c); }}
                title={`${c} (right-click to remove)`}
              />
            ))}
          </div>
          <button className="pxe-btn" style={{width:'100%',marginTop:'4px'}} onClick={addColorToPalette}>
            + Add {color}
          </button>

          {/* Undo/Redo */}
          <div className="pxe-toolgroup" style={{marginTop:'0.75rem'}}>
            <button className="pxe-btn" style={{flex:1}}
              disabled={historyIdx.current <= 0}
              onClick={() => {
                if (historyIdx.current > 0) {
                  historyIdx.current--;
                  const px = history.current[historyIdx.current];
                  setFrames(prev => prev.map((f,i) => i===activeFrame ? {...f,pixels:[...px]} : f));
                }
              }}>↩ Undo</button>
            <button className="pxe-btn" style={{flex:1}}
              disabled={historyIdx.current >= history.current.length - 1}
              onClick={() => {
                if (historyIdx.current < history.current.length - 1) {
                  historyIdx.current++;
                  const px = history.current[historyIdx.current];
                  setFrames(prev => prev.map((f,i) => i===activeFrame ? {...f,pixels:[...px]} : f));
                }
              }}>↪ Redo</button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- Frames panel */}
      <div className="pxe-frames-panel">
        <div className="pxe-frames-header">
          <span className="pxe-label">Frames</span>
          <div className="pxe-toolgroup">
            <span className="pxe-label">FPS:</span>
            {FPS_OPTIONS.map(f => (
              <button key={f} className={`pxe-size-btn${fps===f?' active':''}`}
                onClick={() => setFps(f)}>{f}</button>
            ))}
            <button className="pxe-btn pxe-btn-primary"
              onClick={() => isPlaying ? stopAnimation() : startAnimation()}>
              {isPlaying ? '⏹ Stop' : '▶ Play'}
            </button>
          </div>
          <button className="pxe-btn" onClick={addFrame}>+ Add Frame</button>
        </div>

        <div className="pxe-frames-scroll">
          {frames.map((frame, idx) => (
            <div
              key={frame.id}
              className={`pxe-frame-thumb${activeFrame === idx ? ' active' : ''}${isPlaying && playHead === idx ? ' playing' : ''}`}
              onClick={() => { stopAnimation(); setActiveFrame(idx); }}
            >
              <FrameThumb pixels={frame.pixels} gridSize={gridSize} />
              <span className="pxe-frame-label">{idx + 1}</span>
              <div className="pxe-frame-actions">
                <button title="Duplicate" onClick={e => { e.stopPropagation(); duplicateFrame(idx); }}>⧉</button>
                <button title="Delete" onClick={e => { e.stopPropagation(); deleteFrame(idx); }}>✕</button>
              </div>
            </div>
          ))}

          {/* Live preview */}
          {frames.length > 1 && (
            <div className="pxe-frame-thumb pxe-preview-thumb">
              <canvas ref={previewRef} width={gridSize*2} height={gridSize*2} className="pxe-canvas" style={{imageRendering:'pixelated'}} />
              <span className="pxe-frame-label">Preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FrameThumb — renders a single frame as a tiny canvas thumbnail
// ---------------------------------------------------------------------------
function FrameThumb({ pixels, gridSize }: { pixels: string[]; gridSize: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y=0; y<gridSize; y++) for (let x=0; x<gridSize; x++) {
      const c = pixels[y*MAX_DIM+x];
      if (c) {
        ctx.fillStyle=c;
        ctx.fillRect(x*2, y*2, 2, 2);
      }
    }
  }, [pixels, gridSize]);
  return <canvas ref={ref} width={gridSize*2} height={gridSize*2} style={{imageRendering:'pixelated', display:'block'}} />;
}
