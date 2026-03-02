export default function ProfileLoading() {
  return (
    <div className="page-loading-wrap">
      {/* Header skeleton */}
      <div className="profile-loading-header">
        <div className="page-loading-skeleton profile-loading-avatar" />
        <div className="profile-loading-info">
          <div className="page-loading-skeleton profile-loading-name" />
          <div className="page-loading-skeleton profile-loading-email" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="page-loading-grid profile-loading-stats">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="page-loading-skeleton profile-loading-stat-card" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>

      {/* Recent generations grid skeleton */}
      <div className="page-loading-grid profile-loading-gen-grid">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="page-loading-skeleton profile-loading-gen-card" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}
