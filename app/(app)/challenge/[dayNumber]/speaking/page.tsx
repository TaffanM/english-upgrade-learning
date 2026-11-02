import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapRowToAiReviewDTO } from "@/lib/ai/review-service";
import { AiReviewRecordDTO } from "@/lib/ai/types";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { SpeakingStudioClient } from "@/features/speaking/SpeakingStudioClient";

async function SpeakingStudioContent({
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
  const [{ data: challenge, error: challengeError }, { data: day, error: dayError }] = await Promise.all([
    supabase
      .from("challenges")
      .select("id")
      .eq("slug", "41-day-english-upgrade")
      .maybeSingle(),
    supabase
      .from("challenge_days")
      .select("*")
      .eq("day_number", dayNum)
      .maybeSingle(),
  ]);

  if (challengeError || dayError || !day || !challenge) {
    return (
      <ErrorFallback
        title={`Day ${dayNum} Not Found`}
        description="We couldn't retrieve the challenge day records from the database."
        error={challengeError || dayError}
      />
    );
  }

  // Fetch speaking activity
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("*")
    .eq("challenge_day_id", day.id)
    .eq("activity_type", "speaking")
    .maybeSingle();

  if (activityError || !activity) {
    return (
      <ErrorFallback
        title="Speaking Studio Unavailable"
        description={`We couldn't retrieve the speaking activity for Day ${dayNum} from the database.`}
        error={activityError}
      />
    );
  }

  // Fetch speaking submissions
  const { data: submissions = [] } = await supabase
    .from("activity_submissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_id", activity.id)
    .order("attempt_number", { ascending: false });

  const submittedIds = (submissions ?? []).map((s) => s.id);
  const initialReviewsBySubmissionId: Record<string, AiReviewRecordDTO> = {};
  if (submittedIds.length > 0) {
    const { data: reviewRows } = await supabase
      .from("ai_reviews")
      .select("*")
      .eq("user_id", user.id)
      .in("submission_id", submittedIds);

    for (const row of reviewRows ?? []) {
      initialReviewsBySubmissionId[row.submission_id] = mapRowToAiReviewDTO(row);
    }
  }

  return (
    <SpeakingStudioClient
      dayNumber={dayNum}
      challengeId={challenge.id}
      userId={user.id}
      activity={activity}
      submittedAttempts={submissions || []}
      initialReviewsBySubmissionId={initialReviewsBySubmissionId}
    />
  );
}

export default function SpeakingStudioPage({
  params,
}: {
  params: Promise<{ dayNumber: string }>;
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <Suspense fallback={<div className="h-96 rounded-3xl bg-card border animate-pulse" />}>
        <SpeakingStudioContent params={params} />
      </Suspense>
    </div>
  );
}
