export default function CommunityLoading() {
  return (
    <div className="page-loading-wrap" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="page-loading-header">
        <div className="page-loading-skeleton" style={{ height: '28px', width: '160px' }} />
        <div className="page-loading-skeleton" style={{ height: '36px', width: '200px' }} />
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[80, 100, 90, 70, 110].map((w, i) => (
          <div key={i} className="page-loading-skeleton" style={{ height: '30px', width: `${w}px` }} />
        ))}
      </div>
      {/* Grid */}
      <div className="page-loading-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="page-loading-skeleton" style={{ aspectRatio: '1', borderRadius: '8px' }} />
        ))}
      </div>
    </div>
  );
}
