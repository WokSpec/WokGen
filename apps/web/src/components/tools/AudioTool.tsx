'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

type Tab = 'waveform' | 'fileinfo' | 'gif';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toFixed(2);
  return `${m}:${s.padStart(5, '0')}`;
}

interface AudioInfo {
  format: string;
  duration: string;
  sampleRate: string;
  channels: string;
  fileSize: string;
  bitrate: string;
}

export default function AudioTool() {
  const [tab, setTab] = useState<Tab>('waveform');

  /* ── Waveform state ── */
  const [waveFile, setWaveFile] = useState<File | null>(null);
  const [waveBusy, setWaveBusy] = useState(false);
  const [waveError, setWaveError] = useState('');
  const waveCanvas = useRef<HTMLCanvasElement>(null);
  const waveDropRef = useRef<HTMLDivElement>(null);
  const waveInputRef = useRef<HTMLInputElement>(null);
  const [waveDrawn, setWaveDrawn] = useState(false);

  /* ── File info state ── */
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [infoBusy, setInfoBusy] = useState(false);
  const [infoError, setInfoError] = useState('');
  const infoDropRef = useRef<HTMLDivElement>(null);
  const infoInputRef = useRef<HTMLInputElement>(null);

  /* ── GIF state ── */
  const [gifFiles, setGifFiles] = useState<File[]>([]);
  const [gifDelay, setGifDelay] = useState(100);
  const [gifWidth, setGifWidth] = useState(320);
  const [gifBusy, setGifBusy] = useState(false);
  const [gifError, setGifError] = useState('');
  const [gifPreview, setGifPreview] = useState('');
  const gifDropRef = useRef<HTMLDivElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    offscreenRef.current = document.createElement('canvas');
  }, []);

  /* ── Waveform ── */
  const drawWaveform = useCallback(async (file: File) => {
    setWaveBusy(true); setWaveError('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = new AudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      await ctx.close();

      const canvas = waveCanvas.current;
      if (!canvas) return;
      const W = canvas.offsetWidth || 800;
      const H = 200;
      canvas.width = W;
      canvas.height = H;
      const c2d = canvas.getContext('2d')!;

      c2d.clearRect(0, 0, W, H);
      c2d.fillStyle = 'var(--bg-secondary, #1a1a2e)';
      c2d.fillRect(0, 0, W, H);

      const data = audioBuffer.getChannelData(0);
      const step = Math.ceil(data.length / W);
      const mid = H / 2;

      c2d.strokeStyle = 'var(--accent-primary, #6366f1)';
      c2d.lineWidth = 1.5;

      for (let x = 0; x < W; x++) {
        let min = 1, max = -1;
        for (let j = 0; j < step; j++) {
          const v = data[x * step + j] ?? 0;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        c2d.beginPath();
        c2d.moveTo(x, mid + min * mid);
        c2d.lineTo(x, mid + max * mid);
        c2d.stroke();
      }
      setWaveDrawn(true);
    } catch (e) {
      setWaveError(`Error: ${(e as Error).message}`);
    } finally {
      setWaveBusy(false);
    }
  }, []);

  const onWaveDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setWaveFile(file); setWaveDrawn(false); drawWaveform(file); }
  }, [drawWaveform]);

  /* ── Audio Info ── */
  const loadAudioInfo = useCallback(async (file: File) => {
    setInfoBusy(true); setInfoError('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = new AudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      await ctx.close();

      const ext = file.name.split('.').pop()?.toUpperCase() ?? '?';
      const bitrate = Math.round((file.size * 8) / audioBuffer.duration / 1000);

      setAudioInfo({
        format: ext,
        duration: formatDuration(audioBuffer.duration),
        sampleRate: `${audioBuffer.sampleRate.toLocaleString()} Hz`,
        channels: String(audioBuffer.numberOfChannels),
        fileSize: formatBytes(file.size),
        bitrate: `~${bitrate} kbps`,
      });
    } catch (e) {
      setInfoError(`Error: ${(e as Error).message}`);
    } finally {
      setInfoBusy(false);
    }
  }, []);

  const onInfoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setInfoFile(file); setAudioInfo(null); loadAudioInfo(file); }
  }, [loadAudioInfo]);

  /* ── GIF Frames ── */
  const addGifFiles = useCallback((files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    setGifFiles(prev => [...prev, ...imgs]);
    setGifError('');
    setGifPreview('');
  }, []);

  const onGifDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addGifFiles(e.dataTransfer.files);
  }, [addGifFiles]);

  const loadImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Failed to load ${file.name}`)); };
      img.src = url;
    });

  const buildGif = async () => {
    if (gifFiles.length < 1) { setGifError('Add at least one image.'); return; }
    setGifBusy(true); setGifError(''); setGifPreview('');
    try {
      const encoder = GIFEncoder();
      const canvas = offscreenRef.current!;
      const W = gifWidth;

      for (const file of gifFiles) {
        const img = await loadImage(file);
        const H = Math.round((img.naturalHeight / img.naturalWidth) * W);
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, W, H);
        const imageData = ctx.getImageData(0, 0, W, H);
        const palette = quantize(imageData.data as unknown as Uint8Array, 256);
        const index = applyPalette(imageData.data as unknown as Uint8Array, palette);
        encoder.writeFrame(index, W, H, { palette, delay: gifDelay });
      }
      encoder.finish();
      const bytes = encoder.bytes();
      const blob = new Blob([bytes], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      setGifPreview(url);
    } catch (e) {
      setGifError(`Error: ${(e as Error).message}`);
    } finally {
      setGifBusy(false);
    }
  };

  const downloadGif = () => {
    const a = document.createElement('a');
    a.href = gifPreview;
    a.download = 'animated.gif';
    a.click();
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'waveform', label: '〰 Waveform' },
    { id: 'fileinfo', label: 'ℹ️ File Info' },
    { id: 'gif', label: '🎞 GIF Frames' },
  ];

  return (
    <div className="audio-tool">
      <div className="pdf-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`pdf-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Waveform ── */}
      {tab === 'waveform' && (
        <div className="pdf-panel">
          {!waveFile ? (
            <div
              ref={waveDropRef}
              className="tool-dropzone tool-dropzone-sm"
              onClick={() => waveInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onWaveDrop}
            >
              <input
                ref={waveInputRef}
                type="file"
                accept="audio/*"
                className="tool-file-input-hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setWaveFile(f); setWaveDrawn(false); drawWaveform(f); } }}
              />
              <div className="tool-dropzone-icon">🔊</div>
              <p className="tool-dropzone-text">Drop an audio file (MP3/WAV/OGG)</p>
            </div>
          ) : (
            <div className="pdf-file-item pdf-selected-file">
              <span className="pdf-file-name">🔊 {waveFile.name}</span>
              <span className="pdf-file-size">{formatBytes(waveFile.size)}</span>
              <button className="pdf-file-remove" onClick={() => { setWaveFile(null); setWaveDrawn(false); setWaveError(''); }}>✕</button>
            </div>
          )}

          {waveBusy && <p className="pdf-loading">⏳ Decoding audio…</p>}
          {waveError && <p className="pdf-error">{waveError}</p>}

          <canvas
            ref={waveCanvas}
            className="audio-waveform-canvas"
            style={{ display: waveDrawn ? 'block' : 'none' }}
          />
        </div>
      )}

      {/* ── File Info ── */}
      {tab === 'fileinfo' && (
        <div className="pdf-panel">
          {!infoFile ? (
            <div
              ref={infoDropRef}
              className="tool-dropzone tool-dropzone-sm"
              onClick={() => infoInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onInfoDrop}
            >
              <input
                ref={infoInputRef}
                type="file"
                accept="audio/*"
                className="tool-file-input-hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setInfoFile(f); setAudioInfo(null); loadAudioInfo(f); } }}
              />
              <div className="tool-dropzone-icon">🎵</div>
              <p className="tool-dropzone-text">Drop an audio file to inspect</p>
            </div>
          ) : (
            <div className="pdf-file-item pdf-selected-file">
              <span className="pdf-file-name">🎵 {infoFile.name}</span>
              <span className="pdf-file-size">{formatBytes(infoFile.size)}</span>
              <button className="pdf-file-remove" onClick={() => { setInfoFile(null); setAudioInfo(null); setInfoError(''); }}>✕</button>
            </div>
          )}

          {infoBusy && <p className="pdf-loading">🔍 Analyzing audio…</p>}
          {infoError && <p className="pdf-error">{infoError}</p>}

          {audioInfo && (
            <table className="pdf-info-table">
              <tbody>
                <tr><th>Format</th><td>{audioInfo.format}</td></tr>
                <tr><th>Duration</th><td>{audioInfo.duration}</td></tr>
                <tr><th>Sample rate</th><td>{audioInfo.sampleRate}</td></tr>
                <tr><th>Channels</th><td>{audioInfo.channels}</td></tr>
                <tr><th>File size</th><td>{audioInfo.fileSize}</td></tr>
                <tr><th>Est. bitrate</th><td>{audioInfo.bitrate}</td></tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── GIF Frames ── */}
      {tab === 'gif' && (
        <div className="pdf-panel">
          <div
            ref={gifDropRef}
            className="tool-dropzone tool-dropzone-sm"
            onClick={() => gifInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={onGifDrop}
          >
            <input
              ref={gifInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="tool-file-input-hidden"
              onChange={e => e.target.files && addGifFiles(e.target.files)}
            />
            <div className="tool-dropzone-icon">🖼</div>
            <p className="tool-dropzone-text">Drop PNG/JPG frames here</p>
            <p className="tool-dropzone-sub">Order determines animation sequence</p>
          </div>

          {gifFiles.length > 0 && (
            <ul className="pdf-file-list">
              {gifFiles.map((f, i) => (
                <li key={i} className="pdf-file-item">
                  <span className="pdf-file-name">🖼 {f.name}</span>
                  <span className="pdf-file-size">{formatBytes(f.size)}</span>
                  <button
                    className="pdf-file-remove"
                    onClick={() => setGifFiles(prev => prev.filter((_, j) => j !== i))}
                    title="Remove"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}

          <div className="pdf-range-row" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="pdf-label" style={{ margin: 0 }}>Frame delay (ms):</label>
              <input
                type="number"
                className="tool-input"
                style={{ width: '90px' }}
                value={gifDelay}
                min={10}
                max={5000}
                onChange={e => setGifDelay(Number(e.target.value))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="pdf-label" style={{ margin: 0 }}>Width (px):</label>
              <input
                type="number"
                className="tool-input"
                style={{ width: '90px' }}
                value={gifWidth}
                min={32}
                max={1200}
                onChange={e => setGifWidth(Number(e.target.value))}
              />
            </div>
          </div>

          {gifError && <p className="pdf-error">{gifError}</p>}

          <div className="pdf-actions">
            <button
              className="btn-primary"
              onClick={buildGif}
              disabled={gifBusy || gifFiles.length < 1}
            >
              {gifBusy ? '⏳ Building GIF…' : '🎞 Build GIF'}
            </button>
            {gifFiles.length > 0 && (
              <button className="btn-ghost" onClick={() => { setGifFiles([]); setGifPreview(''); }}>Clear All</button>
            )}
          </div>

          {gifPreview && (
            <div className="audio-gif-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gifPreview} alt="Animated GIF preview" className="audio-gif-img" />
              <button className="btn-primary" onClick={downloadGif} style={{ marginTop: '0.75rem' }}>⬇ Download GIF</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
