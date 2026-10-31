import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckSquare,
  Home,
  LogOut,
  Settings,
  TrendingUp,
} from "lucide-react";

async function HeaderUserActions() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .maybeSingle();

  const learnerName = profile?.display_name || user.email?.split("@")[0] || "Learner";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/settings"
        className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border/60 text-xs transition-colors"
      >
        <span>👋</span>
        <span className="font-semibold text-foreground">{learnerName}</span>
      </Link>

      <form action={signOutAction}>
        <Button
          variant="ghost"
          size="sm"
          type="submit"
          className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
          title="Sign Out"
        >
          <LogOut className="size-3.5 mr-1" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </form>
    </div>
  );
}

function HeaderUserFallback() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-24 rounded-full bg-secondary/70 animate-pulse" />
    </div>
  );
}

function AppPageFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-3xl bg-card border border-border/60" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="h-48 rounded-2xl bg-card border border-border/60" />
        <div className="h-48 rounded-2xl bg-card border border-border/60" />
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Desktop & Tablet Top Navigation */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="size-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-2xs group-hover:rotate-6 transition-transform">
                ✨
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight tracking-tight flex items-center gap-1">
                  41 Upgrade
                  <Badge variant="cute" className="text-[9px] py-0 px-1.5 h-4 ml-1">
                    B1 → B2
                  </Badge>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Daily English Studio
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/dashboard">
                  <Home className="mr-1.5 size-4 text-primary" /> Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/challenge">
                  <Calendar className="mr-1.5 size-4 text-primary" /> 41-Day Map
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/progress">
                  <TrendingUp className="mr-1.5 size-4 text-primary" /> Analytics
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/reviews">
                  <CheckSquare className="mr-1.5 size-4 text-primary" /> Checkpoints
                </Link>
              </Button>
            </nav>
          </div>

          <Suspense fallback={<HeaderUserFallback />}>
            <HeaderUserActions />
          </Suspense>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 pb-28 md:pb-12">
        <Suspense fallback={<AppPageFallback />}>
          {children}
        </Suspense>
      </main>

      {/* Mobile Floating Bottom Dock (Hidden on desktop) */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-40">
        <nav className="bg-card/95 backdrop-blur-md border border-border/80 shadow-lg rounded-2xl px-2 py-1.5 flex justify-around items-center">
          <Link
            href="/dashboard"
            className="flex flex-col items-center py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="size-5 mb-0.5" />
            <span>Home</span>
          </Link>
          <Link
            href="/challenge"
            className="flex flex-col items-center py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Calendar className="size-5 mb-0.5" />
            <span>Map</span>
          </Link>
          <Link
            href="/progress"
            className="flex flex-col items-center py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <TrendingUp className="size-5 mb-0.5" />
            <span>Stats</span>
          </Link>
          <Link
            href="/reviews"
            className="flex flex-col items-center py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <CheckSquare className="size-5 mb-0.5" />
            <span>Reviews</span>
          </Link>
          <Link
            href="/settings"
            className="flex flex-col items-center py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Settings className="size-5 mb-0.5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
