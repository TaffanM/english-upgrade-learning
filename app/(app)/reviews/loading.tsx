import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 md:w-80 rounded-2xl" />
        <Skeleton className="h-4 w-full max-w-lg rounded-lg" />
      </div>

      {/* 6 Review Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-xs"
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <Skeleton className="h-6 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />

            <div className="pt-3 border-t border-border/60">
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
