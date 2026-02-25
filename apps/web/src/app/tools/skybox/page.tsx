'use client';
import { useState } from 'react';
import Image from 'next/image';

const STYLES = [
  { value: 'fantasy-landscape', label: 'Fantasy Landscape' },
  { value: 'game-level', label: 'Game Level' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'digital-painting', label: 'Digital Painting' },
  { value: 'realistic-travel', label: 'Realistic Travel' },
  { value: 'anime', label: 'Anime' },
  { value: 'horror', label: 'Horror' },
  { value: 'underwater', label: 'Underwater' },
  { value: 'space', label: 'Space' },
  { value: 'interior', label: 'Interior' },
];

export default function SkyboxPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('fantasy-landscape');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/tools/skybox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Generation failed');
        return;
      }
      if (data.data.fileUrl) {
        setResult(data.data);
      } else {
        pollStatus(data.data.id);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function pollStatus(id: string) {
    setPolling(true);
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/skybox?id=${id}`);
        const data = await res.json();
        if (data.data.status === 'complete') {
          setResult(data.data); setPolling(false); clearInterval(iv);
        } else if (data.data.status === 'error') {
          setError('Skybox generation failed.'); setPolling(false); clearInterval(iv);
        }
      } catch { setPolling(false); clearInterval(iv); }
    }, 4000);
    setTimeout(() => { clearInterval(iv); setPolling(false); }, 300_000);
  }

  return (
    <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Skybox Generator</h1>
        <p className="tool-page-desc">Generate immersive 360° panoramic backgrounds for games, VR, and 3D scenes using Blockade Labs Skybox AI.</p>
      </div>
      <div className="tool-section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Describe the environment</label>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="e.g. ancient forest temple at dusk, neon cyberpunk city skyline"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
              {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={generate} disabled={loading || !prompt.trim() || polling} className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
          {loading || polling ? 'Generating...' : 'Generate 360° Panorama'}
        </button>

        {polling && (
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', animation: 'spin 600ms linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Rendering panorama... (~30–60 seconds)</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', background: 'rgba(239,68,68,0.05)' }}>
            <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
            {error.includes('SKYBOX_API_KEY') && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Get a free key at <a href="https://skybox.blockadelabs.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>skybox.blockadelabs.com</a>
              </p>
            )}
          </div>
        )}

        {result?.fileUrl && (
          <div style={{ marginTop: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '2/1' }}>
              <Image src={result.fileUrl} alt="360° panorama" fill className="object-cover" sizes="100vw" />
            </div>
            <div style={{ padding: '1rem', display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <a href={result.fileUrl} download="skybox-panorama.jpg" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', textDecoration: 'none' }}>Download HDR</a>
              {result.depthMapUrl && (
                <a href={result.depthMapUrl} download="skybox-depth.png" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', textDecoration: 'none' }}>Depth Map</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
