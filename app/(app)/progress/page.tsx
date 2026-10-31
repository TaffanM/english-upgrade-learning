import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateChallengeStats } from "@/lib/utils/progression";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreTrendsChart } from "@/features/progress/ScoreTrendsChart";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Mic,
  PenLine,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch days, progress, submissions, and weekly reviews
  const [
    { data: days = [] },
    { data: progressList = [] },
    { data: submissions = [] },
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
      .from("weekly_reviews")
      .select("*, phases(phase_number, title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const stats = calculateChallengeStats(days || [], progressList || []);

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

  // Format chart data from weekly reviews
  const chartData = (weeklyReviews || []).map((review) => ({
    label: `Week ${review.phases?.phase_number || ""}`,
    fluency: review.fluency_score,
    grammar: review.grammar_score,
    vocabulary: review.vocabulary_score,
    organization: review.organization_score,
    confidence: review.confidence_score,
  }));

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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Progress & Performance Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your productive English output, word count volume, speaking duration, and self-assessment trajectory.
        </p>
      </div>

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
              {weeklyReviews?.length ?? 0}
              <span className="text-xs text-muted-foreground font-normal ml-1">/ 6</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-[10px] text-muted-foreground">
              Milestone reflections logged
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Score Trajectory Chart */}
      <ScoreTrendsChart data={chartData} />

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
