export default function StudioLoading() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent-glow)', borderTopColor: 'var(--accent)', animation: 'spin 600ms linear infinite' }} />
    </div>
  );
}

