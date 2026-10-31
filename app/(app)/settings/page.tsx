import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, User } from "lucide-react";

export default async function SettingsPage() {
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Learner Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your account profile and daily practice timezone.
        </p>
      </div>

      <Card>
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
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email ?? ""}
                disabled
                className="bg-muted/50 text-muted-foreground text-xs"
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
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone" className="text-xs">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={profile?.timezone ?? "Asia/Jakarta"}
                className="text-xs font-mono"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t pt-4">
            <Button type="submit" size="sm">
              <Save className="size-3.5 mr-1.5" /> Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
