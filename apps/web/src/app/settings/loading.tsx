export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 animate-pulse space-y-8">
      <div className="h-7 w-24 rounded-lg bg-white/[0.05]" />
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-32 rounded bg-white/[0.04]" />
          <div className="h-28 rounded-xl bg-white/[0.04] border border-white/5" />
        </div>
      ))}
    </div>
  );
}
