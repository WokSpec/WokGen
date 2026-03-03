'use client';

/**
 * MaskPainterPanel
 * ----------------
 * Interactive brush-based mask editor for the inpaint tool.
 * Displays the reference image at reduced opacity and lets the user
 * paint a white mask over the areas they want to inpaint.
 *
 * Outputs a black/white PNG dataURL via onMaskChange whenever the
 * mask is updated. White = areas to regenerate, black = keep.
 */

import { useRef, useEffect, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaskPainterPanelProps {
  /** The reference image to paint on top of (can be null if not yet loaded). */
  refImageUrl: string | null;
  /** Called with the B&W mask dataURL after every stroke, or null to clear. */
  onMaskChange: (maskDataUrl: string | null) => void;
  /** Display size of the canvas (square). Defaults to 320. */
  displaySize?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MaskPainterPanel({
  refImageUrl,
  onMaskChange,
  displaySize = 320,
}: MaskPainterPanelProps) {
  // The visible canvas shows the ref image + red overlay
  const displayRef = useRef<HTMLCanvasElement>(null);
  // The hidden mask canvas holds the pure black/white mask
  const maskRef    = useRef<HTMLCanvasElement>(null);

  const [brushSize,   setBrushSize]   = useState(24);
  const [paintMode,   setPaintMode]   = useState<'paint' | 'erase'>('paint');
  const [hasMask,     setHasMask]     = useState(false);
  const [imgLoaded,   setImgLoaded]   = useState(false);

  const isDrawing = useRef(false);
  const lastPos   = useRef<[number, number] | null>(null);
  const loadedImg = useRef<HTMLImageElement | null>(null);

  // Internal canvas size (always square, high-DPI)
  const CANVAS_SIZE = 512;

  // -------------------------------------------------------------------------
  // Load reference image
  // -------------------------------------------------------------------------
  useEffect(() => {
    setImgLoaded(false);
    setHasMask(false);
    onMaskChange(null);

    const maskCanvas = maskRef.current;
    if (maskCanvas) {
      const ctx = maskCanvas.getContext('2d')!;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    if (!refImageUrl) {
      redrawDisplay(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImg.current = img;
      setImgLoaded(true);
      redrawDisplay(img);
    };
    img.onerror = () => setImgLoaded(false);
    img.src = refImageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refImageUrl]);

  // -------------------------------------------------------------------------
  // Redraw the display canvas (ref image + red mask overlay)
  // -------------------------------------------------------------------------
  const redrawDisplay = useCallback((img: HTMLImageElement | null) => {
    const display = displayRef.current;
    const mask    = maskRef.current;
    if (!display || !mask) return;

    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Checkerboard background
    for (let y = 0; y < CANVAS_SIZE; y += 16) {
      for (let x = 0; x < CANVAS_SIZE; x += 16) {
        ctx.fillStyle = ((x / 16 + y / 16) % 2 === 0) ? '#444' : '#333';
        ctx.fillRect(x, y, 16, 16);
      }
    }

    // Reference image at 60% opacity
    if (img) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.globalAlpha = 1;
    }

    // Red overlay where mask is white
    const maskCtx  = mask.getContext('2d')!;
    const maskData = maskCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const overlay  = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
    for (let i = 0; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 128) {
        overlay.data[i]   = 220;  // R
        overlay.data[i+1] = 30;   // G
        overlay.data[i+2] = 80;   // B
        overlay.data[i+3] = 160;  // A
      }
    }
    ctx.putImageData(overlay, 0, 0);
  }, []);

  // -------------------------------------------------------------------------
  // Brush drawing on the mask canvas
  // -------------------------------------------------------------------------
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = displayRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top)  * scaleY,
    ];
  };

  const strokeAt = useCallback((x: number, y: number, fromX?: number, fromY?: number) => {
    const mask = maskRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d')!;

    ctx.globalCompositeOperation = paintMode === 'paint' ? 'source-over' : 'source-over';
    ctx.fillStyle   = paintMode === 'paint' ? '#ffffff' : '#000000';
    ctx.strokeStyle = paintMode === 'paint' ? '#ffffff' : '#000000';
    ctx.lineWidth   = brushSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    if (fromX !== undefined && fromY !== undefined) {
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    redrawDisplay(loadedImg.current);
    setHasMask(true);
    emitMask();
  }, [paintMode, brushSize, redrawDisplay]);

  const emitMask = useCallback(() => {
    const mask = maskRef.current;
    if (!mask) return;
    onMaskChange(mask.toDataURL('image/png'));
  }, [onMaskChange]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    strokeAt(pos[0], pos[1]);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const pos = getPos(e);
    if (lastPos.current) {
      strokeAt(pos[0], pos[1], lastPos.current[0], lastPos.current[1]);
    }
    lastPos.current = pos;
  };

  const onMouseUp = () => {
    isDrawing.current = false;
    lastPos.current   = null;
  };

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const fillAll = () => {
    const mask = maskRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    redrawDisplay(loadedImg.current);
    setHasMask(true);
    emitMask();
  };

  const clearAll = () => {
    const mask = maskRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    redrawDisplay(loadedImg.current);
    setHasMask(false);
    onMaskChange(null);
  };

  const invertMask = () => {
    const mask = maskRef.current;
    if (!mask) return;
    const ctx  = mask.getContext('2d')!;
    const data = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i]   = 255 - data.data[i];
      data.data[i+1] = 255 - data.data[i+1];
      data.data[i+2] = 255 - data.data[i+2];
    }
    ctx.putImageData(data, 0, 0);
    redrawDisplay(loadedImg.current);
    emitMask();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mask-painter">
      {/* Controls row */}
      <div className="mask-painter-toolbar">
        {/* Paint / Erase */}
        <div className="mask-painter-group">
          <button
            type="button"
            className={`mask-btn${paintMode === 'paint' ? ' active' : ''}`}
            onClick={() => setPaintMode('paint')}
            title="Paint mask (white)"
          >🖌 Paint</button>
          <button
            type="button"
            className={`mask-btn${paintMode === 'erase' ? ' active' : ''}`}
            onClick={() => setPaintMode('erase')}
            title="Erase mask"
          >⬜ Erase</button>
        </div>

        {/* Brush size */}
        <div className="mask-painter-group">
          <span className="mask-label">Brush</span>
          {[8, 16, 24, 40, 64].map(s => (
            <button
              key={s}
              type="button"
              className={`mask-size-btn${brushSize === s ? ' active' : ''}`}
              onClick={() => setBrushSize(s)}
            >{s}</button>
          ))}
        </div>

        {/* Actions */}
        <div className="mask-painter-group mask-painter-group-right">
          <button type="button" className="mask-btn" onClick={fillAll} title="Fill entire canvas">Fill all</button>
          <button type="button" className="mask-btn" onClick={invertMask} title="Invert mask">Invert</button>
          <button type="button" className="mask-btn mask-btn-danger" onClick={clearAll} title="Clear mask">Clear</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="mask-painter-canvas-wrap">
        {/* Hidden mask canvas (black/white) */}
        <canvas
          ref={maskRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: 'none' }}
        />

        {/* Display canvas (ref image + overlay) */}
        <canvas
          ref={displayRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="mask-painter-canvas"
          style={{
            width:  displaySize,
            height: displaySize,
            cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${Math.max(8, brushSize / 2)}' height='${Math.max(8, brushSize / 2)}' viewBox='0 0 ${Math.max(8, brushSize / 2)} ${Math.max(8, brushSize / 2)}'%3E%3Ccircle cx='50%25' cy='50%25' r='45%25' fill='none' stroke='%23fff' stroke-width='1.5'/%3E%3C/svg%3E") ${Math.max(4, brushSize / 4)} ${Math.max(4, brushSize / 4)}, crosshair`,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />

        {!refImageUrl && (
          <div className="mask-painter-empty">
            <p>Load a reference image first</p>
            <p style={{ fontSize: '0.72rem', opacity: 0.5 }}>
              Upload a sprite in the Reference Image section above, then paint the mask here.
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <p className="mask-painter-hint">
        {paintMode === 'paint'
          ? '🔴 Red overlay = areas to regenerate (inpaint)'
          : '⬜ Erase to keep original pixels'}
        {hasMask ? ' · Mask active ✓' : ' · No mask painted yet'}
      </p>
    </div>
  );
}
