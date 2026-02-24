export default function ToolsLoading() {
  return (
    <div className="tool-page-root" style={{ animation: 'pulse 1.5s ease infinite' }}>
      <div className="tool-page-header">
        <div style={{ height: '1.75rem', width: '200px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.5rem' }} />
        <div style={{ height: '1rem', width: '320px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div className="tool-section">
        <div style={{ height: '2.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}
