"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  error?: Error | { message?: string; digest?: string } | null;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

export function ErrorFallback({
  title = "Oops! Something took a tumble",
  description = "We couldn't load this practice content from the database. Please check your connection or try again in a moment.",
  error,
  onRetry,
  showHomeLink = true,
}: ErrorFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-10 px-4 animate-scale-in">
      <Card className="p-8 text-center bg-card border-2 border-border/80 rounded-3xl shadow-sm flex flex-col items-center">
        {/* Playful & Cute Failed Visual Illustration */}
        <div className="relative mb-6">
          <div className="size-28 sm:size-32 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200/80 dark:border-amber-900/60 flex items-center justify-center shadow-xs">
            <svg
              className="size-20 sm:size-24 text-primary"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Cute Creature / Mascot Body */}
              <rect
                x="20"
                y="30"
                width="80"
                height="65"
                rx="24"
                className="fill-amber-100 dark:fill-amber-900/60 stroke-primary"
                strokeWidth="4"
              />

              {/* Antenna with Bandage */}
              <path
                d="M60 30 V16"
                className="stroke-primary"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="60"
                cy="14"
                r="6"
                className="fill-amber-400 stroke-primary"
                strokeWidth="3"
              />

              {/* Little Band-aid on Head */}
              <rect
                x="72"
                y="36"
                width="18"
                height="8"
                rx="3"
                transform="rotate(25 72 36)"
                className="fill-rose-200 stroke-rose-400"
                strokeWidth="2"
              />

              {/* Dizzy X Eyes */}
              {/* Left Eye */}
              <path
                d="M38 52 L48 62 M48 52 L38 62"
                className="stroke-primary"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Right Eye */}
              <path
                d="M72 52 L82 62 M82 52 L72 62"
                className="stroke-primary"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Blushing cheeks */}
              <circle cx="34" cy="68" r="4.5" className="fill-rose-300/80" />
              <circle cx="86" cy="68" r="4.5" className="fill-rose-300/80" />

              {/* Wobbly confused mouth */}
              <path
                d="M50 74 Q55 70 60 74 T70 74"
                className="stroke-primary"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Feet */}
              <rect
                x="35"
                y="94"
                width="14"
                height="10"
                rx="5"
                className="fill-amber-200 stroke-primary"
                strokeWidth="3"
              />
              <rect
                x="71"
                y="94"
                width="14"
                height="10"
                rx="5"
                className="fill-amber-200 stroke-primary"
                strokeWidth="3"
              />

              {/* Floating Sparkles & Droplet */}
              <path
                d="M96 26 C96 26 99 32 94 35 C89 32 96 26 96 26 Z"
                className="fill-sky-400"
              />
              <text x="14" y="24" fontSize="16" className="fill-amber-500 font-black">
                ?
              </text>
            </svg>
          </div>

          <div className="absolute -bottom-2 -right-2 bg-background border-2 border-border shadow-xs rounded-full px-2 py-0.5 text-[11px] font-bold text-muted-foreground flex items-center gap-1">
            <span>Offline / Err</span>
          </div>
        </div>

        {/* Text Details */}
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mb-2">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {description}
        </p>

        {/* Optional Error Code */}
        {error?.message && (
          <div className="w-full mb-6 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-[11px] text-destructive font-mono text-left overflow-x-auto">
            <span>{error.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
          <Button
            onClick={handleRetry}
            size="lg"
            className="rounded-xl font-bold pressable flex items-center justify-center gap-2"
          >
            <RefreshCw className="size-4" />
            <span>Try Again</span>
          </Button>

          {showHomeLink && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl pressable"
            >
              <Link href="/dashboard" className="flex items-center justify-center gap-2">
                <ArrowLeft className="size-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
