export default function ProjectsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-pulse space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 w-36 rounded-lg bg-white/[0.05]" />
        <div className="h-8 w-28 rounded-lg bg-white/[0.05]" />
      </div>
      <div className="h-9 w-full rounded-xl bg-white/[0.04] border border-white/5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-white/[0.04] border border-white/5" />
        ))}
      </div>
    </div>
  );
}
