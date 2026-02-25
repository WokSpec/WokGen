'use client';
import { useState } from 'react';
import Image from 'next/image';

const ASPECT_RATIOS = [
  { value: 'ASPECT_1_1', label: '1:1 Square' },
  { value: 'ASPECT_16_9', label: '16:9 Wide' },
  { value: 'ASPECT_9_16', label: '9:16 Portrait' },
  { value: 'ASPECT_4_3', label: '4:3' },
  { value: 'ASPECT_3_2', label: '3:2' },
];
const STYLE_TYPES = [
  { value: 'AUTO', label: 'Auto' },
  { value: 'GENERAL', label: 'General' },
  { value: 'REALISTIC', label: 'Realistic' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'RENDER_3D', label: '3D Render' },
  { value: 'ANIME', label: 'Anime' },
];

export default function IdeogramPage() {
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState('ASPECT_1_1');
  const [style, setStyle] = useState('AUTO');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/tools/ideogram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio: aspect, styleType: style }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || 'Generation failed'); return; }
      setResult(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Ideogram — Text in Images</h1>
        <p className="tool-page-desc">Generate images where text actually renders correctly. Posters, logos, banners — powered by Ideogram V2.</p>
      </div>
      <div className="tool-section">
        <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Prompt (include text in quotes)</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder='e.g. A dark fantasy movie poster with the text "SHADOW REALM" in glowing gothic letters'
          rows={3}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', marginBottom: '0.75rem' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Aspect ratio</label>
            <select value={aspect} onChange={e => setAspect(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
              {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
              {STYLE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={generate} disabled={loading || !prompt.trim()} className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
          {loading ? 'Generating...' : 'Generate with Ideogram'}
        </button>
        {error && <p style={{ marginTop: '0.875rem', color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}
        {result?.url && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', aspectRatio: '1', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <Image src={result.url} alt={result.prompt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
            </div>
            <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.625rem' }}>
              <a href={result.url} download="ideogram.png" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', textDecoration: 'none' }}>Download</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
