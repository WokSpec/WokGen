export default function Loading() {
  return (
    <div className="loading-skeleton" aria-hidden="true">
      <div className="loading-skeleton__logo">WG</div>
      <div className="loading-skeleton__blocks">
        <div className="loading-skeleton__block loading-shimmer" />
        <div className="loading-skeleton__block loading-shimmer" />
        <div className="loading-skeleton__block loading-shimmer" />
      </div>
    </div>
  );
}
