export default function AutomationsLoading() {
  return (
    <div className="page-loading-wrap" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-loading-skeleton" style={{ height: '28px', width: '180px', marginBottom: '1.5rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="page-loading-skeleton" style={{ height: '72px', borderRadius: '8px' }} />
        ))}
      </div>
    </div>
  );
}
