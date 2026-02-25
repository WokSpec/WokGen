'use client';

import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';

const SIZES = [
  { label: '16×16', size: 16, name: 'favicon-16x16.png' },
  { label: '32×32', size: 32, name: 'favicon-32x32.png' },
  { label: '48×48', size: 48, name: 'favicon-48x48.png' },
  { label: '64×64', size: 64, name: 'favicon-64x64.png' },
  { label: '128×128', size: 128, name: 'favicon-128x128.png' },
  { label: '180×180 (Apple)', size: 180, name: 'apple-touch-icon.png' },
];

function renderToCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);
  return canvas;
}

export default function FaviconTool() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ size: number; url: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [fileName, setFileName] = useState('favicon');
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const processImage = useCallback((img: HTMLImageElement) => {
    const previewSizes = [16, 32, 48, 64, 128];
    const newPreviews = previewSizes.map(size => {
      const canvas = renderToCanvas(img, size);
      return { size, url: canvas.toDataURL('image/png') };
    });
    setPreviews(prev => {
      prev.forEach(p => { /* data URLs don't need revocation */ });
      return newPreviews;
    });
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setFileName(file.name.replace(/\.[^.]+$/, ''));
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      processImage(img);
    };
    img.src = url;
  }, [originalUrl, processImage]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
  }, [loadFile]);

  const downloadAll = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const { size, name } of SIZES) {
        const canvas = renderToCanvas(img, size);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        zip.file(name, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'favicons.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }, []);

  const downloadSingle = useCallback((size: number, name: string) => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = renderToCanvas(img, size);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setPreviews([]);
    imgRef.current = null;
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="favicon-tool">
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
          <div className="tool-dropzone-icon">Upload</div>
          <p className="tool-dropzone-text">Drop your logo or image here</p>
          <p className="tool-dropzone-sub">PNG · SVG · JPG · WebP — square images work best</p>
          <p className="tool-dropzone-private">100% client-side — nothing uploaded</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="tool-file-input-hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
          />
        </div>
      )}

      {originalUrl && previews.length > 0 && (
        <>
          {/* Size previews */}
          <div className="favicon-previews">
            {previews.map(p => (
              <div key={p.size} className="favicon-preview-item">
                <div className="favicon-preview-box" style={{ width: Math.max(p.size, 32), height: Math.max(p.size, 32) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={`${p.size}px preview`}
                    style={{ width: p.size, height: p.size, imageRendering: p.size <= 32 ? 'pixelated' : 'auto' }}
                  />
                </div>
                <span className="favicon-preview-label">{p.size}px</span>
              </div>
            ))}
          </div>

          {/* File list with individual downloads */}
          <div className="img-conv-list">
            <div className="img-conv-list-header">
              <span className="img-conv-list-title">Generated files</span>
            </div>
            {SIZES.map(({ label, size, name }) => (
              <div key={name} className="img-conv-row">
                <div className="img-conv-row-info">
                  <span className="img-conv-filename">{name}</span>
                  <span className="img-conv-sizes">{label}</span>
                </div>
                <div className="img-conv-row-actions">
                  <button
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => downloadSingle(size, name)}
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="favicon-ico-note">
            <p><strong>Need a .ico file?</strong> Download the PNGs above and combine them using an online <code>.ico</code> maker (e.g. favicon.io).</p>
          </div>

          {/* Actions */}
          <div className="bgr-actions">
            <button className="btn-primary" onClick={downloadAll} disabled={isZipping}>
              {isZipping ? 'Creating ZIP…' : 'Download All as ZIP'}
            </button>
            <button className="btn-ghost" onClick={reset}>
              Load Another
            </button>
          </div>
        </>
      )}
    </div>
  );
}
