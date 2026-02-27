export default function AutomationsLoading() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ height: '28px', width: '180px', borderRadius: '6px', background: 'var(--surface-raised)', marginBottom: '1.5rem', animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array(4).fill(0).map((_, i) => (
          <div key={i} style={{ height: '72px', borderRadius: '8px', background: 'var(--surface-raised)', animation: 'pulse 1.5s ease infinite' }} />
        ))}
      </div>
    </div>
  );
}
