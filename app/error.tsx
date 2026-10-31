"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex justify-center items-center p-4">
      <ErrorFallback
        title="Application Stumbled"
        description="Something unexpected happened while loading the 41-Day English Upgrade platform. Please try again."
        error={error}
        onRetry={reset}
        showHomeLink={false}
      />
    </div>
  );
}
