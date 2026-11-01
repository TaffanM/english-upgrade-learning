import { Skeleton } from "@/components/ui/skeleton";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function AppLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 animate-fade-up">
      <LoadingScreen compact message="Connecting with your practice records..." />

      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
