export default function LibraryLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-24 rounded-lg bg-white/[0.05]" />
        <div className="h-8 w-48 rounded-xl bg-white/[0.04] border border-white/5" />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {Array(21).fill(0).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-white/[0.04] border border-white/5" />
        ))}
      </div>
    </div>
  );
}
