import { Skeleton } from "@/components/ui/skeleton";

export default function DayDetailLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
      {/* Back button & Day Switcher */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>

      {/* Main Day Header Card Skeleton */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4 rounded-2xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-4/5 rounded-lg" />
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-border/60">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-44 rounded" />
        </div>
      </div>

      {/* Dual Activity Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Speaking Card Skeleton */}
        <div className="bg-card border-l-4 border-l-blue-500 border border-border/80 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-48 rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Writing Card Skeleton */}
        <div className="bg-card border-l-4 border-l-emerald-500 border border-border/80 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-48 rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Checklist Card */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-3">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}
