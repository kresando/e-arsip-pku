export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted/60 rounded-xl" />
        <div className="h-4 w-72 bg-muted/40 rounded-lg" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border/40 bg-card/60 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-muted/50 rounded" />
              <div className="h-8 w-8 rounded-xl bg-muted/60" />
            </div>
            <div className="h-7 w-16 bg-muted/70 rounded-lg" />
            <div className="h-3 w-32 bg-muted/40 rounded" />
          </div>
        ))}
      </div>

      {/* Main content table / chart skeleton */}
      <div className="p-6 rounded-2xl border border-border/40 bg-card/60 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border/30">
          <div className="h-4 w-36 bg-muted/60 rounded" />
          <div className="h-8 w-24 bg-muted/40 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between gap-4 py-2 border-b border-border/20">
              <div className="h-4 w-28 bg-muted/50 rounded" />
              <div className="h-4 w-36 bg-muted/40 rounded" />
              <div className="h-4 w-24 bg-muted/40 rounded" />
              <div className="h-6 w-16 bg-muted/50 rounded-full" />
              <div className="h-6 w-16 bg-muted/40 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
