export default function EralLoading() {
  return (
    <div className="page-loading-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '80vh' }}>
      <div className="page-loading-skeleton" style={{ height: '48px' }} />
      <div className="page-loading-skeleton" style={{ flex: 1 }} />
      <div className="page-loading-skeleton" style={{ height: '60px' }} />
    </div>
  );
}
