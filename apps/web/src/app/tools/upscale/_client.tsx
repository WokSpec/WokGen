'use client';

import { useState, useCallback, useRef } from 'react';

interface UpscaleResult {
  url: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  durationMs: number;
}

type Scale = 2 | 4;

export function UpscaleClient() {
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<Scale>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpscaleResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
      setImageUrl(dataUrl);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleUpscale = useCallback(async () => {
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/tools/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, scale }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }
      const data = await response.json() as UpscaleResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upscale failed');
    } finally {
      setLoading(false);
    }
  }, [imageUrl, scale]);

  return (
    <div className="tool-upscale">
      <div className="tool-page__inner">
        <div className="tool-page__header">
          <h1 className="tool-page__title">4× Image Upscaler</h1>
          <p className="tool-page__subtitle">Sharpen and enlarge images with Real-ESRGAN AI</p>
        </div>

        <div className="tool-upscale__input tool-page__card">
          {/* URL input */}
          <label className="tool-page__label">Image URL</label>
          <div className="tool-page__row">
            <input
              className="tool-page__input"
              type="url"
              placeholder="https://example.com/image.png"
              value={imageUrl.startsWith('data:') ? '' : imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setPreviewUrl(e.target.value || null); setResult(null); }}
            />
          </div>

          <div className="tool-page__divider">— or drop an image —</div>

          {/* Drop zone */}
          <div
            className={`tool-upscale__dropzone${dragging ? ' tool-upscale__dropzone--drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            aria-label="Drop image or click to upload"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Input preview" className="tool-upscale__preview" />
            ) : (
              <span className="tool-upscale__dropzone-text">Click or drag & drop image here</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {/* Scale selector */}
          <label className="tool-page__label" style={{ marginTop: 16 }}>Scale factor</label>
          <div className="tool-page__toggle-row">
            {([2, 4] as Scale[]).map((s) => (
              <button
                key={s}
                className={`tool-page__toggle${scale === s ? ' tool-page__toggle--active' : ''}`}
                onClick={() => setScale(s)}
                type="button"
              >
                {s}×
              </button>
            ))}
          </div>

          {error && <div className="tool-page__error">{error}</div>}

          <button
            className="tool-page__btn-primary"
            onClick={handleUpscale}
            disabled={loading || !imageUrl.trim()}
            type="button"
            style={{ marginTop: 16 }}
          >
            {loading ? <><span className="tool-page__spinner" />Upscaling…</> : 'Upscale Image'}
          </button>
        </div>

        {result && (
          <div className="tool-upscale__compare tool-page__card">
            <div className="tool-upscale__compare-grid">
              <div className="tool-upscale__before">
                <div className="tool-page__compare-label">Before · {result.originalWidth}×{result.originalHeight}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl ?? imageUrl} alt="Before" className="tool-upscale__img" />
              </div>
              <div className="tool-upscale__after">
                <div className="tool-page__compare-label">After · {result.width}×{result.height}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt="After" className="tool-upscale__img" />
              </div>
            </div>
            <a
              href={result.url}
              download="upscaled.png"
              className="tool-page__btn-primary"
              style={{ display: 'inline-flex', marginTop: 16, textDecoration: 'none' }}
            >
              ↓ Download
            </a>
            <p className="tool-page__note">Powered by Real-ESRGAN via HuggingFace · {result.durationMs}ms</p>
          </div>
        )}
      </div>
    </div>
  );
}
