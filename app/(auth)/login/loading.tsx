import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 animate-scale-in">
        <div className="text-center space-y-2 flex flex-col items-center">
          <Skeleton className="h-4 w-44 rounded-md mb-2" />
          <Skeleton className="size-12 rounded-2xl mb-1" />
          <Skeleton className="h-8 w-60 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>

        <div className="bg-card border-2 border-border/80 rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
          <div className="space-y-1.5 pb-2">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-4 w-full rounded" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-4 w-56 mx-auto rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
