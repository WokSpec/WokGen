export default function ToolsLoading() {
  return (
    <div className="tool-page-root page-loading-wrap">
      <div className="tool-page-header">
        <div className="page-loading-skeleton" style={{ height: '1.75rem', width: '200px', marginBottom: '0.5rem' }} />
        <div className="page-loading-skeleton" style={{ height: '1rem', width: '320px', background: 'var(--surface-card)' }} />
      </div>
      <div className="tool-section">
        <div className="page-loading-skeleton" style={{ height: '2.5rem', background: 'var(--surface-hover)' }} />
      </div>
    </div>
  );
}
