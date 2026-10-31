import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckSquare,
  Home,
  LogOut,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex flex-col min-h-screen bg-muted/20">
      {/* Desktop & Tablet Top Navigation */}
      <header className="border-b bg-background sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105">
                41
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight tracking-tight">
                  English Upgrade
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  B1 → B2 Challenge
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <Home className="mr-1.5 size-4" /> Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/challenge">
                  <Calendar className="mr-1.5 size-4" /> Challenge Map
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/progress">
                  <TrendingUp className="mr-1.5 size-4" /> Progress
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/reviews">
                  <CheckSquare className="mr-1.5 size-4" /> Reviews
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border-r pr-3">
              <User className="size-3.5" />
              <span className="font-medium text-foreground">{learnerName}</span>
            </div>

            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit" title="Sign Out">
                <LogOut className="size-4" />
                <span className="hidden sm:inline ml-1.5">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t px-2 py-1 flex justify-around items-center">
        <Link
          href="/dashboard"
          className="flex flex-col items-center py-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Home className="size-5 mb-0.5" />
          Dashboard
        </Link>
        <Link
          href="/challenge"
          className="flex flex-col items-center py-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Calendar className="size-5 mb-0.5" />
          Map
        </Link>
        <Link
          href="/progress"
          className="flex flex-col items-center py-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <TrendingUp className="size-5 mb-0.5" />
          Progress
        </Link>
        <Link
          href="/reviews"
          className="flex flex-col items-center py-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <CheckSquare className="size-5 mb-0.5" />
          Reviews
        </Link>
      </nav>
    </div>
  );
}
