export default function DashboardLoading() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: '120px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' }} />
      ))}
    </div>
  );
}
