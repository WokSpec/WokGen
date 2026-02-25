'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper';

const PALETTE_DEFAULTS = [
  '#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00',
  '#ff00ff','#00ffff','#ff8800','#8800ff','#008800','#884400',
  '#444444','#888888','#cccccc','#ff8888',
];

const GRID_SIZES = [8, 16, 32, 48, 64];

export default function PixelEditorTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridSize, setGridSize] = useState(16);
  const [cellSize, setCellSize] = useState(20);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [palette, setPalette] = useState(PALETTE_DEFAULTS);
  const [showGrid, setShowGrid] = useState(true);
  const isDrawing = useRef(false);

  // pixel data: index = y * gridSize + x
  const pixels = useRef<string[]>(new Array(64 * 64).fill(''));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const c = pixels.current[y * gridSize + x];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(128,128,128,0.3)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= gridSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, gridSize * cellSize);
        ctx.stroke();
      }
      for (let y = 0; y <= gridSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(gridSize * cellSize, y * cellSize);
        ctx.stroke();
      }
    }
  }, [gridSize, cellSize, showGrid]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCell = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return null;
    return { x, y };
  };

  const floodFill = (x: number, y: number, targetColor: string, newColor: string) => {
    if (targetColor === newColor) return;
    const idx = y * gridSize + x;
    if (pixels.current[idx] !== targetColor) return;
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
    pixels.current[idx] = newColor;
    floodFill(x+1, y, targetColor, newColor);
    floodFill(x-1, y, targetColor, newColor);
    floodFill(x, y+1, targetColor, newColor);
    floodFill(x, y-1, targetColor, newColor);
  };

  const applyTool = (x: number, y: number) => {
    const idx = y * gridSize + x;
    if (tool === 'pencil') {
      pixels.current[idx] = color;
    } else if (tool === 'eraser') {
      pixels.current[idx] = '';
    } else if (tool === 'fill') {
      const target = pixels.current[idx];
      floodFill(x, y, target, color);
    } else if (tool === 'eyedropper') {
      const c = pixels.current[idx];
      if (c) setColor(c);
    }
    draw();
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const cell = getCell(e);
    if (cell) applyTool(cell.x, cell.y);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || tool === 'fill' || tool === 'eyedropper') return;
    const cell = getCell(e);
    if (cell) applyTool(cell.x, cell.y);
  };

  const onMouseUp = () => { isDrawing.current = false; };

  const clear = () => {
    pixels.current = new Array(64 * 64).fill('');
    draw();
  };

  const exportPng = () => {
    const canvas = canvasRef.current!;
    // Export at 1x (no grid)
    const exp = document.createElement('canvas');
    exp.width = gridSize;
    exp.height = gridSize;
    const ctx = exp.getContext('2d')!;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const c = pixels.current[y * gridSize + x];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    const a = document.createElement('a');
    a.download = `pixel-art-${gridSize}x${gridSize}.png`;
    a.href = exp.toDataURL();
    a.click();
  };

  const changeGridSize = (size: number) => {
    pixels.current = new Array(64 * 64).fill('');
    setGridSize(size);
    const maxCell = Math.floor(520 / size);
    setCellSize(Math.min(maxCell, 32));
  };

  return (
    <div className="pixel-editor">
      {/* Toolbar */}
      <div className="pixel-toolbar">
        <div className="pixel-tool-group">
          {([
            ['pencil', '', 'Draw'],
            ['eraser', '', 'Erase'],
            ['fill', '', 'Fill'],
            ['eyedropper', '', 'Pick Color'],
          ] as [Tool, string, string][]).map(([t, icon, label]) => (
            <button
              key={t}
              className={`pixel-tool-btn${tool === t ? ' active' : ''}`}
              onClick={() => setTool(t)}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="pixel-tool-group">
          <label className="gen-label">Size:</label>
          {GRID_SIZES.map(s => (
            <button
              key={s}
              className={`json-mode-btn${gridSize === s ? ' active' : ''}`}
              onClick={() => changeGridSize(s)}
            >
              {s}×{s}
            </button>
          ))}
        </div>

        <div className="pixel-tool-group">
          <label className="gen-check-label">
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            Grid
          </label>
        </div>

        <div className="pixel-tool-group pixel-tool-group-right">
          <button className="btn-ghost" onClick={clear}>Clear</button>
          <button className="btn-primary" onClick={exportPng}>Export PNG</button>
        </div>
      </div>

      <div className="pixel-editor-body">
        {/* Canvas */}
        <div className="pixel-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={gridSize * cellSize}
            height={gridSize * cellSize}
            className="pixel-canvas"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>

        {/* Color panel */}
        <div className="pixel-color-panel">
          <div className="pixel-current-color-wrap">
            <div className="pixel-current-color" style={{ background: color }} />
            <input type="color" className="color-picker-native" value={color} onChange={e => setColor(e.target.value)} />
            <input className="tool-input-sm" value={color} onChange={e => setColor(e.target.value)} maxLength={7} />
          </div>

          <p className="json-panel-label" style={{marginTop:'1rem'}}>Palette</p>
          <div className="pixel-palette">
            {palette.map((c, i) => (
              <button
                key={i}
                className={`pixel-palette-swatch${color === c ? ' active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>

          {/* Add custom to palette */}
          <button className="btn-ghost-xs" style={{marginTop:'0.5rem'}} onClick={() => {
            if (!palette.includes(color)) setPalette(p => [...p, color]);
          }}>
            + Add current to palette
          </button>
        </div>
      </div>
    </div>
  );
}
