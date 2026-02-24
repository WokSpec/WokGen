'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface StudioResultProps {
  imageUrl: string;
  prompt?: string;
  provider?: string;
  durationMs?: number;
  seed?: number;
  onSave?: () => void;
}

export function StudioResult({
  imageUrl,
  prompt,
  provider,
  durationMs,
  seed,
  onSave,
}: StudioResultProps) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleDownload() {
    const ext = imageUrl.startsWith('data:image/gif') ? 'gif' : 'png';
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `wokgen-${Date.now()}.${ext}`;
    a.click();
  }

  function handleSave() {
    if (saved || !onSave) return;
    onSave();
    setSaved(true);
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encoded = encodeURIComponent(imageUrl);

  return (
    <div className="studio-result">
      {/* Image with zoom on hover */}
      <div className="studio-result__img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={prompt ?? 'Generated image'}
          className="studio-result__img"
        />
      </div>

      {/* Metadata bar */}
      {(provider || durationMs !== undefined || seed !== undefined) && (
        <div className="studio-result__meta">
          {provider && (
            <span className="studio-result__meta-chip">{provider}</span>
          )}
          {durationMs !== undefined && (
            <span className="studio-result__meta-chip">
              ⏱ {(durationMs / 1000).toFixed(1)}s
            </span>
          )}
          {seed !== undefined && (
            <span className="studio-result__meta-chip" title="Seed">
              🌱 {seed}
            </span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="studio-result__actions">
        <button
          className="studio-result__btn"
          onClick={handleDownload}
          title="Download image"
        >
          ↓ Download
        </button>
        <button
          className={`studio-result__btn${saved ? ' studio-result__btn--saved' : ''}`}
          onClick={handleSave}
          disabled={saved || !onSave}
          title="Save to gallery"
        >
          {saved ? '✓ Saved' : '💾 Save to Gallery'}
        </button>
        <Link
          href={`/tools/background-remover?image=${encoded}`}
          className="studio-result__btn"
          target="_blank"
          rel="noopener noreferrer"
          title="Remove background"
        >
          ✂️ Remove BG
        </Link>
        <Link
          href={`/tools/image-resize?image=${encoded}`}
          className="studio-result__btn"
          target="_blank"
          rel="noopener noreferrer"
          title="Resize image"
        >
          ↔️ Resize
        </Link>
        <Link
          href={`/tools/image-compress?image=${encoded}`}
          className="studio-result__btn"
          target="_blank"
          rel="noopener noreferrer"
          title="Compress image"
        >
          🗜️ Compress
        </Link>
        <button
          className="studio-result__btn"
          onClick={handleShare}
          title="Copy share URL"
        >
          {copied ? '✓ Copied!' : '🔗 Share'}
        </button>
      </div>
    </div>
  );
}
