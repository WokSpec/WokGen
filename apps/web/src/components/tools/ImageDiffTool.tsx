'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export default function ImageDiffTool() {
  const [img1, setImg1] = useState<string | null>(null);
  const [img2, setImg2] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImg = (idx: 1 | 2, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    if (idx === 1) setImg1(url);
    else setImg2(url);
  };

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging) updateSlider(e.clientX); };
    const onTouch = (e: TouchEvent) => { if (dragging) updateSlider(e.touches[0].clientX); };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouch as EventListener);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, updateSlider]);

  const reset = () => { setImg1(null); setImg2(null); setSliderPos(50); };

  return (
    <div className="tool-panel">
      {!(img1 && img2) && (
        <div className="imgdiff-upload-grid">
          {([1, 2] as const).map(idx => {
            const img = idx === 1 ? img1 : img2;
            return (
              <div
                key={idx}
                className="tool-dropzone"
                style={{ cursor: 'pointer', minHeight: 120 }}
                onClick={() => document.getElementById(`imgdiff-input-${idx}`)?.click()}
                onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleImg(idx, e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
              >
                <input id={`imgdiff-input-${idx}`} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleImg(idx, e.target.files[0])} />
                {img ? (
                  <img src={img} alt={`Image ${idx}`} style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }} />
                ) : (
                  <>
                    <div className="tool-dropzone-icon">{idx === 1 ? 'A' : 'B'}</div>
                    <p className="tool-dropzone-text">Image {idx === 1 ? 'A' : 'B'}</p>
                    <p className="tool-dropzone-sub">Drop or click to upload</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {img1 && img2 && (
        <>
          <div
            ref={containerRef}
            className="imgdiff-container"
            onMouseDown={() => setDragging(true)}
            onTouchStart={() => setDragging(true)}
          >
            {/* Base image B (right side) */}
            <img src={img1} alt="Image A" className="imgdiff-base" draggable={false} />

            {/* Overlay image A (left side, clipped) */}
            <div
              className="imgdiff-clip"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img src={img2} alt="Image B" className="imgdiff-base" draggable={false} />
            </div>

            {/* Divider line */}
            <div className="imgdiff-divider" style={{ left: `${sliderPos}%` }}>
              <div className="imgdiff-handle">||</div>
            </div>

            {/* Labels */}
            <span className="imgdiff-label imgdiff-label-left">A</span>
            <span className="imgdiff-label imgdiff-label-right">B</span>
          </div>

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type="range" min={0} max={100} value={sliderPos} onChange={e => setSliderPos(Number(e.target.value))} style={{ flex: 1 }} />
            <button className="btn-ghost" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={reset}>Reset</button>
          </div>
        </>
      )}
    </div>
  );
}
