"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="py-12 flex justify-center items-center">
      <ErrorFallback
        title="Challenge Content Stumbled"
        description="We had trouble communicating with the database or loading your challenge progress. Click below to retry."
        error={error}
        onRetry={reset}
        showHomeLink={true}
      />
    </div>
  );
}
