import { Sparkles } from "lucide-react";

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
        <div className="size-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-lg animate-breathe mb-2 shadow-2xs">
          ✨
        </div>
        <p className="text-xs font-semibold text-foreground/80">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-up">
      {/* Cute Bouncing / Breathing Mascot Container */}
      <div className="relative mb-4">
        <div className="size-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-300/80 dark:border-amber-800 flex items-center justify-center text-3xl shadow-sm animate-breathe">
          <span className="inline-block animate-float">🌱</span>
        </div>
        <div className="absolute -top-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-xs animate-pulse">
          <Sparkles className="size-3" />
        </div>
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
