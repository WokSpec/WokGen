export default function Loading() {
  return (
    <div className="loading-skeleton" aria-hidden="true">
      <div className="loading-skeleton__logo">WG</div>
      <div className="loading-skeleton__blocks">
        <div className="loading-skeleton__block loading-shimmer" style={{ width: '80%' }} />
        <div className="loading-skeleton__block loading-shimmer" style={{ width: '60%' }} />
        <div className="loading-skeleton__block loading-shimmer" style={{ width: '70%', height: '80px' }} />
      </div>
    </div>
  );
}
