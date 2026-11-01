import { Suspense } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";
import { LoginSubmitButton } from "./LoginSubmitButton";

async function LoginFormContent({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo = "/dashboard", error } = await searchParams;

  return (
    <form action={loginAction}>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 animate-scale-in">
            <ShieldAlert className="size-4 shrink-0" />
            <span>
              {error === "auth_callback_failed"
                ? "Authentication session expired or failed. Please sign in again."
                : error}
            </span>
          </div>
        )}

        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="learner@example.com"
            required
            autoComplete="email"
            autoFocus
            className="rounded-xl text-xs h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="rounded-xl text-xs h-10"
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-2">
        <LoginSubmitButton />
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
          <Lock className="size-3" />
          <span>Single-learner private space • Public registration disabled</span>
        </div>
      </CardFooter>
    </form>
  );
}

function LoginFormFallback() {
  return (
    <CardContent className="space-y-4 py-6">
      <div className="h-10 rounded-xl bg-muted/50 animate-pulse" />
      <div className="h-10 rounded-xl bg-muted/50 animate-pulse" />
      <div className="h-10 rounded-xl bg-primary/20 animate-pulse mt-2" />
    </CardContent>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 animate-scale-in">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 pressable"
          >
            <ArrowLeft className="mr-1.5 size-3.5" /> Back to challenge overview
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight">41-Day English Upgrade</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to continue your daily Speaking & Writing studio
          </p>
        </div>

        <Card className="shadow-sm border-2 border-border/80 rounded-3xl overflow-hidden card-hover-lift">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-lg font-bold">Learner Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your provisioned email and password to access your dashboard.
            </CardDescription>
          </CardHeader>

          <Suspense fallback={<LoginFormFallback />}>
            <LoginFormContent searchParams={searchParams} />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
