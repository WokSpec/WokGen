export default function BillingLoading() {
  return (
    <div className="page-loading-wrap" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-loading-skeleton" style={{ height: '28px', width: '160px', marginBottom: '1.5rem' }} />
      <div className="page-loading-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="page-loading-skeleton" style={{ height: '220px', borderRadius: '10px' }} />
        ))}
      </div>
    </div>
  );
}
