import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpeakingStudioClient } from "@/features/speaking/SpeakingStudioClient";

export default async function SpeakingStudioPage({
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

  // Fetch challenge and day
  const [{ data: challenge }, { data: day }] = await Promise.all([
    supabase
      .from("challenges")
      .select("id")
      .eq("slug", "41-day-english-upgrade")
      .single(),
    supabase
      .from("challenge_days")
      .select("*")
      .eq("day_number", dayNum)
      .single(),
  ]);

  if (!day || !challenge) {
    notFound();
  }

  // Fetch speaking activity
  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("challenge_day_id", day.id)
    .eq("activity_type", "speaking")
    .single();

  if (!activity) {
    notFound();
  }

  // Fetch speaking submissions
  const { data: submissions = [] } = await supabase
    .from("activity_submissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_id", activity.id)
    .order("attempt_number", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <SpeakingStudioClient
        dayNumber={dayNum}
        challengeId={challenge.id}
        userId={user.id}
        activity={activity}
        submittedAttempts={submissions || []}
      />
    </div>
  );
}
