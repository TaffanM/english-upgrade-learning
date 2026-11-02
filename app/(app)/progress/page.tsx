import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateChallengeStats } from "@/lib/utils/progression";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreTrendsChart } from "@/features/progress/ScoreTrendsChart";
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Mic,
  PenLine,
  ShieldCheck,
} from "lucide-react";

async function ProgressContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch days, progress, submissions, self assessments, and weekly reviews
  const [
    { data: days, error: daysError },
    { data: progressList = [] },
    { data: submissions = [] },
    { data: selfAssessments = [] },
    { data: weeklyReviews = [] },
  ] = await Promise.all([
    supabase.from("challenge_days").select("*").order("day_number", { ascending: true }),
    supabase.from("daily_progress").select("*").eq("user_id", user.id),
    supabase
      .from("activity_submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "submitted"),
    supabase
      .from("self_assessments")
      .select("*, challenge_days(day_number, title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("weekly_reviews")
      .select("*, phases(phase_number, title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (daysError || !days || days.length === 0) {
    return (
      <ErrorFallback
        title="Couldn't Load Analytics"
        description="We couldn't retrieve your challenge statistics and activity volume from the database. Please check your connection and retry."
        error={daysError}
      />
    );
  }

  const stats = calculateChallengeStats(days, progressList || []);

  // Compute total words written & audio minutes
  const totalWords = (submissions || []).reduce(
    (acc, curr) => acc + (curr.word_count || 0),
    0
  );
  const totalAudioSeconds = (submissions || []).reduce(
    (acc, curr) => acc + (curr.duration_seconds || 0),
    0
  );
  const totalAudioMinutes = Math.round(totalAudioSeconds / 60);

  const completedWeeklyReviews = (weeklyReviews || []).filter((review) =>
    Boolean(review.reviewed_at)
  );

  // Format chart data combining daily self-assessments and completed weekly reviews
  const dailyChartPoints = [...(selfAssessments || [])]
    .sort((a, b) => {
      const dayA = a.challenge_days?.day_number ?? 0;
      const dayB = b.challenge_days?.day_number ?? 0;
      if (dayA !== dayB) return dayA - dayB;
      return (a.activity_type || "").localeCompare(b.activity_type || "");
    })
    .map((sa) => ({
      label: `D${sa.challenge_days?.day_number ?? "?"} ${
        sa.activity_type === "speaking" ? "Spk" : sa.activity_type === "writing" ? "Wri" : ""
      }`.trim(),
      fluency: sa.fluency_score,
      grammar: sa.grammar_score,
      vocabulary: sa.vocabulary_score,
      organization: sa.organization_score,
      confidence: sa.confidence_score,
    }));

  const weeklyChartPoints = [...completedWeeklyReviews]
    .sort((a, b) => (a.phases?.phase_number ?? 0) - (b.phases?.phase_number ?? 0))
    .map((review) => ({
      label: `Week ${review.phases?.phase_number || ""}`,
      fluency: review.fluency_score,
      grammar: review.grammar_score,
      vocabulary: review.vocabulary_score,
      organization: review.organization_score,
      confidence: review.confidence_score,
    }));

  const chartData = [...dailyChartPoints, ...weeklyChartPoints];

  const b2Criteria = [
    {
      label: "Discourse Connectivity",
      desc: "Use a wide range of cohesive connectors (furthermore, conversely, in light of) smoothly.",
    },
    {
      label: "Spontaneous Fluency",
      desc: "Produce speech with an even tempo and few noticeably long pause searches.",
    },
    {
      label: "Lexical Agility",
      desc: "Vary vocabulary and avoid repetitive baseline words (good, big, nice).",
    },
    {
      label: "Grammatical Control",
      desc: "Good control of complex sentences, conditionals, modals, and narrative tenses.",
    },
    {
      label: "Self-Correction",
      desc: "Detect and smoothly correct momentary slips without breaking communication flow.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Days Completed</span>
              <Calendar className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {stats.completedDaysCount}
              <span className="text-xs text-muted-foreground font-normal ml-1">
                / {stats.totalDays}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Progress value={stats.percentage} className="h-1.5" />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              {stats.percentage}% challenge completion
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Words Written</span>
              <PenLine className="size-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {totalWords.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-[10px] text-muted-foreground">
              Across {stats.writingCompletedCount} written attempts
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Speaking Practice</span>
              <Mic className="size-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {totalAudioMinutes} min
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-[10px] text-muted-foreground">
              Across {stats.speakingCompletedCount} oral recordings
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Weekly Reviews</span>
              <Award className="size-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {completedWeeklyReviews.length}
              <span className="text-xs text-muted-foreground font-normal ml-1">/ 6</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-[10px] text-muted-foreground">
              {selfAssessments?.length ?? 0} daily self-assessments logged
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Score Trajectory Chart */}
      <ScoreTrendsChart data={chartData} />

      {/* Daily Self-Assessments & Weekly Reviews Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="size-4 text-primary" />
                Daily Self-Assessments
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {selfAssessments?.length ?? 0} Logged
              </Badge>
            </div>
            <CardDescription className="text-xs">
              1–5 rubric ratings recorded across daily speaking and writing sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {selfAssessments && selfAssessments.length > 0 ? (
              selfAssessments.slice(-6).reverse().map((sa) => (
                <Link
                  key={sa.id}
                  href={`/challenge/${sa.challenge_days?.day_number ?? 1}`}
                  className="block p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Day {sa.challenge_days?.day_number ?? "?"}
                      </Badge>
                      <Badge
                        variant={sa.activity_type === "speaking" ? "default" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {sa.activity_type || "general"}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      Open Day <ArrowRight className="size-3" />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 font-mono text-[11px] text-foreground">
                    <span>Fluency: {sa.fluency_score ?? "-"}/5</span>
                    <span>Grammar: {sa.grammar_score ?? "-"}/5</span>
                    <span>Vocab: {sa.vocabulary_score ?? "-"}/5</span>
                    <span>Org: {sa.organization_score ?? "-"}/5</span>
                    <span>Conf: {sa.confidence_score ?? "-"}/5</span>
                  </div>
                  {sa.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {sa.notes}
                    </p>
                  )}
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No daily self-assessments logged yet. Visit any Challenge Day to record your 1–5 rubric scores.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                Weekly Phase Reviews
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {completedWeeklyReviews.length} / 6 Reviewed
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Phase milestone reflections and rubric calibration across the 6 curriculum phases.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {weeklyReviews && weeklyReviews.length > 0 ? (
              [...weeklyReviews]
                .sort((a, b) => (a.phases?.phase_number ?? 0) - (b.phases?.phase_number ?? 0))
                .map((rev) => {
                  const isReviewed = Boolean(rev.reviewed_at);
                  const phaseNum = rev.phases?.phase_number ?? 1;
                  return (
                    <Link
                      key={rev.id}
                      href={`/reviews/${phaseNum}`}
                      className="block p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            Phase {phaseNum}
                          </Badge>
                          <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
                            {rev.phases?.title}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            isReviewed
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                              : "text-[10px]"
                          }
                        >
                          {isReviewed ? "Reviewed ✓" : "Open"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2.5 font-mono text-[11px] text-foreground">
                        <span>Fluency: {rev.fluency_score ?? "-"}/5</span>
                        <span>Grammar: {rev.grammar_score ?? "-"}/5</span>
                        <span>Vocab: {rev.vocabulary_score ?? "-"}/5</span>
                        <span>Conf: {rev.confidence_score ?? "-"}/5</span>
                      </div>
                      {(rev.reflection || rev.review_prompt) && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rev.reflection || rev.review_prompt}
                        </p>
                      )}
                    </Link>
                  );
                })
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No weekly reviews initialized yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* B2 Self-Reflection Checklist (BR-014) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Target B2 Performance Competencies
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              Self-Assessment Guide
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Core CEFR B2 productive skills rubric for your personal reflection and weekly reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {b2Criteria.map((c, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border text-xs">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">{c.label}: </strong>
                <span className="text-muted-foreground">{c.desc}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-up">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Progress & Performance Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your productive English output, word count volume, speaking duration, and self-assessment trajectory.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-card border border-border/60" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-card border border-border/60" />
          </div>
        }
      >
        <ProgressContent />
      </Suspense>
    </div>
  );
}
