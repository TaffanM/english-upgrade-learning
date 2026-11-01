import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48 rounded-2xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="space-y-2 pb-2 border-b border-border/60">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-4 w-52 rounded" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 flex justify-end">
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
