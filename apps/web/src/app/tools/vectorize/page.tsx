'use client';
import { useState, useRef, useEffect } from 'react';

export default function VectorizePage() {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when URL changes (debounced)
  useEffect(() => {
    if (inputMode !== 'url' || !imageUrl.trim()) { setPreviewSrc(''); return; }
    const t = setTimeout(() => setPreviewSrc(imageUrl.trim()), 600);
    return () => clearTimeout(t);
  }, [imageUrl, inputMode]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF, WebP, etc.)');
      return;
    }
    setError('');
    setUploadedFile(f);
    setPreviewSrc(URL.createObjectURL(f));
  }

  async function vectorize() {
    const hasInput = inputMode === 'url' ? imageUrl.trim() : uploadedFile;
    if (!hasInput) return;
    setLoading(true); setError(''); setSvg('');
    try {
      let body: Record<string, string>;
      if (inputMode === 'upload' && uploadedFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        body = { imageBase64: dataUrl };
      } else {
        body = { imageUrl };
      }
      const res = await fetch('/api/tools/vectorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Vectorization failed'); return; }
      setSvg(data.svg);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vectorized.svg'; a.click();
    URL.revokeObjectURL(url);
  }

  const canVectorize = loading ? false : (inputMode === 'url' ? !!imageUrl.trim() : !!uploadedFile);

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Raster to SVG</h1>
        <p className="tool-page-desc">Convert PNG, JPG, and GIF images into clean, scalable SVG vectors using Vectorizer.AI.</p>
      </div>
      <div className="tool-section">
        {/* Input mode toggle */}
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '0.75rem', width: 'fit-content' }}>
          {(['url', 'upload'] as const).map(m => (
            <button key={m} onClick={() => { setInputMode(m); setSvg(''); setError(''); }}
              style={{ padding: '0.375rem 1rem', fontSize: '0.8125rem', background: inputMode === m ? 'rgba(255,255,255,0.1)' : 'transparent', color: inputMode === m ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
              {m === 'url' ? 'Image URL' : 'Upload File'}
            </button>
          ))}
        </div>

        {inputMode === 'url' ? (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && vectorize()}
              placeholder="https://example.com/logo.png"
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none' }}
            />
            <button onClick={vectorize} disabled={!canVectorize} className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', whiteSpace: 'nowrap' }}>
              {loading ? 'Converting...' : 'Vectorize'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              {uploadedFile ? uploadedFile.name : 'Choose image…'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            <button onClick={vectorize} disabled={!canVectorize} className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', whiteSpace: 'nowrap' }}>
              {loading ? 'Converting...' : 'Vectorize'}
            </button>
          </div>
        )}

        {/* Image preview */}
        {previewSrc && (
          <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Preview" onError={() => setPreviewSrc('')}
              style={{ width: '72px', height: '72px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {uploadedFile ? `${uploadedFile.name} · ${Math.round(uploadedFile.size / 1024)}KB` : 'Preview'}
            </span>
          </div>
        )}

        {error && <p style={{ marginTop: '0.875rem', color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}

        {svg && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>SVG output · {Math.round(svg.length / 1024)}KB</span>
              <button onClick={downloadSvg} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download SVG
              </button>
            </div>
            {/* Rendered SVG + code side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '0.875rem', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SVG Code</p>
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', overflow: 'auto', maxHeight: '160px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{svg.slice(0, 600)}{svg.length > 600 ? '…' : ''}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
