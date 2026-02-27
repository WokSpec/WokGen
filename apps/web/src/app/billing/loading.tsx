export default function BillingLoading() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ height: '28px', width: '160px', borderRadius: '6px', background: 'var(--surface-raised)', marginBottom: '1.5rem', animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {Array(3).fill(0).map((_, i) => (
          <div key={i} style={{ height: '220px', borderRadius: '10px', background: 'var(--surface-raised)', animation: 'pulse 1.5s ease infinite' }} />
        ))}
      </div>
    </div>
  );
}
