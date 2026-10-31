"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const displayName = formData.get("displayName") as string;
  const timezone = (formData.get("timezone") as string) || "Asia/Jakarta";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: displayName,
      timezone,
      updated_at: new Date().toISOString(),
    });

  revalidatePath("/", "layout");
  redirect("/settings?updated=true");
}
