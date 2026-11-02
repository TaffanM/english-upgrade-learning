import * as React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  containerClassName?: string;
}

export function Footer({ className, containerClassName, ...props }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border/80 py-6 md:py-8 px-4 text-center text-xs text-muted-foreground bg-card/80 backdrop-blur-xs transition-colors",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4",
          containerClassName
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 group pressable text-muted-foreground hover:text-foreground transition-colors"
        >
          <Logo className="h-5 w-auto text-foreground/80 group-hover:text-primary transition-colors" />
          <span className="font-semibold text-foreground">41-Day English Upgrade</span>
          <span>•</span>
          <span>Daily English Studio</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground/80">Crafted by Taffan M</span>
          <span>•</span>
          <a
            href="https://github.com/TaffanM"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors pressable py-1 px-2.5 rounded-full hover:bg-secondary/60"
            aria-label="GitHub profile of Taffan M"
          >
            <svg
              className="size-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span className="font-medium">GitHub • @TaffanM</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
