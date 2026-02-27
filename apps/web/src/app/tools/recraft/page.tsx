'use client';
import { useState } from 'react';
import Image from 'next/image';
import ToolShell from '@/components/tools/ToolShell';

const STYLES = [
  { value: 'digital_illustration', label: 'Digital Illustration' },
  { value: 'vector_illustration', label: 'Vector Illustration' },
  { value: 'realistic_image', label: 'Realistic Image' },
  { value: 'icon', label: 'Icon' },
  { value: 'digital_illustration/pixel_art', label: 'Pixel Art' },
  { value: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
  { value: 'vector_illustration/line_art', label: 'Line Art' },
  { value: 'vector_illustration/flat_2', label: 'Flat Design' },
  { value: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
  { value: 'vector_illustration/kawaii', label: 'Kawaii' },
];

const SIZES = ['1024x1024', '1365x1024', '1024x1365', '1536x1024', '1024x1536'];

export default function RecraftPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('digital_illustration');
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setImages([]);
    try {
      const res = await fetch('/api/tools/recraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || data.message || 'Generation failed'); return; }
      setImages(data.images);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell id="recraft" label="Recraft v3" description="Generate brand-quality illustrations, icons, and vector-style images using Recraft v3." icon="RC">
      <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Recraft v3</h1>
        <p className="tool-page-desc">Generate brand-quality illustrations, icons, and vector-style images. Recraft v3 excels at consistent, professional creative assets.</p>
      </div>
      <div className="tool-section">
        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Describe your image</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. A minimal flat icon of a rocket ship in brand blue on white background"
          style={{ width: '100%', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', marginBottom: '0.75rem' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
              {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Size</label>
            <select value={size} onChange={e => setSize(e.target.value)} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button type="button" onClick={generate} disabled={loading || !prompt.trim()} className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
          {loading ? 'Generating...' : 'Generate with Recraft'}
        </button>
        {error && <p style={{ marginTop: '0.875rem', color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
        {images.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {images.map((url, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                  <Image src={url} alt={`Generated ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 260px" />
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <a href={url} download={`recraft-${i + 1}.png`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'block', padding: '0.375rem', fontSize: '0.8125rem', textAlign: 'center', textDecoration: 'none' }}>Download</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </ToolShell>
  );
}
