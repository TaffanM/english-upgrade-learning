import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupDaysByPhase } from "@/lib/utils/progression";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, PenLine } from "lucide-react";
import { Database } from "@/types/database.types";

type Phase = Database["public"]["Tables"]["phases"]["Row"];
type ChallengeDay = Database["public"]["Tables"]["challenge_days"]["Row"];
type DailyProgress = Database["public"]["Tables"]["daily_progress"]["Row"];

async function ChallengeMapContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: phasesData, error: phasesError },
    { data: daysData, error: daysError },
    { data: progressData },
  ] = await Promise.all([
    supabase.from("phases").select("*").order("phase_number", { ascending: true }),
    supabase.from("challenge_days").select("*").order("day_number", { ascending: true }),
    supabase.from("daily_progress").select("*").eq("user_id", user.id),
  ]);

  if (phasesError || daysError || !phasesData || phasesData.length === 0 || !daysData || daysData.length === 0) {
    return (
      <ErrorFallback
        title="Couldn't Load Roadmap"
        description="We couldn't retrieve the 41-day curriculum phases from the database. Please check your connection and retry."
        error={phasesError || daysError}
      />
    );
  }

  const phases: Phase[] = phasesData;
  const days: ChallengeDay[] = daysData;
  const progressList: DailyProgress[] = progressData ?? [];

  const progressMap = new Map(progressList.map((p) => [p.challenge_day_id, p]));
  const phaseGroups = groupDaysByPhase(phases, days, progressMap);

  return (
    <div className="space-y-8">
      {phaseGroups.map((group, gIdx) => (
        <section key={group.phase.id} className="space-y-4 animate-fade-up" style={{ animationDelay: `${gIdx * 60}ms` }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                  Phase {group.phase.phase_number}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Days {group.phase.start_day}–{group.phase.end_day}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1 tracking-tight">
                {group.phase.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{group.phase.focus}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs font-bold font-mono">
                  {group.completedCount} / {group.totalCount} Done
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {group.percentage}% of phase
                </div>
              </div>
              <div className="w-20">
                <Progress value={group.percentage} className="h-2 rounded-full" />
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {group.days.map(({ day, isComplete, speakingComplete, writingComplete }) => {
              const isPartiallyComplete =
                !isComplete && (speakingComplete || writingComplete);

              return (
                <Link
                  key={day.id}
                  href={`/challenge/${day.day_number}`}
                  className="group block h-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                >
                  <Card
                    className={`h-full flex flex-col justify-between gap-0 transition-all duration-200 card-hover-lift rounded-2xl border ${
                      isComplete
                        ? "bg-emerald-500/5 border-emerald-500/40 shadow-2xs"
                        : isPartiallyComplete
                        ? "bg-amber-500/5 border-amber-500/40 shadow-2xs"
                        : "bg-card"
                    }`}
                  >
                    <CardHeader className="p-4 pb-1.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          Day {day.day_number}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {day.scheduled_date}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                        {day.title || `Day ${day.day_number}`}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {day.intro}
                      </p>

                      <div className="mt-3.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex items-center gap-1 text-[11px] ${
                              speakingComplete ? "text-blue-600 dark:text-blue-400 font-bold" : "text-muted-foreground"
                            }`}
                            title="Speaking activity"
                          >
                            <Mic className="size-3" />
                            {speakingComplete ? "Spk ✓" : "Spk"}
                          </span>
                          <span
                            className={`flex items-center gap-1 text-[11px] ${
                              writingComplete ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"
                            }`}
                            title="Writing activity"
                          >
                            <PenLine className="size-3" />
                            {writingComplete ? "Wri ✓" : "Wri"}
                          </span>
                        </div>

                        <div>
                          {isComplete ? (
                            <Badge variant="writing" className="text-[10px] py-0 px-2">
                              Complete ✓
                            </Badge>
                          ) : isPartiallyComplete ? (
                            <Badge variant="cute" className="text-[10px] py-0 px-2">
                              1/2 Done
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Pending</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ChallengeMapPage() {
  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="cute" className="animate-scale-in">🗺️ Full 41-Day Sequence</Badge>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Challenge Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          All 41 days grouped by their 6 progressive phases. Open any day to view prompts, practice unscripted speaking,
          and draft non-translator writing.
        </p>
      </div>

      {/* 6 Phases Accordion / List */}
      <Suspense
        fallback={
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-card border border-border/60" />
            ))}
          </div>
        }
      >
        <ChallengeMapContent />
      </Suspense>
    </div>
  );
}
