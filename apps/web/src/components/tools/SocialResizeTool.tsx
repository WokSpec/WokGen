'use client';

import { useState, useRef, useCallback } from 'react';

interface Preset {
  id: string;
  platform: string;
  label: string;
  w: number;
  h: number;
  selected: boolean;
}

const DEFAULT_PRESETS: Preset[] = [
  { id: 'ig-post',    platform: 'Instagram', label: 'Post (Square)',    w: 1080, h: 1080, selected: true },
  { id: 'ig-port',    platform: 'Instagram', label: 'Post (Portrait)', w: 1080, h: 1350, selected: true },
  { id: 'ig-story',   platform: 'Instagram', label: 'Story / Reel',    w: 1080, h: 1920, selected: true },
  { id: 'tw-post',    platform: 'Twitter/X', label: 'Post',            w: 1200, h: 675,  selected: true },
  { id: 'tw-header',  platform: 'Twitter/X', label: 'Header',          w: 1500, h: 500,  selected: false },
  { id: 'fb-post',    platform: 'Facebook',  label: 'Post',            w: 1200, h: 630,  selected: true },
  { id: 'fb-cover',   platform: 'Facebook',  label: 'Cover',           w: 820,  h: 312,  selected: false },
  { id: 'li-post',    platform: 'LinkedIn',  label: 'Post',            w: 1200, h: 627,  selected: false },
  { id: 'li-banner',  platform: 'LinkedIn',  label: 'Banner',          w: 1584, h: 396,  selected: false },
  { id: 'yt-thumb',   platform: 'YouTube',   label: 'Thumbnail',       w: 1280, h: 720,  selected: true },
  { id: 'yt-banner',  platform: 'YouTube',   label: 'Channel Banner',  w: 2560, h: 1440, selected: false },
  { id: 'tt-post',    platform: 'TikTok',    label: 'Post',            w: 1080, h: 1920, selected: false },
  { id: 'og',         platform: 'Web',       label: 'OG / Social Card',w: 1200, h: 630,  selected: false },
  { id: 'apple-touch',platform: 'iOS',       label: 'App Icon',        w: 180,  h: 180,  selected: false },
];

type Fit = 'cover' | 'contain' | 'fill';

function resizeToCanvas(img: HTMLImageElement, w: number, h: number, fit: Fit): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const iw = img.naturalWidth, ih = img.naturalHeight;
  let sw = iw, sh = ih, sx = 0, sy = 0, dx = 0, dy = 0, dw = w, dh = h;

  if (fit === 'cover') {
    const scale = Math.max(w / iw, h / ih);
    const fw = iw * scale, fh = ih * scale;
    dx = (w - fw) / 2; dy = (h - fh) / 2;
    dw = fw; dh = fh;
  } else if (fit === 'contain') {
    const scale = Math.min(w / iw, h / ih);
    const fw = iw * scale, fh = ih * scale;
    dx = (w - fw) / 2; dy = (h - fh) / 2;
    dw = fw; dh = fh;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  return c;
}

export default function SocialResizeTool() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  const [fit, setFit] = useState<Fit>('cover');
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState<{ id: string; url: string; label: string; platform: string; w: number; h: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setResults([]);
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = url;
  }, []);

  const togglePreset = (id: string) => {
    setPresets(p => p.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
  };

  const exportAll = useCallback(async () => {
    if (!image) return;
    setExporting(true);
    const selected = presets.filter(p => p.selected);
    const out: typeof results = [];

    for (const p of selected) {
      const c = resizeToCanvas(image, p.w, p.h, fit);
      out.push({ id: p.id, url: c.toDataURL('image/png'), label: p.label, platform: p.platform, w: p.w, h: p.h });
    }

    setResults(out);
    setExporting(false);
  }, [image, presets, fit]);

  const downloadAll = useCallback(async () => {
    if (!results.length) return;
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const r of results) {
        const base64 = r.url.split(',')[1];
        zip.file(`${r.platform}-${r.label.replace(/\s+/g, '-')}-${r.w}x${r.h}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'social-media-resized.zip';
      a.click();
    } catch {
      // Fallback: download individually
      for (const r of results) {
        const a = document.createElement('a');
        a.href = r.url;
        a.download = `${r.platform}-${r.label}-${r.w}x${r.h}.png`;
        a.click();
      }
    }
  }, [results]);

  const platforms = [...new Set(DEFAULT_PRESETS.map(p => p.platform))];

  return (
    <div className="social-resize-tool">
      {/* Upload */}
      {!preview ? (
        <div
          className="tool-dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
        >
          <p className="tool-dropzone-text">Drop your image here or click to browse</p>
          <p className="tool-dropzone-sub">PNG · JPG · WebP · GIF</p>
          <p className="tool-dropzone-private">All processing in your browser</p>
          <input ref={inputRef} type="file" accept="image/*" className="tool-file-input-hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>
      ) : (
        <div className="social-resize-layout">
          {/* Left: settings */}
          <div className="social-resize-settings">
            <div className="social-resize-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Source" className="social-resize-preview" />
              <button className="btn-ghost-xs social-resize-change" onClick={() => { setPreview(null); setImage(null); setResults([]); }}>Change image</button>
            </div>

            {/* Fit mode */}
            <div className="gen-row" style={{marginTop:'1rem'}}>
              <label className="gen-label">Fit:</label>
              {(['cover','contain','fill'] as Fit[]).map(f => (
                <button key={f} className={`json-mode-btn${fit === f ? ' active' : ''}`} onClick={() => setFit(f)}>{f}</button>
              ))}
            </div>

            {/* Platform presets */}
            <div style={{marginTop:'1rem'}}>
              <p className="json-panel-label" style={{marginBottom:'0.5rem'}}>Select sizes to export:</p>
              {platforms.map(platform => (
                <div key={platform} className="social-platform-group">
                  <p className="social-platform-name">{platform}</p>
                  {presets.filter(p => p.platform === platform).map(preset => (
                    <label key={preset.id} className="social-preset-item">
                      <input type="checkbox" checked={preset.selected} onChange={() => togglePreset(preset.id)} />
                      <span className="social-preset-label">{preset.label}</span>
                      <span className="social-preset-dims">{preset.w}×{preset.h}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div className="gen-row" style={{marginTop:'1.5rem'}}>
              <button className="btn-primary" onClick={exportAll} disabled={exporting || !presets.some(p => p.selected)}>
                {exporting ? 'Generating…' : 'Generate'}
              </button>
              {results.length > 0 && (
                <button className="btn-ghost" onClick={downloadAll}>
                  Download ZIP ({results.length})
                </button>
              )}
            </div>
          </div>

          {/* Right: results grid */}
          {results.length > 0 && (
            <div className="social-resize-results">
              <p className="json-panel-label" style={{marginBottom:'0.75rem'}}>Results ({results.length})</p>
              <div className="social-results-grid">
                {results.map(r => (
                  <div key={r.id} className="social-result-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.label} className="social-result-img" />
                    <div className="social-result-info">
                      <span className="social-result-platform">{r.platform}</span>
                      <span className="social-result-label">{r.label}</span>
                      <span className="social-result-dims">{r.w}×{r.h}</span>
                    </div>
                    <a href={r.url} download={`${r.platform}-${r.label.replace(/\s+/g, '-')}-${r.w}x${r.h}.png`} className="btn-ghost-xs">Download</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
