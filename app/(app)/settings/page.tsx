import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/app/actions/profile";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, User } from "lucide-react";
import { SettingsSubmitButton } from "./SettingsSubmitButton";

async function SettingsFormContent({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const { updated } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <Card className="rounded-3xl border-2 border-border/80 shadow-xs">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="size-4 text-primary" /> Profile Details
        </CardTitle>
        <CardDescription className="text-xs">
          Your personal practice information.
        </CardDescription>
      </CardHeader>

      <form action={updateProfileAction}>
        <CardContent className="space-y-4">
          {updated === "true" && (
            <div className="p-3 text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 rounded-xl flex items-center gap-2 animate-scale-in">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Profile settings updated successfully!</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="bg-muted/50 text-muted-foreground text-xs rounded-xl"
            />
            <span className="text-[10px] text-muted-foreground">
              Email is provisioned by the project administrator.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-xs">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile?.display_name ?? ""}
              placeholder="Learner name"
              className="text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-xs">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={profile?.timezone ?? "Asia/Jakarta"}
              className="text-xs font-mono rounded-xl"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <SettingsSubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Learner Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your account profile and daily practice timezone.
        </p>
      </div>

      <Suspense fallback={<div className="h-72 rounded-3xl bg-card border animate-pulse" />}>
        <SettingsFormContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
