import { Skeleton } from "@/components/ui/skeleton";

export default function SpeakingStudioLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      {/* Speaking Prompt Card */}
      <div className="bg-card border-2 border-blue-500/30 rounded-3xl p-6 space-y-3 shadow-xs">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded" />
      </div>

      {/* Voice Recorder Console Skeleton */}
      <div className="bg-card border border-border/80 rounded-3xl p-8 space-y-6 text-center shadow-xs flex flex-col items-center">
        <Skeleton className="h-5 w-44 rounded-lg" />

        {/* Circular Record Button Shimmer */}
        <div className="size-24 rounded-full bg-muted/60 flex items-center justify-center animate-pulse">
          <div className="size-16 rounded-full bg-muted" />
        </div>

        <Skeleton className="h-4 w-52 rounded" />

        <div className="w-full max-w-md h-12 bg-muted/40 rounded-2xl border border-border/60" />

        <div className="flex gap-3 w-full max-w-md">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
