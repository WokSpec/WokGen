'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type CompressFormat = 'image/jpeg' | 'image/webp';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageCompressTool() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<CompressFormat>('image/jpeg');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('compressed');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const compress = useCallback((img: HTMLImageElement, fmt: CompressFormat, q: number, origSize: number) => {
    setError(null);
    setIsLoading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Canvas 2D context not available');
        setIsLoading(false);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError('Failed to produce image blob');
            setIsLoading(false);
            return;
          }
          if (compressedUrl) URL.revokeObjectURL(compressedUrl);
          setCompressedSize(blob.size);
          setCompressedUrl(URL.createObjectURL(blob));
          setIsLoading(false);
        },
        fmt,
        q / 100
      );
    } catch (err) {
      setError('Image processing failed');
      setIsLoading(false);
    }
  }, [compressedUrl]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(url);
    setOriginalSize(file.size);
    const baseName = file.name.replace(/\.[^.]+$/, '');
    setFileName(baseName);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      compress(img, format, quality, file.size);
    };
    img.src = url;
  }, [originalUrl, format, quality, compress]);

  // Re-compress when quality/format changes
  useEffect(() => {
    if (!imgRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      compress(imgRef.current!, format, quality, originalSize);
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, format]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
  }, [loadFile]);

  const savings = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  const ext = format === 'image/jpeg' ? 'jpg' : 'webp';

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setOriginalUrl(null);
    setCompressedUrl(null);
    setOriginalSize(0);
    setCompressedSize(0);
    imgRef.current = null;
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="img-comp-tool">
      {/* Controls */}
      <div className="img-conv-controls">
        <div className="img-conv-format-row">
          <span className="img-conv-label">Output format</span>
          <div className="img-conv-format-btns">
            {(['image/jpeg', 'image/webp'] as CompressFormat[]).map(fmt => (
              <button
                key={fmt}
                className={`img-conv-fmt-btn${format === fmt ? ' active' : ''}`}
                onClick={() => setFormat(fmt)}
              >
                {fmt === 'image/jpeg' ? 'JPG' : 'WebP'}
              </button>
            ))}
          </div>
        </div>
        <div className="img-conv-quality-row">
          <span className="img-conv-label">Quality</span>
          <input
            type="range"
            min={0}
            max={100}
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            className="img-conv-slider"
          />
          <span className="img-conv-quality-val">{quality}%</span>
        </div>
      </div>

      {/* Status */}
      {error && <div className="img-comp-error">Error: {error}</div>}
      {isLoading && <div className="img-comp-loading">Processing…</div>}

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

      {/* Preview */}
      {originalUrl && (
        <div className="img-comp-compare">
          <div className="img-comp-panel">
            <div className="img-comp-panel-header">
              <span className="img-comp-panel-label">Original</span>
              <span className="img-comp-panel-size">{formatBytes(originalSize)}</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={originalUrl} alt="Original" className="img-comp-preview" />
          </div>
          <div className="img-comp-panel">
            <div className="img-comp-panel-header">
              <span className="img-comp-panel-label">Compressed</span>
              <span className="img-comp-panel-size">
                {compressedSize > 0 ? formatBytes(compressedSize) : '…'}
                {savings > 0 && <span className="img-conv-saved"> (−{savings}%)</span>}
                {savings < 0 && <span className="img-conv-grew"> (+{Math.abs(savings)}%)</span>}
              </span>
            </div>
            {compressedUrl
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={compressedUrl} alt="Compressed" className="img-comp-preview" />
              : <div className="img-comp-placeholder">Processing…</div>
            }
          </div>
        </div>
      )}

      {/* Actions */}
      {compressedUrl && (
        <div className="bgr-actions">
          <a href={compressedUrl} download={`${fileName}-compressed.${ext}`} className="btn-primary">
            ↓ Download {ext.toUpperCase()}
          </a>
          <button className="btn-ghost" onClick={reset}>
            Compress Another
          </button>
        </div>
      )}
    </div>
  );
}
