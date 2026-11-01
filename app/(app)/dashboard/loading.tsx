import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-up max-w-6xl mx-auto">
      {/* Top Banner Skeleton */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-6 w-52 rounded-full" />
          <Skeleton className="h-9 w-64 md:w-80 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <div className="bg-secondary/50 p-4 rounded-2xl border border-border/60 w-full md:w-64 space-y-2.5">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      </div>

      {/* Target Mission Card Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>

        <div className="border-2 border-primary/20 bg-card rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-32 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
          </div>

          {/* Dual Companion Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl p-4.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>

            <div className="rounded-2xl p-4.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-border/60">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Routine Badges Skeleton */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-card rounded-2xl border border-border/80 flex items-center gap-3">
            <Skeleton className="size-10 rounded-2xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
