export default function AccountLoading() {
  return (
    <div className="page-loading-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-loading-skeleton" style={{ height: '40px', width: '200px' }} />
      {[1, 2, 3].map(i => (
        <div key={i} className="page-loading-skeleton" style={{ height: '120px', borderRadius: '10px' }} />
      ))}
    </div>
  );
}
