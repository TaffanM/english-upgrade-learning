import { LoadingScreen } from "@/components/ui/loading-screen";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <LoadingScreen
        title="Opening 41-Day English Upgrade"
        message="Preparing your personal productive fluency workspace..."
      />
    </div>
  );
}
