export default function GalleryLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-28 rounded-lg bg-white/[0.05]" />
        <div className="flex gap-3">
          <div className="h-9 w-48 rounded-xl bg-white/[0.04] border border-white/5" />
          <div className="h-9 w-28 rounded-xl bg-white/[0.04] border border-white/5" />
        </div>
      </div>
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
        {Array(15).fill(0).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid rounded-xl bg-white/[0.04] border border-white/5"
            style={{ height: `${[160, 200, 240, 180, 220][i % 5]}px` }}
          />
        ))}
      </div>
    </div>
  );
}
