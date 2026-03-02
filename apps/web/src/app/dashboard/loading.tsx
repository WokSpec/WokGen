export default function DashboardLoading() {
  return (
    <div className="page-loading-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="page-loading-skeleton" style={{ height: '120px', borderRadius: '10px' }} />
      ))}
    </div>
  );
}
