import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WritingStudioClient } from "@/features/writing/WritingStudioClient";

export default async function WritingStudioPage({
  params,
}: {
  params: Promise<{ dayNumber: string }>;
}) {
  const { dayNumber } = await params;
  const dayNum = parseInt(dayNumber, 10);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 41) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch challenge day
  const { data: day } = await supabase
    .from("challenge_days")
    .select("*")
    .eq("day_number", dayNum)
    .single();

  if (!day) {
    notFound();
  }

  // Fetch writing activity
  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("challenge_day_id", day.id)
    .eq("activity_type", "writing")
    .single();

  if (!activity) {
    notFound();
  }

  // Fetch checklist items and submissions
  const [
    { data: checklistItems = [] },
    { data: submissions = [] },
    { data: completions = [] },
  ] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("*")
      .eq("challenge_day_id", day.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("activity_submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("activity_id", activity.id)
      .order("attempt_number", { ascending: false }),
    supabase
      .from("checklist_completions")
      .select("checklist_item_id")
      .eq("user_id", user.id)
      .eq("is_completed", true),
  ]);

  const activeDraft = submissions?.find((s) => s.status === "draft") ?? null;
  const submittedAttempts = submissions?.filter((s) => s.status === "submitted") ?? [];
  const completedChecklistIds = completions?.map((c) => c.checklist_item_id) ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <WritingStudioClient
        dayNumber={dayNum}
        activity={activity}
        checklistItems={checklistItems || []}
        activeDraft={activeDraft}
        submittedAttempts={submittedAttempts}
        completedChecklistIds={completedChecklistIds}
      />
    </div>
  );
}
