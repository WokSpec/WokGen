'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  imageUrl: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function ColorPalette({ imageUrl }: Props) {
  const [colors, setColors] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const extractedFor = useRef<string>('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const extractColors = useCallback(async () => {
    if (extractedFor.current === imageUrl) return;
    extractedFor.current = imageUrl;
    setStatus('loading');
    try {
      // Dynamic import to avoid SSR issues
      const ColorThief = (await import('color-thief-browser')).default;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('CORS or load error'));
        img.src = imageUrl;
      });
      const thief = new ColorThief();
      const palette: [number, number, number][] = thief.getPalette(img, 6);
      setColors(palette.map(([r, g, b]) => rgbToHex(r, g, b)));
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }, [imageUrl]);

  // IntersectionObserver — extract only when visible
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          extractColors();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [extractColors]);

  // Reset when imageUrl changes
  useEffect(() => {
    setColors([]);
    setStatus('idle');
    extractedFor.current = '';
  }, [imageUrl]);

  const copyColor = (hex: string, idx: number) => {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopiedIdx(idx);
    showToast(`Copied ${hex}`);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyCSSVars = () => {
    const css = colors.map((c, i) => `--color-${i + 1}: ${c};`).join('\n');
    navigator.clipboard.writeText(css).catch(() => {});
    showToast('CSS variables copied');
  };

  const copyTailwind = () => {
    const names = ['primary', 'secondary', 'accent', 'neutral', 'muted', 'highlight'];
    const obj = `{\n${colors.map((c, i) => `  ${names[i] ?? `color${i + 1}`}: '${c}'`).join(',\n')}\n}`;
    navigator.clipboard.writeText(obj).catch(() => {});
    showToast('Tailwind config copied');
  };

  return (
    <div
      ref={containerRef}
      style={{
        padding: '8px 12px',
        background: 'var(--surface-overlay, #1a1a2e)',
        borderTop: '1px solid var(--surface-border, #2a2a3e)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        position: 'relative',
        minHeight: 36,
      }}
    >
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute',
          top: -32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--surface-raised, #252540)',
          border: '1px solid var(--surface-border, #2a2a3e)',
          borderRadius: 4,
          padding: '3px 10px',
          fontSize: '0.72rem',
          color: 'var(--text-primary, #e2e8f0)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {toast}
        </div>
      )}

      <span style={{ fontSize: '0.68rem', color: 'var(--text-disabled, #666)', flexShrink: 0 }}>
      </span>

      {status === 'loading' && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #888)' }}>Extracting palette…</span>
      )}

      {status === 'error' && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #888)' }}>Palette unavailable</span>
      )}

      {status === 'done' && colors.length > 0 && (
        <>
          {/* Color swatches */}
          {colors.map((hex, i) => (
            <button
              key={i}
              title={`${hex} — click to copy`}
              onClick={() => copyColor(hex, i)}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: hex,
                border: copiedIdx === i
                  ? '2px solid var(--accent, #a78bfa)'
                  : '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'transform 0.1s',
                transform: copiedIdx === i ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 16, background: 'var(--surface-border, #2a2a3e)', flexShrink: 0 }} />

          {/* Copy buttons */}
          <button
            onClick={copyCSSVars}
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted, #888)',
              background: 'transparent',
              border: '1px solid var(--surface-border, #2a2a3e)',
              borderRadius: 3,
              padding: '1px 6px',
              cursor: 'pointer',
            }}
          >
            CSS vars
          </button>
          <button
            onClick={copyTailwind}
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted, #888)',
              background: 'transparent',
              border: '1px solid var(--surface-border, #2a2a3e)',
              borderRadius: 3,
              padding: '1px 6px',
              cursor: 'pointer',
            }}
          >
            Tailwind
          </button>
        </>
      )}
    </div>
  );
}
