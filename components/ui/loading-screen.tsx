import { Logo } from "./logo";

interface LoadingScreenProps {
  title?: string;
  message?: string;
  compact?: boolean;
}

export function LoadingScreen({
  title = "Warming up your English studio",
  message = "Fetching your curriculum, audio tracks, and daily progress...",
  compact = false,
}: LoadingScreenProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-up">
        <div className="mb-2">
          <Logo className="h-8 w-auto text-foreground animate-breathe" />
        </div>
        <p className="text-xs font-semibold text-foreground/80">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-up">
      <div className="mb-5 flex justify-center">
        <Logo className="h-16 sm:h-20 w-auto text-foreground animate-breathe" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mt-1 leading-relaxed">
        {message}
      </p>

      {/* Shimmering Progress Bar Indicator */}
      <div className="w-36 h-1.5 bg-muted rounded-full overflow-hidden mt-4">
        <div className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-full animate-pulse w-full" />
      </div>
    </div>
  );
}
