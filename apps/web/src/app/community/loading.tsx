export default function CommunityLoading() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ height: '28px', width: '160px', borderRadius: '6px', background: 'var(--surface-raised)', animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ height: '36px', width: '200px', borderRadius: '6px', background: 'var(--surface-raised)', animation: 'pulse 1.5s ease infinite' }} />
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[80, 100, 90, 70, 110].map((w, i) => (
          <div key={i} style={{ height: '30px', width: `${w}px`, borderRadius: '6px', background: 'var(--surface-raised)', animation: 'pulse 1.5s ease infinite' }} />
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {Array(12).fill(0).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1', borderRadius: '8px', background: 'var(--surface-raised)', animation: 'pulse 1.5s ease infinite' }} />
        ))}
      </div>
    </div>
  );
}
