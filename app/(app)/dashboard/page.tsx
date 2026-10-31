import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calculateChallengeStats,
  findNextIncompleteDay,
  isDayComplete,
} from "@/lib/utils/progression";
import { ErrorFallback } from "@/components/ui/error-fallback";
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
} from "lucide-react";
import { Database } from "@/types/database.types";

type ChallengeDay = Database["public"]["Tables"]["challenge_days"]["Row"];
type DailyProgress = Database["public"]["Tables"]["daily_progress"]["Row"];
type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Phase = Database["public"]["Tables"]["phases"]["Row"];

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch challenge, phases, challenge_days, and user's progress
  const [
    { data: challengeData, error: challengeError },
    { data: phasesData, error: phasesError },
    { data: daysData, error: daysError },
    { data: progressData, error: progressError },
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

  if (phasesError || daysError || !phasesData || phasesData.length === 0 || !daysData || daysData.length === 0) {
    return (
      <ErrorFallback
        title="Couldn't Load Dashboard"
        description="We couldn't retrieve your challenge curriculum and progress from the database. Please check your connection and retry."
        error={phasesError || daysError || challengeError}
      />
    );
  }

  const phases: Phase[] = phasesData;
  const days: ChallengeDay[] = daysData;
  const progressList: DailyProgress[] = progressData ?? [];

  const progressMap = new Map(progressList.map((p) => [p.challenge_day_id, p]));
  const stats = calculateChallengeStats(days, progressList);

  // Determine the next incomplete day (BR-005)
  const currentDay = findNextIncompleteDay(days, progressMap);
  const currentProgress = currentDay ? progressMap.get(currentDay.id) : null;
  void isDayComplete(currentProgress);

  // Fetch activities for the current day
  const { data: activitiesData } = currentDay
    ? await supabase
        .from("activities")
        .select("*")
        .eq("challenge_day_id", currentDay.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const currentActivities: Activity[] = activitiesData ?? [];
  const speakingActivity = currentActivities.find((a) => a.activity_type === "speaking");
  const writingActivity = currentActivities.find((a) => a.activity_type === "writing");

  // Determine current active phase
  const currentPhase =
    phases.find(
      (p) =>
        currentDay &&
        currentDay.day_number >= p.start_day &&
        currentDay.day_number <= p.end_day
    ) || phases[0];

  const phaseEmojis = ["🌱", "💬", "💡", "🎯", "🚀", "🏆"];
  const currentEmoji = currentPhase
    ? phaseEmojis[(currentPhase.phase_number - 1) % phaseEmojis.length]
    : "✨";

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Top Banner: Warm & Encouraging Header */}
      <section className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden card-hover-lift">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 animate-scale-in">
              <Sparkles className="size-3.5 text-primary" />
              <span>Target: Confident B2 Productive Fluency</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              One bite at a time.
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="text-base">{currentEmoji}</span>
              <span>
                Phase {currentPhase?.phase_number}: <strong>{currentPhase?.title}</strong>
              </span>
            </p>
          </div>

          {/* Progress Pill Box */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0 bg-secondary/50 p-4 rounded-2xl border border-border/60 transition-transform duration-200 hover:scale-[1.02]">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary font-mono">
                {stats.completedDaysCount}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                / {stats.totalDays} Days Finished
              </span>
            </div>

            <div className="w-full md:w-56 space-y-1.5">
              <Progress value={stats.percentage} className="h-2.5 rounded-full transition-all duration-700 ease-out" />
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>{stats.percentage}% completed</span>
                <span>{stats.totalDays - stats.completedDaysCount} days left</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Action Card: Next Target Day */}
      {currentDay && (
        <section className="space-y-4 animate-fade-up stagger-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Target className="size-5 text-primary" />
              Your Next Target
            </h2>
            <Badge variant="outline" className="text-xs font-mono">
              Scheduled: {currentDay.scheduled_date}
            </Badge>
          </div>

          <Card className="border-2 border-primary/40 bg-gradient-to-br from-card via-card to-amber-50/20 dark:to-amber-950/10 shadow-sm rounded-3xl overflow-hidden card-hover-lift">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="cute" className="font-mono text-xs px-3 py-1 animate-scale-in">
                  ⭐ Day {currentDay.day_number} of 41
                </Badge>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={currentProgress?.speaking_completed_at ? "speaking" : "outline"}
                    className="text-xs"
                  >
                    Speaking: {currentProgress?.speaking_completed_at ? "Done ✓" : "Pending"}
                  </Badge>
                  <Badge
                    variant={currentProgress?.writing_completed_at ? "writing" : "outline"}
                    className="text-xs"
                  >
                    Writing: {currentProgress?.writing_completed_at ? "Done ✓" : "Pending"}
                  </Badge>
                </div>
              </div>

              <CardTitle className="text-xl md:text-2xl mt-2 font-extrabold">
                {currentDay.title || `Day ${currentDay.day_number}`}
              </CardTitle>
              <CardDescription className="text-sm md:text-base leading-relaxed text-foreground/80 mt-1">
                {currentDay.intro}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid sm:grid-cols-2 gap-4 pt-1">
              {/* Speaking Quick Link */}
              <div className="rounded-2xl p-4.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-2.5 transition-all duration-200 hover:border-blue-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-300">
                    <Mic className="size-4" /> 15m Voice Studio
                  </div>
                  {currentProgress?.speaking_completed_at ? (
                    <span className="inline-flex items-center text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 className="size-3.5 mr-1" /> Complete
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-background/80">
                      Not started
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-foreground/90 font-medium line-clamp-2">
                  {speakingActivity?.prompt || "Daily unscripted oral response"}
                </p>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 rounded-xl border-blue-300 dark:border-blue-800 bg-background/80 hover:bg-background pressable"
                >
                  <Link href={`/challenge/${currentDay.day_number}/speaking`}>
                    {currentProgress?.speaking_completed_at
                      ? "Review Audio"
                      : "Start Voice Practice 🎙️"}
                  </Link>
                </Button>
              </div>

              {/* Writing Quick Link */}
              <div className="rounded-2xl p-4.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2.5 transition-all duration-200 hover:border-emerald-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-300">
                    <PenLine className="size-4" /> 15m Writing Studio
                  </div>
                  {currentProgress?.writing_completed_at ? (
                    <span className="inline-flex items-center text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 className="size-3.5 mr-1" /> Complete
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-background/80">
                      Not started
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-foreground/90 font-medium line-clamp-2">
                  {writingActivity?.prompt || "Daily non-translator written response"}
                </p>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 rounded-xl border-emerald-300 dark:border-emerald-800 bg-background/80 hover:bg-background pressable"
                >
                  <Link href={`/challenge/${currentDay.day_number}/writing`}>
                    {currentProgress?.writing_completed_at
                      ? "Review Writing"
                      : "Start Writing Draft ✍️"}
                  </Link>
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80 pt-4 px-6 bg-card/60">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" /> Total estimated time: 30 minutes
              </span>

              <Button asChild size="lg" className="w-full sm:w-auto shadow-sm pressable">
                <Link href={`/challenge/${currentDay.day_number}`}>
                  Open Day {currentDay.day_number} Hub <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      )}

      {/* Routine & Progression Badges */}
      <section className="grid sm:grid-cols-3 gap-4 animate-fade-up stagger-2">
        <Card className="p-4 bg-card rounded-2xl border flex items-center gap-3 card-hover-lift">
          <div className="size-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 flex items-center justify-center text-lg shrink-0">
            🌱
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold">Sequential Habit</h4>
            <p className="text-[11px] text-muted-foreground">
              Never skip or double up. Just resume from the lowest incomplete day.
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-card rounded-2xl border flex items-center gap-3 card-hover-lift">
          <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 flex items-center justify-center text-lg shrink-0">
            🎙️
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold">Voice Practice</h4>
            <p className="text-[11px] text-muted-foreground">
              {stats.speakingCompletedCount} recordings submitted without reading scripts.
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-card rounded-2xl border flex items-center gap-3 card-hover-lift">
          <div className="size-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-lg shrink-0">
            ✍️
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold">Written Practice</h4>
            <p className="text-[11px] text-muted-foreground">
              {stats.writingCompletedCount} written pieces drafted without a translator.
            </p>
          </div>
        </Card>
      </section>

      {/* Quick Navigation Footnote */}
      <section className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-secondary/50 p-4 rounded-2xl border border-border/60 animate-fade-up stagger-3">
        <div className="text-xs text-muted-foreground text-center sm:text-left flex items-center gap-2">
          <span>✨</span>
          <span>Explore all 41 days grouped by their 6 learning phases or audit your self-assessments.</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="rounded-xl pressable">
            <Link href="/challenge">View 41-Day Map</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl pressable">
            <Link href="/progress">View Analytics</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-36 rounded-3xl bg-card border border-border/60" />
          <div className="h-80 rounded-3xl bg-card border border-border/60" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
