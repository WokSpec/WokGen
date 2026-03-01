export default function Loading() {
  return (
    <div className="page-loading">
      <div className="page-loading__spinner" aria-hidden="true" />
      <span className="page-loading__text">Loading…</span>
    </div>
  );
}
