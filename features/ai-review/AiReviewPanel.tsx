"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AiCorrectionCategory,
  AiReviewRecordDTO,
  AiReviewType,
} from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Wrench,
} from "lucide-react";

interface Props {
  submissionId: string;
  reviewType: AiReviewType;
  initialReview: AiReviewRecordDTO | null;
  disabled?: boolean;
  disabledReason?: string;
  onReviewGenerated?: (review: AiReviewRecordDTO) => void;
}

const CATEGORY_LABELS: Record<AiCorrectionCategory, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  coherence: "Coherence",
  style: "Style",
  word_choice: "Word Choice",
  sentence_structure: "Sentence Structure",
  filler_repetition: "Filler / Repetition",
};

function getIndicativeBandLabel(score: number): {
  label: string;
  colorClass: string;
} {
  if (score >= 85) {
    return {
      label: "Strong B2 Benchmark",
      colorClass:
        "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30",
    };
  }
  if (score >= 72) {
    return {
      label: "Emerging B2 (B1+)",
      colorClass:
        "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30",
    };
  }
  return {
    label: "Developing B1 Foundation",
    colorClass:
      "bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/30",
  };
}

export function AiReviewPanel({
  submissionId,
  reviewType,
  initialReview,
  disabled = false,
  disabledReason,
  onReviewGenerated,
}: Props) {
  const [review, setReview] = useState<AiReviewRecordDTO | null>(initialReview);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    code?: string;
  } | null>(null);

  const handleRequestReview = async (forceReReview = false) => {
    if (disabled) {
      toast.info(disabledReason || "Complete the prerequisite step first.");
      return;
    }

    setIsGenerating(true);
    setErrorState(null);

    try {
      const endpoint =
        reviewType === "writing"
          ? "/api/ai/reviews/writing"
          : "/api/ai/reviews/speaking";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, forceReReview }),
      });

      const payload = await response.json();
      if (!response.ok) {
        let message = "Could not generate AI Tutor feedback.";
        if (typeof payload?.error === "string") {
          message = payload.error;
        } else if (typeof payload?.error?.message === "string") {
          message = payload.error.message;
        } else if (
          payload?.error?.code === "FUNCTION_INVOCATION_TIMEOUT" ||
          response.status === 504
        ) {
          message =
            "The AI Tutor request timed out upstream. Please try again.";
        } else if (typeof payload?.message === "string") {
          message = payload.message;
        }

        const code =
          payload?.code ||
          (typeof payload?.error === "object"
            ? payload?.error?.code
            : undefined) ||
          (response.status === 504 ? "PROVIDER_TIMEOUT" : "API_ERROR");

        setErrorState({ message, code });
        toast.error(message);
        return;
      }

      const savedReview: AiReviewRecordDTO = payload.review;
      setReview(savedReview);
      onReviewGenerated?.(savedReview);

      toast.success(
        payload.cached
          ? "Loaded saved AI Tutor feedback."
          : forceReReview
            ? "Updated AI Tutor feedback generated!"
            : "AI Tutor feedback is ready!"
      );
    } catch {
      const msg = "Network error while requesting AI Tutor feedback.";
      setErrorState({ message: msg, code: "NETWORK_ERROR" });
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // 1. Generating / Loading State
  if (isGenerating) {
    return (
      <Card className="border-2 border-primary/30 rounded-2xl shadow-xs bg-card animate-fade-up">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
            <Loader2 className="size-4 animate-spin" />
            <span>
              AI Tutor is evaluating your{" "}
              {reviewType === "writing" ? "writing" : "speaking transcript"}...
            </span>
          </div>
          <CardDescription className="text-xs">
            Checking grammar accuracy, B1→B2 vocabulary range, discourse
            coherence, and daily task objectives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. Not Reviewed Yet (or Failed with no prior review)
  if (!review) {
    return (
      <Card className="border-2 border-border/80 rounded-2xl shadow-2xs bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                AI English Tutor Review
              </CardTitle>
            </div>
            <Badge variant="cute" className="text-[10px]">
              B1 → B2 Curriculum Evaluator
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {reviewType === "writing"
              ? "Get targeted feedback on grammar, B2 vocabulary upgrades, cohesion, and sentence corrections."
              : "Evaluate your speaking transcript for grammatical control, spoken coherence, vocabulary range, and filler patterns."}
          </CardDescription>
        </CardHeader>

        {errorState && (
          <CardContent className="pt-0 pb-3">
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs flex items-start gap-2.5 text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {errorState.code === "QUOTA_EXHAUSTED" ||
                  errorState.code === "RATE_LIMITED"
                    ? "Rate Limit / Quota Reached"
                    : errorState.code === "TRANSCRIPT_MISSING"
                      ? "Speaking Transcript Required"
                      : "Evaluation Could Not Be Completed"}
                </p>
                <p className="text-destructive/90">{errorState.message}</p>
              </div>
            </div>
          </CardContent>
        )}

        <CardFooter className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t bg-muted/20">
          <span className="text-[11px] text-muted-foreground">
            {disabled
              ? disabledReason ||
                "Generate or enter a speaking transcript above to unlock AI feedback."
              : reviewType === "speaking"
                ? "Evaluates transcript text only (does not score audio pronunciation or accent)."
                : "Evaluates your submitted attempt against today's B1→B2 target."}
          </span>

          <Button
            size="sm"
            disabled={disabled}
            onClick={() => handleRequestReview(false)}
            className="rounded-xl font-semibold pressable shrink-0"
          >
            <Sparkles className="size-3.5 mr-1.5" />
            {errorState ? "Retry AI Review" : "Request AI Tutor Feedback ✨"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // 3. Review Completed State
  const band = getIndicativeBandLabel(review.overallScore);

  return (
    <Card className="border-2 border-primary/30 rounded-3xl shadow-xs bg-card overflow-hidden animate-fade-up">
      {/* Top Assessment Header */}
      <CardHeader className="bg-gradient-to-r from-primary/10 via-amber-500/5 to-transparent border-b pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base font-extrabold">
                AI Tutor Evaluation
              </CardTitle>
              <Badge variant="outline" className={`text-[10px] ${band.colorClass}`}>
                {band.label}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                v{review.reviewVersion}
              </Badge>
            </div>
            <CardDescription className="text-[11px]">
              {reviewType === "speaking"
                ? "Transcript-based discourse evaluation • Does not measure audio pronunciation or intonation"
                : "Curriculum-aligned writing evaluation • Indicative practice feedback (not official CEFR certification)"}
            </CardDescription>
          </div>

          {/* Overall Score Pill */}
          <div className="flex items-center gap-2.5 bg-background border-2 border-primary/30 rounded-2xl px-3.5 py-2 shadow-2xs">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                Overall Score
              </span>
              <span className="text-xl font-extrabold font-mono text-primary">
                {review.overallScore}
                <span className="text-xs text-muted-foreground font-normal">
                  /100
                </span>
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {errorState && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs flex items-start gap-2 text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorState.message}</span>
          </div>
        )}

        {/* Overall Feedback Narrative */}
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/70 text-sm leading-relaxed text-foreground">
          {review.overallFeedback}
        </div>

        {/* 4-Dimension Score Breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Competence Breakdown (0–100)
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Grammar Accuracy", value: review.scores.grammar },
              { label: "Vocabulary Range", value: review.scores.vocabulary },
              { label: "Coherence & Flow", value: review.scores.coherence },
              {
                label: "Task Achievement",
                value: review.scores.taskAchievement,
              },
            ].map((dim) => (
              <div
                key={dim.label}
                className="p-3 rounded-xl border bg-background/70 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {dim.label}
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {dim.value}/100
                  </span>
                </div>
                <Progress value={dim.value} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Areas for Improvement */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="size-4" />
              What You Did Well
            </h4>
            <ul className="space-y-2 text-xs leading-relaxed text-foreground/90">
              {review.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="size-4" />
              Areas for Improvement
            </h4>
            <ul className="space-y-2 text-xs leading-relaxed text-foreground/90">
              {review.improvements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sentence Corrections */}
        {review.corrections.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wrench className="size-3.5 text-primary" />
              Sentence Corrections & B2 Upgrades ({review.corrections.length})
            </h4>
            <div className="space-y-2.5">
              {review.corrections.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border bg-background space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 pt-0.5">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 mb-0.5">
                        Original
                      </span>
                      <span className="line-through decoration-rose-500/60">
                        {item.original}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 mb-0.5">
                        Suggested Upgrade <ArrowRight className="inline size-3" />
                      </span>
                      <span className="font-medium">{item.corrected}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed pt-0.5">
                    <strong className="text-foreground/85">Why:</strong>{" "}
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Practice */}
        {review.recommendedPractice.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-primary" />
              Targeted Follow-Up Practice
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {review.recommendedPractice.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 space-y-1 text-xs"
                >
                  <p className="font-bold text-foreground">{item.skill}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer with Model Metadata & Re-evaluate Button */}
      <CardFooter className="border-t bg-muted/20 py-3 px-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-mono text-[11px]">
          Model: {review.modelName} •{" "}
          {new Date(review.updatedAt).toLocaleString()}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isGenerating}
          onClick={() => handleRequestReview(true)}
          className="h-8 text-xs rounded-xl"
        >
          <RefreshCw className="size-3.5 mr-1.5" />
          Re-evaluate
        </Button>
      </CardFooter>
    </Card>
  );
}
