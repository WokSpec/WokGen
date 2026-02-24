'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';

type Tab = 'merge' | 'extract' | 'info';

interface PdfInfo {
  pageCount: number;
  title: string;
  author: string;
  fileSize: string;
  created: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function parsePageRange(range: string, total: number): number[] {
  const pages: number[] = [];
  const parts = range.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = a; i <= Math.min(b, total); i++) {
          if (i >= 1) pages.push(i);
        }
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) pages.push(n);
    }
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PdfTool() {
  const [tab, setTab] = useState<Tab>('merge');

  /* ── Merge state ── */
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const mergeDrop = useRef<HTMLDivElement>(null);
  const mergeInput = useRef<HTMLInputElement>(null);

  /* ── Extract state ── */
  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [extractRange, setExtractRange] = useState('');
  const [extractBusy, setExtractBusy] = useState(false);
  const [extractError, setExtractError] = useState('');
  const extractDrop = useRef<HTMLDivElement>(null);
  const extractInput = useRef<HTMLInputElement>(null);

  /* ── Info state ── */
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [infoData, setInfoData] = useState<PdfInfo | null>(null);
  const [infoBusy, setInfoBusy] = useState(false);
  const [infoError, setInfoError] = useState('');
  const infoDrop = useRef<HTMLDivElement>(null);
  const infoInput = useRef<HTMLInputElement>(null);

  /* ── Merge handlers ── */
  const addMergeFiles = useCallback((files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setMergeFiles(prev => [...prev, ...pdfs]);
    setMergeError('');
  }, []);

  const onMergeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addMergeFiles(e.dataTransfer.files);
  }, [addMergeFiles]);

  const doMerge = async () => {
    if (mergeFiles.length < 2) { setMergeError('Add at least 2 PDF files.'); return; }
    setMergeBusy(true); setMergeError('');
    try {
      const merged = await PDFDocument.create();
      for (const file of mergeFiles) {
        const buf = await readFile(file);
        const doc = await PDFDocument.load(buf);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadBytes(bytes, 'merged.pdf');
    } catch (e) {
      setMergeError(`Error: ${(e as Error).message}`);
    } finally {
      setMergeBusy(false);
    }
  };

  /* ── Extract handlers ── */
  const onExtractDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setExtractFile(file); setExtractError(''); }
  }, []);

  const doExtract = async () => {
    if (!extractFile) { setExtractError('Drop a PDF first.'); return; }
    if (!extractRange.trim()) { setExtractError('Enter a page range.'); return; }
    setExtractBusy(true); setExtractError('');
    try {
      const buf = await readFile(extractFile);
      const doc = await PDFDocument.load(buf);
      const total = doc.getPageCount();
      const pages = parsePageRange(extractRange, total);
      if (pages.length === 0) { setExtractError('No valid pages in range.'); setExtractBusy(false); return; }
      const out = await PDFDocument.create();
      const copied = await out.copyPages(doc, pages.map(p => p - 1));
      copied.forEach(p => out.addPage(p));
      const bytes = await out.save();
      downloadBytes(bytes, `extracted-pages.pdf`);
    } catch (e) {
      setExtractError(`Error: ${(e as Error).message}`);
    } finally {
      setExtractBusy(false);
    }
  };

  /* ── Info handlers ── */
  const onInfoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setInfoFile(file); setInfoData(null); setInfoError(''); loadInfo(file); }
  }, []);

  const loadInfo = async (file: File) => {
    setInfoBusy(true); setInfoError('');
    try {
      const buf = await readFile(file);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const created = doc.getCreationDate();
      setInfoData({
        pageCount: doc.getPageCount(),
        title: doc.getTitle() || '—',
        author: doc.getAuthor() || '—',
        fileSize: formatBytes(file.size),
        created: created ? created.toLocaleDateString() : '—',
      });
    } catch (e) {
      setInfoError(`Error: ${(e as Error).message}`);
    } finally {
      setInfoBusy(false);
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'merge', label: '📎 Merge' },
    { id: 'extract', label: '✂️ Extract Pages' },
    { id: 'info', label: 'ℹ️ Info' },
  ];

  return (
    <div className="pdf-tool">
      {/* Tabs */}
      <div className="pdf-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`pdf-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Merge ── */}
      {tab === 'merge' && (
        <div className="pdf-panel">
          <div
            ref={mergeDrop}
            className="tool-dropzone tool-dropzone-sm"
            onClick={() => mergeInput.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={onMergeDrop}
          >
            <input
              ref={mergeInput}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="tool-file-input-hidden"
              onChange={e => e.target.files && addMergeFiles(e.target.files)}
            />
            <div className="tool-dropzone-icon">📄</div>
            <p className="tool-dropzone-text">Drop PDFs here or click to browse</p>
            <p className="tool-dropzone-sub">Select multiple files</p>
          </div>

          {mergeFiles.length > 0 && (
            <ul className="pdf-file-list">
              {mergeFiles.map((f, i) => (
                <li key={i} className="pdf-file-item">
                  <span className="pdf-file-name">📄 {f.name}</span>
                  <span className="pdf-file-size">{formatBytes(f.size)}</span>
                  <button
                    className="pdf-file-remove"
                    onClick={() => setMergeFiles(prev => prev.filter((_, j) => j !== i))}
                    title="Remove"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}

          {mergeError && <p className="pdf-error">{mergeError}</p>}

          <div className="pdf-actions">
            <button
              className="btn-primary"
              onClick={doMerge}
              disabled={mergeBusy || mergeFiles.length < 2}
            >
              {mergeBusy ? '⏳ Merging…' : '⬇ Merge & Download'}
            </button>
            {mergeFiles.length > 0 && (
              <button className="btn-ghost" onClick={() => setMergeFiles([])}>Clear All</button>
            )}
          </div>
        </div>
      )}

      {/* ── Extract ── */}
      {tab === 'extract' && (
        <div className="pdf-panel">
          {!extractFile ? (
            <div
              ref={extractDrop}
              className="tool-dropzone tool-dropzone-sm"
              onClick={() => extractInput.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onExtractDrop}
            >
              <input
                ref={extractInput}
                type="file"
                accept=".pdf,application/pdf"
                className="tool-file-input-hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setExtractFile(f); setExtractError(''); } }}
              />
              <div className="tool-dropzone-icon">✂️</div>
              <p className="tool-dropzone-text">Drop a PDF here</p>
            </div>
          ) : (
            <div className="pdf-file-item pdf-selected-file">
              <span className="pdf-file-name">📄 {extractFile.name}</span>
              <span className="pdf-file-size">{formatBytes(extractFile.size)}</span>
              <button className="pdf-file-remove" onClick={() => { setExtractFile(null); setExtractError(''); }}>✕</button>
            </div>
          )}

          <div className="pdf-range-row">
            <label className="pdf-label">Page range:</label>
            <input
              className="tool-input"
              placeholder='e.g. 1-3, 5, 7-9'
              value={extractRange}
              onChange={e => setExtractRange(e.target.value)}
            />
          </div>

          {extractError && <p className="pdf-error">{extractError}</p>}

          <div className="pdf-actions">
            <button
              className="btn-primary"
              onClick={doExtract}
              disabled={extractBusy || !extractFile}
            >
              {extractBusy ? '⏳ Extracting…' : '⬇ Extract & Download'}
            </button>
          </div>
        </div>
      )}

      {/* ── Info ── */}
      {tab === 'info' && (
        <div className="pdf-panel">
          {!infoFile ? (
            <div
              ref={infoDrop}
              className="tool-dropzone tool-dropzone-sm"
              onClick={() => infoInput.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onInfoDrop}
            >
              <input
                ref={infoInput}
                type="file"
                accept=".pdf,application/pdf"
                className="tool-file-input-hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setInfoFile(f); setInfoData(null); setInfoError(''); loadInfo(f); } }}
              />
              <div className="tool-dropzone-icon">ℹ️</div>
              <p className="tool-dropzone-text">Drop a PDF to inspect</p>
            </div>
          ) : (
            <div className="pdf-file-item pdf-selected-file">
              <span className="pdf-file-name">📄 {infoFile.name}</span>
              <span className="pdf-file-size">{formatBytes(infoFile.size)}</span>
              <button className="pdf-file-remove" onClick={() => { setInfoFile(null); setInfoData(null); setInfoError(''); }}>✕</button>
            </div>
          )}

          {infoBusy && <p className="pdf-loading">🔍 Reading PDF…</p>}
          {infoError && <p className="pdf-error">{infoError}</p>}

          {infoData && (
            <table className="pdf-info-table">
              <tbody>
                <tr><th>Pages</th><td>{infoData.pageCount}</td></tr>
                <tr><th>Title</th><td>{infoData.title}</td></tr>
                <tr><th>Author</th><td>{infoData.author}</td></tr>
                <tr><th>File size</th><td>{infoData.fileSize}</td></tr>
                <tr><th>Created</th><td>{infoData.created}</td></tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
