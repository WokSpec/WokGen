'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error';

function BackgroundRemoverToolInner() {
  const [status, setStatus] = useState<Status>('idle');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [comparePos, setComparePos] = useState(50);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);

  const processFile = useCallback(async (file: File) => {
    lastFileRef.current = file;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    setError(null);
    setResultUrl(null);
    setProgress(0);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setStatus('loading-model');

    try {
      // Dynamic import so WASM only loads when tool is used
      const { removeBackground } = await import('@imgly/background-removal');
      setStatus('processing');
      setProgress(30);

      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          if (total > 0) setProgress(Math.round((current / total) * 70) + 30);
        },
      });

      setProgress(100);
      setResultUrl(URL.createObjectURL(blob));
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Background removal failed. Try a different image.'
      );
      setStatus('error');
    }
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const reset = () => {
    setStatus('idle');
    setOriginalUrl(null);
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setComparePos(50);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRetry = useCallback(() => {
    if (lastFileRef.current) {
      processFile(lastFileRef.current);
    } else {
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processFile]);

  // Pre-load image from WAP processImage action (imageUrl query param)
  const searchParams = useSearchParams();
  const preloadUrl = searchParams.get('imageUrl');

  useEffect(() => {
    if (!preloadUrl) return;
    fetch(preloadUrl)
      .then(r => r.blob())
      .then(blob => {
        const ext = blob.type.split('/')[1] ?? 'png';
        processFile(new File([blob], `image.${ext}`, { type: blob.type }));
      })
      .catch(() => setError('Failed to load image from URL.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadUrl]);

  return (
    <div className="bgr-tool">
      {/* Upload Zone */}
      {status === 'idle' && (
        <div
          className="tool-dropzone"
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <p className="tool-dropzone-text">Drop an image here or click to browse</p>
          <p className="tool-dropzone-sub">PNG · JPG · WebP · AVIF · BMP · TIFF</p>
          <p className="tool-dropzone-private">Processed entirely in your browser — nothing uploaded</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="tool-file-input-hidden"
            onChange={onFileChange}
          />
        </div>
      )}

      {/* Loading / Processing */}
      {(status === 'loading-model' || status === 'processing') && (
        <div className="tool-processing">
          <p className="tool-processing-label">
            {status === 'loading-model'
              ? 'Loading AI model (one-time download ~3MB)…'
              : 'Removing background…'}
          </p>
          <div className="tool-progress-bar">
            <div className="tool-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="tool-processing-sub">{progress}%</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', padding: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#f87171', marginBottom: '0.625rem' }}>{error}</p>
          <button
            onClick={handleRetry}
            style={{ fontSize: '0.75rem', color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
            Try again
          </button>
        </div>
      )}

      {/* Result */}
      {status === 'done' && resultUrl && originalUrl && (
        <div className="bgr-result">
          {/* Comparison slider */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', border: '1px solid var(--border)', aspectRatio: '1', maxWidth: '480px', margin: '0 auto' }}>
            {/* Original (behind) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={originalUrl} alt="Original" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            {/* Result (clipped left side) */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${comparePos}%` }}>
              {/* checkered bg for transparency */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%)', backgroundSize: '16px 16px', opacity: 0.4 }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Background removed" style={{ position: 'absolute', inset: 0, width: `${10000 / comparePos}%`, height: '100%', objectFit: 'contain' }} />
            </div>
            {/* Slider input */}
            <input
              type="range" min={0} max={100} value={comparePos}
              onChange={e => setComparePos(Number(e.target.value))}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize', zIndex: 10, margin: 0 }}
            />
            {/* Divider line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${comparePos}%`, width: '2px', background: 'white', boxShadow: '0 0 6px rgba(0,0,0,0.5)', pointerEvents: 'none', transform: 'translateX(-50%)' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '28px', height: '28px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#374151' }}>⟺</div>
            </div>
            {/* Labels */}
            <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.7rem', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '4px', padding: '2px 6px', pointerEvents: 'none' }}>Original</span>
            <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.7rem', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '4px', padding: '2px 6px', pointerEvents: 'none' }}>Removed</span>
          </div>

          <div className="bgr-actions" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
              <a
                href={resultUrl}
                download="background-removed.png"
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', fontSize: '0.9375rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PNG
              </a>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>Saved as PNG with transparent background</span>
            </div>
            <button className="btn-ghost" onClick={reset}>
              Process Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BackgroundRemoverTool() {
  return (
    <Suspense fallback={null}>
      <BackgroundRemoverToolInner />
    </Suspense>
  );
}
