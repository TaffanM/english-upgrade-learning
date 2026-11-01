import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-up">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 md:w-80 rounded-2xl" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border/80 rounded-2xl p-4.5 space-y-3 shadow-2xs">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Score Trajectory Chart Card */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>

      {/* B2 Criteria Card */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-3">
        <Skeleton className="h-6 w-56 rounded-lg" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
