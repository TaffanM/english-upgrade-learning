import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Circle, Clock, Sparkles, Star } from "lucide-react";

export default async function ReviewsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch challenge, phases, and existing weekly reviews
  const [{ data: phases = [] }, { data: reviews = [] }] = await Promise.all([
    supabase.from("phases").select("*").order("phase_number", { ascending: true }),
    supabase.from("weekly_reviews").select("*").eq("user_id", user.id),
  ]);

  const reviewMap = new Map(reviews?.map((r) => [r.phase_id, r]));

  const checkpoints = [
    { phaseNumber: 1, date: "6 Nov 2026", milestone: "Habit & Baseline Reflection" },
    { phaseNumber: 2, date: "13 Nov 2026", milestone: "Comparative Reasoning Review" },
    { phaseNumber: 3, date: "20 Nov 2026", milestone: "Paragraph Extension & Cohesion" },
    { phaseNumber: 4, date: "27 Nov 2026", milestone: "Precision & Abstract Fluency" },
    { phaseNumber: 5, date: "4 Dec 2026", milestone: "B2 Discourse Mastery" },
    { phaseNumber: 6, date: "10 Dec 2026", milestone: "Final Benchmark & Day 1 vs 41 Synthesis" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Weekly Review Checkpoints
        </h1>
        <p className="text-sm text-muted-foreground">
          Six structured milestones to audit your productive progress, calibrate 1–5 self-ratings,
          and synthesize your transition toward B2 competence.
        </p>
      </div>

      {/* 6 Review Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {phases?.map((phase) => {
          const review = reviewMap.get(phase.id);
          const isDone = Boolean(review?.reviewed_at);
          const checkpoint = checkpoints.find((c) => c.phaseNumber === phase.phase_number);
          const isFinal = phase.phase_number === 6;

          return (
            <Card
              key={phase.id}
              className={`flex flex-col justify-between border ${
                isDone
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : isFinal
                  ? "border-primary/40 bg-card"
                  : "bg-card"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isFinal ? "default" : "secondary"} className="font-mono text-xs">
                      Phase {phase.phase_number}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Days {phase.start_day}–{phase.end_day}
                    </span>
                  </div>

                  {isDone ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      Reviewed ✓
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </div>

                <CardTitle className="text-base mt-2 flex items-center gap-1.5">
                  {checkpoint?.milestone}
                </CardTitle>
                <CardDescription className="text-xs">
                  Checkpoint Date: <strong>{checkpoint?.date}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-muted-foreground space-y-2 flex-1">
                <p>{phase.focus}</p>

                {isDone && review && (
                  <div className="flex items-center gap-3 pt-2 border-t font-mono text-[11px] text-foreground">
                    <span>Fluency: {review.fluency_score}/5</span>
                    <span>Grammar: {review.grammar_score}/5</span>
                    <span>Confidence: {review.confidence_score}/5</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-3 border-t">
                <Button asChild size="sm" className="w-full" variant={isDone ? "outline" : "default"}>
                  <Link href={`/reviews/${phase.phase_number}`}>
                    {isDone ? "View & Update Review" : "Open Weekly Review"}
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
