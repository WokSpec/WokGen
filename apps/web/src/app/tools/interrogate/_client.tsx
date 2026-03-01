'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';

interface InterrogateResult {
  caption: string;
  tags: string[];
  suggestedPrompt: string;
  confidence: number;
}

export function InterrogateClient() {
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterrogateResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
      setImageUrl(dataUrl);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleInterrogate = useCallback(async () => {
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/tools/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }
      const data = await response.json() as InterrogateResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Interrogation failed');
    } finally {
      setLoading(false);
    }
  }, [imageUrl]);

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  return (
    <div className="tool-interrogate">
      <div className="tool-page__inner">
        <div className="tool-page__header">
          <h1 className="tool-page__title">Image Interrogator</h1>
          <p className="tool-page__subtitle">Reverse-engineer prompts from any image</p>
        </div>

        <div className="tool-page__card">
          <label className="tool-page__label">Image URL</label>
          <input
            className="tool-page__input"
            type="url"
            placeholder="https://example.com/image.png"
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={(e) => { setImageUrl(e.target.value); setPreviewUrl(e.target.value || null); setResult(null); }}
          />

          <div className="tool-page__divider">— or drop an image —</div>

          <div
            className={`tool-upscale__dropzone${dragging ? ' tool-upscale__dropzone--drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            aria-label="Drop image or click to upload"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="tool-upscale__preview" />
            ) : (
              <span className="tool-upscale__dropzone-text">Click or drag & drop image here</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {error && <div className="tool-page__error">{error}</div>}

          <button
            className="tool-page__btn-primary"
            onClick={handleInterrogate}
            disabled={loading || !imageUrl.trim()}
            type="button"
            style={{ marginTop: 16 }}
          >
            {loading ? <><span className="tool-page__spinner" />Analyzing image…</> : 'Interrogate Image'}
          </button>
        </div>

        {result && (
          <div className="tool-interrogate__result">
            {/* Caption */}
            <div className="tool-page__card">
              <div className="tool-page__result-header">
                <span className="tool-page__result-title">Caption</span>
                <span className="tool-page__confidence-badge">{Math.round(result.confidence * 100)}% confidence</span>
              </div>
              <p className="tool-page__result-text">{result.caption}</p>
              <button
                className="tool-page__copy-btn"
                onClick={() => copyText(result.caption, 'caption')}
                type="button"
              >
                {copied === 'caption' ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Tags */}
            <div className="tool-page__card">
              <div className="tool-page__result-title" style={{ marginBottom: 12 }}>Tags</div>
              <div className="tool-interrogate__tags">
                {result.tags.map((tag) => (
                  <button
                    key={tag}
                    className="tool-interrogate__tag"
                    onClick={() => copyText(tag, `tag-${tag}`)}
                    type="button"
                    title="Click to copy"
                  >
                    {copied === `tag-${tag}` ? '✓' : tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Prompt */}
            <div className="tool-page__card">
              <div className="tool-page__result-header">
                <span className="tool-page__result-title">Suggested Prompt</span>
                <div className="tool-page__result-actions">
                  <button
                    className="tool-page__copy-btn"
                    onClick={() => copyText(result.suggestedPrompt, 'suggested')}
                    type="button"
                  >
                    {copied === 'suggested' ? '✓ Copied' : 'Copy'}
                  </button>
                  <Link href="/pixel/studio" className="tool-page__use-btn">
                    Use in Pixel Studio →
                  </Link>
                </div>
              </div>
              <p className="tool-page__result-text">{result.suggestedPrompt}</p>
            </div>

            <p className="tool-page__note">Powered by BLIP (Salesforce) via HuggingFace</p>
          </div>
        )}
      </div>
    </div>
  );
}
