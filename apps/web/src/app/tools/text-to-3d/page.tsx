'use client';
import { useState, useEffect } from 'react';
import ToolShell from '@/components/tools/ToolShell';

const ART_STYLES = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'low-poly', label: 'Low Poly' },
  { value: 'sculpture', label: 'Sculpture' },
  { value: 'pbr', label: 'PBR Material' },
];

const progressMessages = [
  'Processing your description...',
  'Generating 3D geometry...',
  'Applying textures and materials...',
  'Finalizing model...',
  'Almost ready...',
];

export default function TextTo3DPage() {
  const [prompt, setPrompt] = useState('');
  const [artStyle, setArtStyle] = useState('realistic');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const isGenerating = loading || polling;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setProgressStep(s => (s + 1) % progressMessages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null); setTaskId(null);
    try {
      const res = await fetch('/api/tools/text-to-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, artStyle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to start generation');
        return;
      }
      setTaskId(data.data.taskId);
      pollStatus(data.data.taskId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus(id: string) {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tools/text-to-3d?taskId=${id}`);
        const data = await res.json();
        const task = data.data;
        if (task.status === 'SUCCEEDED') {
          setResult(task);
          setPolling(false);
          clearInterval(interval);
        } else if (task.status === 'FAILED') {
          setError('3D generation failed. Try a different prompt.');
          setPolling(false);
          clearInterval(interval);
        }
      } catch { clearInterval(interval); setPolling(false); }
    }, 3000);
    // Stop polling after 5 minutes
    setTimeout(() => { clearInterval(interval); setPolling(false); }, 300_000);
  }

  return (
    <ToolShell id="text-to-3d" label="Text to 3D" description="Generate 3D models from text descriptions using Meshy AI. Download as GLB, FBX, or OBJ." icon="T3D">
      <div className="tool-page-root">
      <div className="tool-page-header">
        <h1 className="tool-page-title">Text to 3D</h1>
        <p className="tool-page-desc">Generate 3D models from text descriptions using Meshy AI. Download as GLB, FBX, or OBJ.</p>
      </div>
      <div className="tool-section">
        <div className="tool-input-row">
          <div className="tool-input-row__main">
            <label className="tool-field-label">Describe your 3D model</label>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="e.g. low-poly medieval sword, fantasy potion bottle, sci-fi helmet"
              className="tool-field-input"
            />
          </div>
          <div>
            <label className="tool-field-label">Art style</label>
            <select value={artStyle} onChange={e => setArtStyle(e.target.value)} className="tool-field-select">
              {ART_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <button type="button" onClick={generate} disabled={loading || !prompt.trim()} className="btn btn-primary tool-submit-btn">
          {loading ? 'Submitting...' : 'Generate 3D Model'}
        </button>

        {(polling || taskId) && !result && !error && (
          <div className="tool-progress-card">
            <div className="tool-spinner" aria-hidden="true" />
            <div>
              <div className="tool-progress-msg">{progressMessages[progressStep]}</div>
              <div className="tool-progress-sub">Meshy AI is building your model. This takes 1–3 minutes.</div>
            </div>
          </div>
        )}

        {error && (
          <div className="tool-error-card">
            <p className="tool-error">{error}</p>
            {error.includes('MESHY_API_KEY') && (
              <p className="tool-error-hint">
                Get a free API key at <a href="https://www.meshy.ai/" target="_blank" rel="noopener noreferrer" className="tool-link">meshy.ai</a> — 200 free credits/month.
              </p>
            )}
          </div>
        )}

        {result && (() => {
          const glbUrl = result.modelUrls?.glb || null;
          const fbxUrl = result.modelUrls?.fbx || null;
          const objUrl = result.modelUrls?.obj || null;
          return (
            <div className="tool-result">
              {glbUrl ? (
                <div className="relative rounded overflow-hidden border border-white/10 bg-black"
                     style={{ minHeight: 400 }}>
                  {/* model-viewer is a web component — typed via @types/wc-polyfill */}
                  <model-viewer
                    src={glbUrl}
                    alt="3D model preview"
                    auto-rotate
                    camera-controls
                    shadow-intensity="1"
                    style={{ width: '100%', height: '400px', background: 'transparent' }}
                    camera-orbit="45deg 55deg 2.5m"
                    exposure="0.5"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                    <p className="text-xs text-[var(--text)]/40">Drag to rotate • Scroll to zoom • Right-click to pan</p>
                    <div className="flex gap-2">
                      {glbUrl && <a href={glbUrl} download className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[var(--text)]/70">GLB</a>}
                      {fbxUrl && <a href={fbxUrl} download className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[var(--text)]/70">FBX</a>}
                      {objUrl && <a href={objUrl} download className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[var(--text)]/70">OBJ</a>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tool-download-card">
                  <div className="tool-download-card__inner">
                    <div className="tool-download-card__label">Download 3D Model</div>
                    <div className="tool-download-card__formats">
                      {result.modelUrls && Object.entries(result.modelUrls).filter(([, v]) => v).map(([fmt, url]) => (
                        <a key={fmt} href={url as string} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary tool-format-btn">
                          {fmt}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="tool-section tool-about-section">
        <h3 className="tool-about-h3">About Meshy AI</h3>
        <p className="tool-about-p">
          Meshy AI generates production-ready 3D meshes from text or images. Models are exported in GLB, FBX, USDZ, and OBJ formats — ready for Unity, Unreal Engine, Blender, or web. Free tier includes 200 credits/month.
        </p>
      </div>
    </div>
    </ToolShell>
  );
}
