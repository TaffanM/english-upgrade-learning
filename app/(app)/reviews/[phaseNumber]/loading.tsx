import { Skeleton } from "@/components/ui/skeleton";

export default function WeeklyReviewDetailLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-up">
      {/* Back button */}
      <Skeleton className="h-8 w-44 rounded-xl" />

      {/* Review Card Form */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-8 w-3/4 rounded-2xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
        </div>

        {/* 5 Rating Scales Skeleton */}
        <div className="space-y-4 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-muted/40 space-y-2.5 border border-border/60">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <Skeleton key={r} className="h-10 flex-1 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reflection Box */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>

        <div className="pt-3 border-t border-border/60 flex justify-end">
          <Skeleton className="h-11 w-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
