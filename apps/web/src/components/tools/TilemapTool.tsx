'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const GRID_COLS = 20;
const GRID_ROWS = 15;
const MIN_TILE = 8;
const DEFAULT_TILE = 32;

type Layer = {
  id: number;
  name: string;
  visible: boolean;
  data: (number | null)[][];
};

function emptyLayer(id: number, name: string): Layer {
  return {
    id,
    name,
    visible: true,
    data: Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null)),
  };
}

export default function TilemapTool() {
  const [tileSize, setTileSize] = useState(DEFAULT_TILE);
  const [tilesetUrl, setTilesetUrl] = useState<string | null>(null);
  const [tilesetCols, setTilesetCols] = useState(8);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [layers, setLayers] = useState<Layer[]>([emptyLayer(0, 'Layer 1')]);
  const [activeLayer, setActiveLayer] = useState(0);
  const [tool, setTool] = useState<'paint' | 'erase' | 'fill'>('paint');
  const [isPainting, setIsPainting] = useState(false);
  const [zoom, setZoom] = useState(1);

  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const tilesetCanvasRef = useRef<HTMLCanvasElement>(null);
  const tilesetImg = useRef<HTMLImageElement | null>(null);
  const tilesetRows = useRef(4);

  // Draw tileset picker
  useEffect(() => {
    const canvas = tilesetCanvasRef.current;
    if (!canvas || !tilesetUrl) return;
    const img = new Image();
    img.onload = () => {
      tilesetImg.current = img;
      const cols = tilesetCols;
      const tileW = Math.floor(img.width / cols);
      const rows = Math.floor(img.height / tileW) || 4;
      tilesetRows.current = rows;
      canvas.width = cols * tileW;
      canvas.height = rows * tileW;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      // grid overlay
      ctx.strokeStyle = 'rgba(99,102,241,0.3)';
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * tileW, 0); ctx.lineTo(c * tileW, canvas.height); ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * tileW); ctx.lineTo(canvas.width, r * tileW); ctx.stroke();
      }
      // selected highlight
      if (selectedTile !== null) {
        const sc = selectedTile % cols;
        const sr = Math.floor(selectedTile / cols);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.strokeRect(sc * tileW + 1, sr * tileW + 1, tileW - 2, tileW - 2);
      }
    };
    img.src = tilesetUrl;
  }, [tilesetUrl, tilesetCols, selectedTile]);

  // Draw map canvas
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    canvas.width = GRID_COLS * tileSize;
    canvas.height = GRID_ROWS * tileSize;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // checkerboard bg
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1a1a2e' : '#16213e';
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }

    // draw layers
    layers.forEach(layer => {
      if (!layer.visible || !tilesetImg.current) return;
      const img = tilesetImg.current;
      const cols = tilesetCols;
      const tileW = Math.floor(img.width / cols);
      layer.data.forEach((row, r) => {
        row.forEach((tile, c) => {
          if (tile === null) return;
          const sc = tile % cols;
          const sr = Math.floor(tile / cols);
          ctx.drawImage(img, sc * tileW, sr * tileW, tileW, tileW, c * tileSize, r * tileSize, tileSize, tileSize);
        });
      });
    });

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= GRID_COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * tileSize, 0); ctx.lineTo(c * tileSize, canvas.height); ctx.stroke();
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * tileSize); ctx.lineTo(canvas.width, r * tileSize); ctx.stroke();
    }
  }, [layers, tileSize, tilesetCols]);

  const paintAt = useCallback((col: number, row: number) => {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;
    setLayers(prev => {
      const next = prev.map(l => l.id === activeLayer ? {
        ...l,
        data: l.data.map((r, ri) => r.map((c, ci) => {
          if (ri === row && ci === col) return tool === 'erase' ? null : selectedTile;
          return c;
        }))
      } : l);
      return next;
    });
  }, [activeLayer, tool, selectedTile]);

  const fillAt = useCallback((col: number, row: number) => {
    setLayers(prev => {
      const layer = prev.find(l => l.id === activeLayer);
      if (!layer) return prev;
      const target = layer.data[row][col];
      const fill = tool === 'erase' ? null : selectedTile;
      if (target === fill) return prev;
      const newData = layer.data.map(r => [...r]);
      const stack = [[row, col]];
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        if (cr < 0 || cr >= GRID_ROWS || cc < 0 || cc >= GRID_COLS) continue;
        if (newData[cr][cc] !== target) continue;
        newData[cr][cc] = fill;
        stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]);
      }
      return prev.map(l => l.id === activeLayer ? { ...l, data: newData } : l);
    });
  }, [activeLayer, tool, selectedTile]);

  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (tileSize * zoom));
    const row = Math.floor((e.clientY - rect.top) / (tileSize * zoom));
    if (tool === 'fill') fillAt(col, row);
    else paintAt(col, row);
  };

  const handleMapMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting || tool === 'fill') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (tileSize * zoom));
    const row = Math.floor((e.clientY - rect.top) / (tileSize * zoom));
    paintAt(col, row);
  };

  const handleTilesetClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = tilesetCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const img = tilesetImg.current;
    if (!img) return;
    const tileW = Math.floor(img.width / tilesetCols);
    const col = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width) / tileW);
    const row = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height) / tileW);
    setSelectedTile(row * tilesetCols + col);
  };

  const loadTileset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setTilesetUrl(URL.createObjectURL(f));
    setSelectedTile(null);
  };

  const addLayer = () => {
    const id = Date.now();
    setLayers(prev => [...prev, emptyLayer(id, `Layer ${prev.length + 1}`)]);
    setActiveLayer(id);
  };

  const removeLayer = (id: number) => {
    setLayers(prev => {
      const next = prev.filter(l => l.id !== id);
      if (next.length === 0) return prev;
      return next;
    });
    setActiveLayer(layers[0]?.id ?? 0);
  };

  const toggleLayer = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const exportJson = () => {
    const tiledJson = {
      height: GRID_ROWS,
      width: GRID_COLS,
      tileheight: tileSize,
      tilewidth: tileSize,
      tilesets: tilesetUrl ? [{ firstgid: 0, source: 'tileset.tsj' }] : [],
      layers: layers.map(l => ({
        id: l.id,
        name: l.name,
        type: 'tilelayer',
        visible: l.visible,
        width: GRID_COLS,
        height: GRID_ROWS,
        data: l.data.flat().map(t => t === null ? 0 : t + 1),
      })),
      version: '1.10',
      tiledversion: '1.10.0',
      type: 'map',
    };
    const blob = new Blob([JSON.stringify(tiledJson, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tilemap.json';
    a.click();
  };

  const clearLayer = () => {
    setLayers(prev => prev.map(l => l.id === activeLayer
      ? { ...l, data: Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null)) }
      : l
    ));
  };

  return (
    <div className="tilemap-tool">
      {/* Toolbar */}
      <div className="tilemap-toolbar">
        <div className="tilemap-toolbar-group">
          {(['paint', 'erase', 'fill'] as const).map(t => (
            <button key={t} className={`tilemap-tool-btn${tool === t ? ' active' : ''}`} onClick={() => setTool(t)}>
              {t === 'paint' ? '🖌️ Paint' : t === 'erase' ? '🧹 Erase' : '🪣 Fill'}
            </button>
          ))}
        </div>
        <div className="tilemap-toolbar-group">
          <label className="tilemap-label">Tile px</label>
          <select className="tool-select" value={tileSize} onChange={e => setTileSize(Number(e.target.value))}>
            {[16, 24, 32, 48, 64].map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
          <label className="tilemap-label">Zoom</label>
          <select className="tool-select" value={zoom} onChange={e => setZoom(Number(e.target.value))}>
            {[0.5, 1, 1.5, 2].map(z => <option key={z} value={z}>{z}×</option>)}
          </select>
        </div>
        <div className="tilemap-toolbar-group">
          <button className="btn-ghost-xs" onClick={clearLayer}>Clear Layer</button>
          <button className="btn-secondary btn-sm" onClick={exportJson}>Export JSON</button>
        </div>
      </div>

      <div className="tilemap-layout">
        {/* Tileset panel */}
        <div className="tilemap-sidebar">
          <div className="tilemap-section-header">Tileset</div>
          <label className="tool-file-label" style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            Upload image
            <input type="file" accept="image/*" onChange={loadTileset} style={{ display: 'none' }} />
          </label>
          {tilesetUrl ? (
            <div className="tilemap-tileset-wrap">
              <canvas ref={tilesetCanvasRef} className="tilemap-tileset-canvas" onClick={handleTilesetClick} />
            </div>
          ) : (
            <div className="tilemap-tileset-empty">Upload a tileset PNG to begin painting</div>
          )}

          <div className="tilemap-section-header" style={{ marginTop: '1rem' }}>Layers</div>
          <div className="tilemap-layers">
            {[...layers].reverse().map(l => (
              <div key={l.id} className={`tilemap-layer-row${l.id === activeLayer ? ' active' : ''}`} onClick={() => setActiveLayer(l.id)}>
                <button className="tilemap-layer-vis" onClick={e => { e.stopPropagation(); toggleLayer(l.id); }}>
                  {l.visible ? '👁️' : '🙈'}
                </button>
                <span className="tilemap-layer-name">{l.name}</span>
                {layers.length > 1 && (
                  <button className="tilemap-layer-del" onClick={e => { e.stopPropagation(); removeLayer(l.id); }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button className="btn-ghost-xs" style={{ marginTop: '0.5rem', width: '100%' }} onClick={addLayer}>+ Add Layer</button>
        </div>

        {/* Map canvas */}
        <div className="tilemap-canvas-wrap">
          <canvas
            ref={mapCanvasRef}
            className="tilemap-map-canvas"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', cursor: tool === 'fill' ? 'crosshair' : tool === 'erase' ? 'cell' : 'default' }}
            onClick={handleMapClick}
            onMouseMove={handleMapMove}
            onMouseDown={() => setIsPainting(true)}
            onMouseUp={() => setIsPainting(false)}
            onMouseLeave={() => setIsPainting(false)}
          />
        </div>
      </div>
    </div>
  );
}
