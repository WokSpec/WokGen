'use client';

import { useState, useRef, useCallback } from 'react';

type FitMode = 'contain' | 'cover' | 'fill';

const PRESETS = [
  { label: 'Instagram Post', w: 1080, h: 1080 },
  { label: 'Instagram Story', w: 1080, h: 1920 },
  { label: 'Twitter/X Post', w: 1200, h: 675 },
  { label: 'Facebook Cover', w: 820, h: 312 },
  { label: 'LinkedIn Banner', w: 1584, h: 396 },
  { label: 'YouTube Thumbnail', w: 1280, h: 720 },
  { label: 'OG Image', w: 1200, h: 630 },
];

export default function ImageResizeTool() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [fileName, setFileName] = useState('resized');
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<'image/png'|'image/jpeg'|'image/webp'>('image/png');
  const [quality, setQuality] = useState(90);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setError(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setOriginalSize(file.size);
    setFileName(file.name.replace(/\.[^.]+$/, ''));
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
    img.src = url;
  }, [originalUrl, resultUrl]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
  }, [loadFile]);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && naturalW && naturalH) {
      setHeight(Math.round(val * naturalH / naturalW));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && naturalW && naturalH) {
      setWidth(Math.round(val * naturalW / naturalH));
    }
  };

  const applyPreset = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
  };

  const doResize = useCallback(() => {
    setError(null);
    const img = imgRef.current;
    if (!img) {
      setError('No image loaded');
      return;
    }
    if (!width || !height) {
      setError('Invalid dimensions');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas not available');
      return;
    }
    setIsLoading(true);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (fitMode === 'fill') {
      ctx.drawImage(img, 0, 0, width, height);
    } else if (fitMode === 'contain') {
      const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
    } else {
      // cover — crop center
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
    }

    canvas.toBlob(blob => {
      if (!blob) {
        setError('Failed to create image');
        setIsLoading(false);
        return;
      }
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setIsLoading(false);
    }, outputFormat, outputFormat === 'image/png' ? undefined : quality / 100);
  }, [imgRef, width, height, fitMode, resultUrl, outputFormat, quality]);

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    imgRef.current = null;
    setNaturalW(0);
    setNaturalH(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="img-resize-tool">
      {/* Drop zone */}
      {!originalUrl && (
        <div
          className={`tool-dropzone${isDragging ? ' img-conv-dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <p className="tool-dropzone-text">Drop an image here or click to browse</p>
          <p className="tool-dropzone-sub">PNG · JPG · WebP · GIF</p>
          <p className="tool-dropzone-private">100% client-side — nothing uploaded</p>
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif"
            className="tool-file-input-hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
          />
        </div>
      )}

      {originalUrl && (
        <>
          {error && <div className="img-resize-error">Error: {error}</div>}
          {isLoading && <div className="img-resize-loading">Processing…</div>}
          {/* Presets */}
          <div className="img-resize-presets">
            <span className="img-conv-label">Presets</span>
            <div className="img-resize-preset-grid">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  className="img-resize-preset-btn"
                  onClick={() => applyPreset(p.w, p.h)}
                >
                  <span className="img-resize-preset-name">{p.label}</span>
                  <span className="img-resize-preset-dims">{p.w}×{p.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="img-resize-dims">
            <div className="img-resize-dim-row">
              <label className="img-conv-label" htmlFor="resize-w">Width (px)</label>
              <input
                id="resize-w"
                type="number"
                min={1}
                max={8000}
                value={width}
                onChange={e => handleWidthChange(Number(e.target.value))}
                className="tool-input"
                style={{ width: '100px' }}
              />
              <button
                className={`img-resize-lock-btn${lockAspect ? ' active' : ''}`}
                onClick={() => setLockAspect(l => !l)}
                title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              >
                {lockAspect ? 'Lock' : 'Unlock'}
              </button>
              <label className="img-conv-label" htmlFor="resize-h">Height (px)</label>
              <input
                id="resize-h"
                type="number"
                min={1}
                max={8000}
                value={height}
                onChange={e => handleHeightChange(Number(e.target.value))}
                className="tool-input"
                style={{ width: '100px' }}
              />
              {naturalW > 0 && (
                <span className="img-resize-orig-dims">
                  (original: {naturalW}×{naturalH})
                </span>
              )}
            </div>
          </div>

          {/* Fit mode */}
          <div className="img-conv-format-row">
            <span className="img-conv-label">Fit mode</span>
            <div className="img-conv-format-btns">
              {(['contain', 'cover', 'fill'] as FitMode[]).map(m => (
                <button
                  key={m}
                  className={`img-conv-fmt-btn${fitMode === m ? ' active' : ''}`}
                  onClick={() => setFitMode(m)}
                  title={m === 'contain' ? 'Letterbox (fit inside)' : m === 'cover' ? 'Crop to fill' : 'Stretch to fill'}
                >
                  {m === 'contain' ? 'Contain (letterbox)' : m === 'cover' ? 'Cover (crop)' : 'Fill (stretch)'}
                </button>
              ))}
            </div>
          </div>

          {/* Output format */}
          <div className="img-conv-format-row">
            <span className="img-conv-label">Output format</span>
            <div className="img-conv-format-btns">
              {(['image/png','image/jpeg','image/webp'] as const).map(fmt => (
                <button
                  key={fmt}
                  className={`img-conv-fmt-btn${outputFormat === fmt ? ' active' : ''}`}
                  onClick={() => setOutputFormat(fmt)}
                >
                  {fmt === 'image/png' ? 'PNG' : fmt === 'image/jpeg' ? 'JPG' : 'WebP'}
                </button>
              ))}
            </div>
            {outputFormat !== 'image/png' && (
              <div className="img-conv-quality-row">
                <span className="img-conv-label">Quality</span>
                <input type="range" min={0} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} />
                <span className="img-conv-quality-val">{quality}%</span>
              </div>
            )}
          </div>

          {originalSize > 10 * 1024 * 1024 && (
            <div className="img-resize-warning">Warning: image &gt; 10MB — processing may be slow or fail in some browsers.</div>
          )}

          {/* Result preview */}
          {resultUrl && (
            <div className="img-resize-result">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Resized" className="img-resize-preview" />
              <p className="img-resize-result-info">{width}×{height}px {outputFormat === 'image/png' ? 'PNG' : outputFormat === 'image/jpeg' ? 'JPG' : 'WebP'}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bgr-actions">
            <button className="btn-primary" onClick={doResize}>
              Resize to {width}×{height}
            </button>
            {resultUrl && (
              <a href={resultUrl} download={`${fileName}-${width}x${height}.${outputFormat === 'image/png' ? 'png' : outputFormat === 'image/jpeg' ? 'jpg' : 'webp'}`} className="btn-primary">
                ↓ Download {outputFormat === 'image/png' ? 'PNG' : outputFormat === 'image/jpeg' ? 'JPG' : 'WebP'}
              </a>
            )}
            <button className="btn-ghost" onClick={reset}>
              Load Another
            </button>
          </div>
        </>
      )}
    </div>
  );
}
