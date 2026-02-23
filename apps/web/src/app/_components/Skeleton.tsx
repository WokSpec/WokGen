'use client';

/**
 * WokGen Skeleton — universal loading skeleton components.
 *
 * Usage:
 *   <SkeletonCard />        — gallery asset card
 *   <SkeletonList n={5} />  — list of text rows
 *   <SkeletonText />        — single text line
 *   <SkeletonBlock />       — arbitrary rectangular block
 */

interface SkeletonBlockProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
}

export function SkeletonBlock({ width = '100%', height = '1rem', className = '', rounded = true }: SkeletonBlockProps) {
  return (
    <div
      className={`skeleton-block${rounded ? ' skeleton-block--rounded' : ''} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ width = '80%' }: { width?: string }) {
  return <SkeletonBlock width={width} height="0.875rem" />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <SkeletonBlock height="180px" rounded={false} />
      <div className="skeleton-card-body">
        <SkeletonText width="65%" />
        <SkeletonText width="40%" />
        <div className="skeleton-card-meta">
          <SkeletonBlock width="48px" height="18px" />
          <SkeletonBlock width="36px" height="18px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGalleryGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="skeleton-gallery-grid" aria-busy="true" aria-label="Loading gallery">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ n = 4, gap = '12px' }: { n?: number; gap?: string }) {
  return (
    <div className="skeleton-list" style={{ gap }} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <SkeletonBlock width="32px" height="32px" className="skeleton-list-icon" />
          <div className="skeleton-list-text">
            <SkeletonText width={`${55 + (i % 3) * 15}%`} />
            <SkeletonText width={`${30 + (i % 4) * 10}%`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="skeleton-page" aria-busy="true">
      <SkeletonBlock width="260px" height="32px" className="skeleton-page-title" />
      <SkeletonBlock width="400px" height="16px" className="skeleton-page-sub" />
      <SkeletonGalleryGrid count={8} />
    </div>
  );
}
