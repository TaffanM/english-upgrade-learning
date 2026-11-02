import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDayComplete } from "@/lib/utils/progression";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Mic,
  PenLine,
  ShieldCheck,
  Target,
} from "lucide-react";
import { DailySelfAssessmentCard } from "@/features/progress/DailySelfAssessmentCard";
import { Database } from "@/types/database.types";

type ChallengeDay = Database["public"]["Tables"]["challenge_days"]["Row"] & {
  phases?: Database["public"]["Tables"]["phases"]["Row"] | null;
};
type Activity = Database["public"]["Tables"]["activities"]["Row"];
type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];
type Submission = Database["public"]["Tables"]["activity_submissions"]["Row"];
type DailyProgress = Database["public"]["Tables"]["daily_progress"]["Row"];
type SelfAssessment = Database["public"]["Tables"]["self_assessments"]["Row"];

async function DayDetailContent({
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

  // Fetch challenge day and phase
  const { data: dayData, error: dayError } = await supabase
    .from("challenge_days")
    .select("*, phases(*)")
    .eq("day_number", dayNum)
    .maybeSingle();

  if (dayError || !dayData) {
    return (
      <ErrorFallback
        title={`Day ${dayNum} Not Found`}
        description="We couldn't retrieve the curriculum details for this day from the database. Please check your connection and retry."
        error={dayError}
      />
    );
  }
  const day = dayData as ChallengeDay;

  // Fetch activities, checklist items, progress, and self-assessments
  const [
    { data: activitiesData, error: activitiesError },
    { data: checklistData, error: checklistError },
    { data: progressData },
    { data: selfAssessmentsData },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("*")
      .eq("challenge_day_id", day.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("checklist_items")
      .select("*")
      .eq("challenge_day_id", day.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("daily_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("challenge_day_id", day.id)
      .maybeSingle(),
    supabase
      .from("self_assessments")
      .select("*")
      .eq("user_id", user.id)
      .eq("challenge_day_id", day.id)
      .order("updated_at", { ascending: false }),
  ]);

  if (activitiesError || !activitiesData || activitiesData.length === 0) {
    return (
      <ErrorFallback
        title={`Couldn't Load Day ${dayNum} Activities`}
        description="The speaking and writing activities for this day could not be retrieved from the database."
        error={activitiesError}
      />
    );
  }

  const activities: Activity[] = activitiesData;
  const checklistItems: ChecklistItem[] = checklistData ?? [];
  const progress: DailyProgress | null = progressData ?? null;
  const selfAssessments: SelfAssessment[] = selfAssessmentsData ?? [];

  // Fetch submissions for these activities
  const activityIds = activities.map((a) => a.id);
  const { data: submissionsData } = activityIds.length
    ? await supabase
        .from("activity_submissions")
        .select("*")
        .eq("user_id", user.id)
        .in("activity_id", activityIds)
        .order("attempt_number", { ascending: false })
    : { data: [] };

  const submissions: Submission[] = submissionsData ?? [];

  const speakingActivity = activities.find((a) => a.activity_type === "speaking");
  const writingActivity = activities.find((a) => a.activity_type === "writing");

  const speakingSubmissions = submissions.filter(
    (s) => s.activity_id === speakingActivity?.id
  );
  const writingSubmissions = submissions.filter(
    (s) => s.activity_id === writingActivity?.id
  );

  const dayCompleted = isDayComplete(progress);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/challenge">
            <ArrowLeft className="mr-1.5 size-4" /> Back to Challenge Map
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {dayNum > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/challenge/${dayNum - 1}`}>Day {dayNum - 1}</Link>
            </Button>
          )}
          {dayNum < 41 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/challenge/${dayNum + 1}`}>Day {dayNum + 1}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Day Overview Header Card */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="font-mono">Day {day.day_number} of 41</Badge>
              {day.phases && (
                <Badge variant="outline" className="text-xs">
                  Phase {day.phases.phase_number}: {day.phases.title}
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Scheduled Date: <strong>{day.scheduled_date}</strong> (Curriculum pace)
            </div>
          </div>

          <CardTitle className="text-2xl md:text-3xl font-bold mt-2">
            {day.title || `Day ${day.day_number}`}
          </CardTitle>
          <CardDescription className="text-base text-foreground/80 mt-1 leading-relaxed">
            {day.intro}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-y py-3">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> Total Target: 30 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Both activities required for completion
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              Status:{" "}
              {dayCompleted ? (
                <strong className="text-emerald-600">Day Completed ✓</strong>
              ) : (
                <strong>In Progress</strong>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Two Activities: Speaking & Writing Hubs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Speaking Activity Card */}
        {speakingActivity && (
          <Card className="flex flex-col justify-between border-l-4 border-l-blue-500 shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-xs text-blue-600 dark:text-blue-400">
                  <Mic className="size-4" /> Activity 1: Speaking
                </span>
                <Badge
                  variant={progress?.speaking_completed_at ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {progress?.speaking_completed_at ? "Completed" : "Pending"}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{speakingActivity.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm flex-1">
              <div className="bg-muted/40 p-3.5 rounded-lg border">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Prompt
                </p>
                <p className="font-medium text-foreground">{speakingActivity.prompt}</p>
              </div>

              {speakingActivity.instructions && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground/80">Routine Guidance:</p>
                  <p>{speakingActivity.instructions}</p>
                </div>
              )}

              {speakingSubmissions.length > 0 && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Recorded attempts: <strong>{speakingSubmissions.length}</strong>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-4 border-t">
              <Button asChild className="w-full" variant={progress?.speaking_completed_at ? "outline" : "default"}>
                <Link href={`/challenge/${day.day_number}/speaking`}>
                  {progress?.speaking_completed_at ? "Review Audio Recording" : "Launch Speaking Studio"}
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Writing Activity Card */}
        {writingActivity && (
          <Card className="flex flex-col justify-between border-l-4 border-l-emerald-500 shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                  <PenLine className="size-4" /> Activity 2: Writing
                </span>
                <Badge
                  variant={progress?.writing_completed_at ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {progress?.writing_completed_at ? "Completed" : "Pending"}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{writingActivity.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm flex-1">
              <div className="bg-muted/40 p-3.5 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Prompt
                  </p>
                  {writingActivity.target_word_count && (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Target: {writingActivity.target_word_count} words
                    </Badge>
                  )}
                </div>
                <p className="font-medium text-foreground">{writingActivity.prompt}</p>
              </div>

              {writingActivity.instructions && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground/80">Writing Action:</p>
                  <p>{writingActivity.instructions}</p>
                </div>
              )}

              {writingSubmissions.length > 0 && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Submitted attempts: <strong>{writingSubmissions.filter((s) => s.status === "submitted").length}</strong>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-4 border-t">
              <Button asChild className="w-full" variant={progress?.writing_completed_at ? "outline" : "default"}>
                <Link href={`/challenge/${day.day_number}/writing`}>
                  {progress?.writing_completed_at ? "Review Writing Attempts" : "Launch Writing Studio"}
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Checklist items for this day */}
      {checklistItems.length > 0 && (
        <Card className="bg-card">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="size-4 text-primary" /> Day {day.day_number} Focus Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 text-xs space-y-2">
            {checklistItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Daily Self-Assessment Rubric (Speaking & Writing) */}
      <DailySelfAssessmentCard
        challengeDayId={day.id}
        dayNumber={day.day_number}
        initialAssessments={selfAssessments}
      />
    </div>
  );
}

export default function DayDetailPage({
  params,
}: {
  params: Promise<{ dayNumber: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
          <div className="h-44 rounded-2xl bg-card border" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-card border" />
            <div className="h-64 rounded-2xl bg-card border" />
          </div>
        </div>
      }
    >
      <DayDetailContent params={params} />
    </Suspense>
  );
}
