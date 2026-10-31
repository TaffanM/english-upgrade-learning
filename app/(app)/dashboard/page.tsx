import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calculateChallengeStats,
  findNextIncompleteDay,
  isDayComplete,
} from "@/lib/utils/progression";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mic,
  PenLine,
  Sparkles,
  Target,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch challenge, phases, challenge_days, and user's progress
  const [
    { data: challenge },
    { data: phases = [] },
    { data: days = [] },
    { data: progressList = [] },
  ] = await Promise.all([
    supabase
      .from("challenges")
      .select("*")
      .eq("slug", "41-day-english-upgrade")
      .maybeSingle(),
    supabase.from("phases").select("*").order("phase_number", { ascending: true }),
    supabase.from("challenge_days").select("*").order("day_number", { ascending: true }),
    supabase.from("daily_progress").select("*").eq("user_id", user.id),
  ]);

  const progressMap = new Map(progressList?.map((p) => [p.challenge_day_id, p]));
  const stats = calculateChallengeStats(days || [], progressList || []);

  // Determine the next incomplete day (BR-005)
  const currentDay = findNextIncompleteDay(days || [], progressMap);
  const currentProgress = currentDay ? progressMap.get(currentDay.id) : null;
  const currentDayComplete = isDayComplete(currentProgress);

  // Fetch activities for the current day
  const { data: currentActivities = [] } = currentDay
    ? await supabase
        .from("activities")
        .select("*")
        .eq("challenge_day_id", currentDay.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const speakingActivity = currentActivities?.find((a) => a.activity_type === "speaking");
  const writingActivity = currentActivities?.find((a) => a.activity_type === "writing");

  // Determine current active phase
  const currentPhase =
    phases?.find(
      (p) =>
        currentDay &&
        currentDay.day_number >= p.start_day &&
        currentDay.day_number <= p.end_day
    ) || phases?.[0];

  return (
    <div className="space-y-8">
      {/* Top Banner: Progress Overview */}
      <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
              Target: B1 → B2 Productive Proficiency
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              41-Day English Upgrade
            </h1>
            <p className="text-sm text-muted-foreground">
              Current Phase: <strong>Phase {currentPhase?.phase_number}: {currentPhase?.title}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {stats.completedDaysCount}
              </span>
              <span className="text-sm text-muted-foreground">/ {stats.totalDays} Days Completed</span>
            </div>
            <div className="w-full md:w-56 space-y-1">
              <Progress value={stats.percentage} className="h-2" />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{stats.percentage}% finished</span>
                <span>{stats.totalDays - stats.completedDaysCount} days remaining</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Action Card: Next Incomplete Day */}
      {currentDay && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Target className="size-5 text-primary" />
              Your Next Target
            </h2>
            <Badge variant="outline" className="text-xs">
              Scheduled: {currentDay.scheduled_date}
            </Badge>
          </div>

          <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className="font-mono text-xs">Day {currentDay.day_number}</Badge>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={currentProgress?.speaking_completed_at ? "default" : "outline"}
                    className="text-xs"
                  >
                    Speaking: {currentProgress?.speaking_completed_at ? "Done" : "Pending"}
                  </Badge>
                  <Badge
                    variant={currentProgress?.writing_completed_at ? "default" : "outline"}
                    className="text-xs"
                  >
                    Writing: {currentProgress?.writing_completed_at ? "Done" : "Pending"}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl mt-2">
                {currentDay.title || `Day ${currentDay.day_number}`}
              </CardTitle>
              <CardDescription className="text-sm md:text-base leading-relaxed">
                {currentDay.intro}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid sm:grid-cols-2 gap-4 pt-2">
              {/* Speaking Quick Link */}
              <div className="border rounded-xl p-4 bg-background/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Mic className="size-4 text-blue-500" />
                    Speaking (15 min)
                  </div>
                  {currentProgress?.speaking_completed_at ? (
                    <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="size-3.5 mr-1" /> Complete
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not started</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {speakingActivity?.prompt || "Daily unscripted oral response"}
                </p>
                <Button asChild size="sm" variant="outline" className="w-full mt-2">
                  <Link href={`/challenge/${currentDay.day_number}/speaking`}>
                    {currentProgress?.speaking_completed_at ? "Review Audio" : "Start Speaking Studio"}
                  </Link>
                </Button>
              </div>

              {/* Writing Quick Link */}
              <div className="border rounded-xl p-4 bg-background/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <PenLine className="size-4 text-emerald-500" />
                    Writing (15 min)
                  </div>
                  {currentProgress?.writing_completed_at ? (
                    <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="size-3.5 mr-1" /> Complete
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not started</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {writingActivity?.prompt || "Daily non-translator written response"}
                </p>
                <Button asChild size="sm" variant="outline" className="w-full mt-2">
                  <Link href={`/challenge/${currentDay.day_number}/writing`}>
                    {currentProgress?.writing_completed_at ? "Review Writing" : "Start Writing Studio"}
                  </Link>
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" /> Total estimated time: 30 minutes
              </span>
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/challenge/${currentDay.day_number}`}>
                  Open Day {currentDay.day_number} Hub <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      )}

      {/* Routine & Progression Rules Reminder */}
      <section className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-6 flex items-start gap-3">
            <CalendarCheck className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold">Sequential Progression</h4>
              <p className="text-xs text-muted-foreground">
                Even if you missed yesterday, your next step is simply the lowest incomplete day. No skipped days.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6 flex items-start gap-3">
            <Mic className="size-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold">Speaking Total</h4>
              <p className="text-xs text-muted-foreground">
                {stats.speakingCompletedCount} sessions recorded. Overcome pauses by recording real audio.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6 flex items-start gap-3">
            <PenLine className="size-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold">Writing Total</h4>
              <p className="text-xs text-muted-foreground">
                {stats.writingCompletedCount} written attempts submitted without external translators.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Navigation Cards */}
      <section className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-xl border">
        <div className="text-xs text-muted-foreground text-center sm:text-left">
          Explore all 41 days grouped by their 6 learning phases or audit your self-assessment score trajectories.
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/challenge">View 41-Day Map</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/progress">View Analytics</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
