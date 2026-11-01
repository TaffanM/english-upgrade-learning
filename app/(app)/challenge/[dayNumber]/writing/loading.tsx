import { Skeleton } from "@/components/ui/skeleton";

export default function WritingStudioLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      {/* Writing Prompt Card */}
      <div className="bg-card border-2 border-emerald-500/30 rounded-3xl p-6 space-y-3 shadow-xs">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded" />
      </div>

      {/* Writing Editor Skeleton */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex justify-between items-center pb-3 border-b border-border/60">
          <Skeleton className="h-5 w-28 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-64 w-full rounded-2xl" />

        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
