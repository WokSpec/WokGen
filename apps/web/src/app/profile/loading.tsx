export default function ProfileLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: 24 }}>
      {/* Header skeleton */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32,
        padding: 24, borderRadius: 12, background: 'var(--surface)',
        border: '1px solid var(--surface-border)',
      }}>
        {/* Avatar circle */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--surface-border)',
          animation: 'pulse 1.5s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Name line */}
          <div style={{
            height: 20, width: 180, borderRadius: 6,
            background: 'var(--surface-border)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          {/* Email line */}
          <div style={{
            height: 14, width: 240, borderRadius: 6,
            background: 'var(--surface-border)',
            animation: 'pulse 1.5s ease-in-out infinite 0.2s',
          }} />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: 90, borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--surface-border)',
            animation: `pulse 1.5s ease-in-out infinite ${i * 0.1}s`,
          }} />
        ))}
      </div>

      {/* Recent generations grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            aspectRatio: '1 / 1', borderRadius: 8,
            background: 'var(--surface)', border: '1px solid var(--surface-border)',
            animation: `pulse 1.5s ease-in-out infinite ${i * 0.08}s`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
