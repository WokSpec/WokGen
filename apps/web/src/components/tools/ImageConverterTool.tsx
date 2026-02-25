'use client';

import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

interface ConvertedFile {
  id: string;
  name: string;
  originalSize: number;
  convertedSize: number | null;
  status: 'pending' | 'converting' | 'done' | 'error';
  downloadUrl: string | null;
  error: string | null;
}

const FORMAT_OPTIONS: { label: string; value: OutputFormat; hasQuality: boolean; warning?: string }[] = [
  { label: 'PNG', value: 'image/png', hasQuality: false },
  { label: 'JPG', value: 'image/jpeg', hasQuality: true },
  { label: 'WebP', value: 'image/webp', hasQuality: true },
  { label: 'GIF', value: 'image/gif', hasQuality: false, warning: 'GIF output is a static frame. Colors may be reduced.' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getOutputExt(fmt: OutputFormat): string {
  return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[fmt];
}

async function convertFile(file: File, format: OutputFormat, quality: number): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Conversion failed')); return; }
          resolve({ blob, url: URL.createObjectURL(blob) });
        },
        format,
        format === 'image/png' || format === 'image/gif' ? 1.0 : Math.max(0, Math.min(1, quality / 100))
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
    img.src = objectUrl;
  });
}

export default function ImageConverterTool() {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(85);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  const currentFmt = FORMAT_OPTIONS.find(f => f.value === format)!;

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setFiles(prev => {
      const slots = 10 - prev.length;
      if (slots <= 0) return prev;
      const toAdd = arr.slice(0, slots).map((f): ConvertedFile => {
        const id = `${f.name}-${f.size}-${Date.now()}-${Math.random()}`;
        fileMapRef.current.set(id, f);
        return { id, name: f.name, originalSize: f.size, convertedSize: null, status: 'pending', downloadUrl: null, error: null };
      });
      return [...prev, ...toAdd];
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const convertAll = useCallback(async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length) return;
    for (const cf of pending) {
      const rawFile = fileMapRef.current.get(cf.id);
      if (!rawFile) continue;
      setFiles(prev => prev.map(f => f.id === cf.id ? { ...f, status: 'converting' } : f));
      try {
        const { blob, url } = await convertFile(rawFile, format, quality);
        const ext = getOutputExt(format);
        const baseName = cf.name.replace(/\.[^.]+$/, '');
        setFiles(prev => prev.map(f => f.id === cf.id
          ? { ...f, status: 'done', convertedSize: blob.size, downloadUrl: url, name: `${baseName}.${ext}`, error: null }
          : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === cf.id
          ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Error' }
          : f
        ));
      }
    }
  }, [files, format, quality]);

  const downloadAll = useCallback(async () => {
    const done = files.filter(f => f.status === 'done' && f.downloadUrl);
    if (!done.length) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const cf of done) {
        const resp = await fetch(cf.downloadUrl!);
        const buf = await resp.arrayBuffer();
        zip.file(cf.name, buf);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-images.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }, [files]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    fileMapRef.current.delete(id);
  };

  const clearAll = () => {
    files.forEach(f => { if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl); });
    fileMapRef.current.clear();
    setFiles([]);
  };

  const hasPending = files.some(f => f.status === 'pending');
  const hasDone = files.some(f => f.status === 'done');

  return (
    <div className="img-conv-tool">
      {/* Format + Quality controls */}
      <div className="img-conv-controls">
        <div className="img-conv-format-row">
          <span className="img-conv-label">Output format</span>
          <div className="img-conv-format-btns">
            {FORMAT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`img-conv-fmt-btn${format === opt.value ? ' active' : ''}`}
                onClick={() => setFormat(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {currentFmt.hasQuality && (
          <div className="img-conv-quality-row">
            <span className="img-conv-label">Quality</span>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="img-conv-slider"
            />
            <span className="img-conv-quality-val">{quality}%</span>
          </div>
        )}
        {currentFmt.warning && (
          <p className="img-conv-warning">Warning: {currentFmt.warning}</p>
        )}
      </div>

      {/* Drop zone */}
      {files.length < 10 && (
        <div
          className={`tool-dropzone tool-dropzone-sm${isDragging ? ' img-conv-dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <p className="tool-dropzone-text">Drop images here or click to browse</p>
          <p className="tool-dropzone-sub">PNG · JPG · WebP · GIF · BMP · up to {10 - files.length} more</p>
          <p className="tool-dropzone-private">100% client-side — nothing uploaded</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="tool-file-input-hidden"
            onChange={e => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }}
          />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="img-conv-list">
          <div className="img-conv-list-header">
            <span className="img-conv-list-title">{files.length} file{files.length !== 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {hasDone && (
                <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={downloadAll} disabled={isZipping}>
                  {isZipping ? 'Zipping…' : 'Download All (.zip)'}
                </button>
              )}
              <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={clearAll}>
                Clear All
              </button>
            </div>
          </div>

          {files.map(cf => (
            <div key={cf.id} className="img-conv-row">
              <div className="img-conv-row-info">
                <span className="img-conv-filename">{cf.name}</span>
                <span className="img-conv-sizes">
                  {formatBytes(cf.originalSize)}
                  {cf.convertedSize !== null && (
                    <>
                      {' → '}
                      <span className={cf.convertedSize < cf.originalSize ? 'img-conv-saved' : 'img-conv-grew'}>
                        {formatBytes(cf.convertedSize)}
                      </span>
                      {cf.convertedSize < cf.originalSize && (
                        <span className="img-conv-pct">
                          {' '}(−{Math.round((1 - cf.convertedSize / cf.originalSize) * 100)}%)
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
              <div className="img-conv-row-actions">
                {cf.status === 'pending' && <span className="img-conv-badge pending">Pending</span>}
                {cf.status === 'converting' && <span className="img-conv-badge converting">Converting…</span>}
                {cf.status === 'error' && <span className="img-conv-badge error">Error: {cf.error}</span>}
                {cf.status === 'done' && cf.downloadUrl && (
                  <a href={cf.downloadUrl} download={cf.name} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                    Save
                  </a>
                )}
                <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} onClick={() => removeFile(cf.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Convert button */}
      {hasPending && (
        <button className="btn-primary" onClick={convertAll}>
          Convert {files.filter(f => f.status === 'pending').length} file{files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''} → {currentFmt.label}
        </button>
      )}
    </div>
  );
}
