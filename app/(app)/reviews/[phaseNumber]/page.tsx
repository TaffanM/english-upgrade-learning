import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { WeeklyReviewClient } from "@/features/reviews/WeeklyReviewClient";

async function WeeklyReviewDetailContent({
  params,
}: {
  params: Promise<{ phaseNumber: string }>;
}) {
  const { phaseNumber } = await params;
  const phaseNum = parseInt(phaseNumber, 10);

  if (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 6) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch challenge & phase
  const [{ data: challenge, error: challengeError }, { data: phase, error: phaseError }] = await Promise.all([
    supabase
      .from("challenges")
      .select("id")
      .eq("slug", "41-day-english-upgrade")
      .maybeSingle(),
    supabase.from("phases").select("*").eq("phase_number", phaseNum).maybeSingle(),
  ]);

  if (challengeError || phaseError || !challenge || !phase) {
    return (
      <ErrorFallback
        title={`Phase ${phaseNum} Review Unavailable`}
        description="We couldn't retrieve the weekly review phase details from the database."
        error={challengeError || phaseError}
      />
    );
  }

  // Fetch existing review for this user & phase
  const { data: existingReview } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("phase_id", phase.id)
    .maybeSingle();

  // If final phase (phase 6), fetch Day 1 and Day 41 submissions for comparison
  let day1Writing: string | null = null;
  let day41Writing: string | null = null;
  let day1AudioPath: string | null = null;
  let day41AudioPath: string | null = null;

  if (phaseNum === 6) {
    const { data: days } = await supabase
      .from("challenge_days")
      .select("id, day_number")
      .in("day_number", [1, 41]);

    const day1Id = days?.find((d) => d.day_number === 1)?.id;
    const day41Id = days?.find((d) => d.day_number === 41)?.id;

    if (day1Id && day41Id) {
      const { data: activities } = await supabase
        .from("activities")
        .select("id, challenge_day_id, activity_type")
        .in("challenge_day_id", [day1Id, day41Id]);

      const day1WritingAct = activities?.find(
        (a) => a.challenge_day_id === day1Id && a.activity_type === "writing"
      );
      const day1SpeakingAct = activities?.find(
        (a) => a.challenge_day_id === day1Id && a.activity_type === "speaking"
      );
      const day41WritingAct = activities?.find(
        (a) => a.challenge_day_id === day41Id && a.activity_type === "writing"
      );
      const day41SpeakingAct = activities?.find(
        (a) => a.challenge_day_id === day41Id && a.activity_type === "speaking"
      );

      const actIds = [
        day1WritingAct?.id,
        day1SpeakingAct?.id,
        day41WritingAct?.id,
        day41SpeakingAct?.id,
      ].filter(Boolean) as string[];

      const { data: subs } = await supabase
        .from("activity_submissions")
        .select("*")
        .eq("user_id", user.id)
        .in("activity_id", actIds)
        .eq("status", "submitted")
        .order("attempt_number", { ascending: false });

      day1Writing =
        subs?.find((s) => s.activity_id === day1WritingAct?.id)?.text_content ?? null;
      day41Writing =
        subs?.find((s) => s.activity_id === day41WritingAct?.id)?.text_content ?? null;
      day1AudioPath =
        subs?.find((s) => s.activity_id === day1SpeakingAct?.id)?.storage_path ?? null;
      day41AudioPath =
        subs?.find((s) => s.activity_id === day41SpeakingAct?.id)?.storage_path ?? null;
    }
  }

  return (
    <WeeklyReviewClient
      phase={phase}
      challengeId={challenge.id}
      existingReview={existingReview}
      isFinalPhase={phaseNum === 6}
      day1Writing={day1Writing}
      day41Writing={day41Writing}
      day1AudioPath={day1AudioPath}
      day41AudioPath={day41AudioPath}
    />
  );
}

export default function WeeklyReviewDetailPage({
  params,
}: {
  params: Promise<{ phaseNumber: string }>;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <Suspense fallback={<div className="h-96 rounded-3xl bg-card border animate-pulse" />}>
        <WeeklyReviewDetailContent params={params} />
      </Suspense>
    </div>
  );
}
