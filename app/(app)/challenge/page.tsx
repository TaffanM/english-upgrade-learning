import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupDaysByPhase } from "@/lib/utils/progression";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Circle, Clock, Mic, PenLine } from "lucide-react";

export default async function ChallengeMapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: phases = [] },
    { data: days = [] },
    { data: progressList = [] },
  ] = await Promise.all([
    supabase.from("phases").select("*").order("phase_number", { ascending: true }),
    supabase.from("challenge_days").select("*").order("day_number", { ascending: true }),
    supabase.from("daily_progress").select("*").eq("user_id", user.id),
  ]);

  const progressMap = new Map(progressList?.map((p) => [p.challenge_day_id, p]));
  const phaseGroups = groupDaysByPhase(phases || [], days || [], progressMap);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          41-Day Challenge Map
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          All 41 days grouped by phase. Open any day to view prompts, practice audio speaking,
          and submit your writing responses.
        </p>
      </div>

      {/* 6 Phases Accordion / List */}
      <div className="space-y-8">
        {phaseGroups.map((group) => (
          <section key={group.phase.id} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
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
                  <div className="text-xs font-semibold">
                    {group.completedCount} / {group.totalCount} Done
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {group.percentage}% of phase
                  </div>
                </div>
                <div className="w-20">
                  <Progress value={group.percentage} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.days.map(({ day, progress, isComplete, speakingComplete, writingComplete }) => {
                const isPartiallyComplete =
                  !isComplete && (speakingComplete || writingComplete);

                return (
                  <Link
                    key={day.id}
                    href={`/challenge/${day.day_number}`}
                    className="group block"
                  >
                    <Card
                      className={`h-full transition-all border hover:border-primary/50 hover:shadow-xs ${
                        isComplete
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : isPartiallyComplete
                          ? "bg-amber-500/5 border-amber-500/30"
                          : "bg-card"
                      }`}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                            Day {day.day_number}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {day.scheduled_date}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-semibold mt-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {day.title || `Day ${day.day_number}`}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-4 pt-1">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {day.intro}
                        </p>

                        <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1 ${
                                speakingComplete ? "text-blue-600 font-medium" : "text-muted-foreground"
                              }`}
                              title="Speaking activity"
                            >
                              <Mic className="size-3" />
                              {speakingComplete ? "Spk ✓" : "Spk"}
                            </span>
                            <span
                              className={`flex items-center gap-1 ${
                                writingComplete ? "text-emerald-600 font-medium" : "text-muted-foreground"
                              }`}
                              title="Writing activity"
                            >
                              <PenLine className="size-3" />
                              {writingComplete ? "Wri ✓" : "Wri"}
                            </span>
                          </div>

                          <div>
                            {isComplete ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0">
                                Complete
                              </Badge>
                            ) : isPartiallyComplete ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] py-0">
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
    </div>
  );
}
