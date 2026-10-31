import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo = "/dashboard", error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1.5 size-3.5" /> Back to challenge overview
          </Link>
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-sm mx-auto">
            41
          </div>
          <h1 className="text-2xl font-bold tracking-tight">41-Day English Upgrade</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue your daily Speaking & Writing challenge
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Learner Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your provisioned email and password to access your dashboard.
            </CardDescription>
          </CardHeader>

          <form action={loginAction}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center gap-2">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span>
                    {error === "auth_callback_failed"
                      ? "Authentication session expired or failed. Please sign in again."
                      : error}
                  </span>
                </div>
              )}

              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="learner@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">
                Sign In to Challenge
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
                <Lock className="size-3" />
                <span>Single-learner private space • Public registration disabled</span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
