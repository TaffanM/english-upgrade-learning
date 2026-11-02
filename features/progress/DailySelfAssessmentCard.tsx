"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSelfAssessmentAction } from "@/app/actions/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ClipboardCheck, Loader2, Mic, PenLine, Save } from "lucide-react";
import { Database } from "@/types/database.types";

type SelfAssessmentRow = Database["public"]["Tables"]["self_assessments"]["Row"];

interface Props {
  challengeDayId: string;
  dayNumber: number;
  initialAssessments: SelfAssessmentRow[];
}

export function DailySelfAssessmentCard({
  challengeDayId,
  dayNumber,
  initialAssessments,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"speaking" | "writing">("speaking");

  const speakingAssessment =
    initialAssessments.find((a) => a.activity_type === "speaking") ?? null;
  const writingAssessment =
    initialAssessments.find((a) => a.activity_type === "writing") ?? null;

  const [scores, setScores] = useState<{
    speaking: {
      fluency: number;
      grammar: number;
      vocabulary: number;
      organization: number;
      confidence: number;
      notes: string;
    };
    writing: {
      fluency: number;
      grammar: number;
      vocabulary: number;
      organization: number;
      confidence: number;
      notes: string;
    };
  }>({
    speaking: {
      fluency: speakingAssessment?.fluency_score ?? 3,
      grammar: speakingAssessment?.grammar_score ?? 3,
      vocabulary: speakingAssessment?.vocabulary_score ?? 3,
      organization: speakingAssessment?.organization_score ?? 3,
      confidence: speakingAssessment?.confidence_score ?? 3,
      notes: speakingAssessment?.notes ?? "",
    },
    writing: {
      fluency: writingAssessment?.fluency_score ?? 3,
      grammar: writingAssessment?.grammar_score ?? 3,
      vocabulary: writingAssessment?.vocabulary_score ?? 3,
      organization: writingAssessment?.organization_score ?? 3,
      confidence: writingAssessment?.confidence_score ?? 3,
      notes: writingAssessment?.notes ?? "",
    },
  });

  const current = scores[activeTab];
  const existingForTab =
    activeTab === "speaking" ? speakingAssessment : writingAssessment;

  const updateCurrent = (
    patch: Partial<{
      fluency: number;
      grammar: number;
      vocabulary: number;
      organization: number;
      confidence: number;
      notes: string;
    }>
  ) => {
    setScores((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...patch,
      },
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveSelfAssessmentAction({
        challengeDayId,
        activityType: activeTab,
        fluencyScore: current.fluency,
        grammarScore: current.grammar,
        vocabularyScore: current.vocabulary,
        organizationScore: current.organization,
        confidenceScore: current.confidence,
        notes: current.notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          `Day ${dayNumber} ${activeTab} self-assessment saved!`
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save self-assessment");
      }
    });
  };

  const renderScoreRow = (
    label: string,
    field: "fluency" | "grammar" | "vocabulary" | "organization" | "confidence"
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => updateCurrent({ [field]: score })}
            className={`size-8 rounded-md text-xs font-semibold font-mono transition-colors ${
              current[field] === score
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-background border hover:bg-muted text-muted-foreground"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" />
            <CardTitle className="text-base">
              Day {dayNumber} Self-Assessment Rubric (1–5)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={speakingAssessment ? "default" : "outline"}
              className="text-[10px]"
            >
              Speaking {speakingAssessment ? "Logged ✓" : "Pending"}
            </Badge>
            <Badge
              variant={writingAssessment ? "default" : "outline"}
              className="text-[10px]"
            >
              Writing {writingAssessment ? "Logged ✓" : "Pending"}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          Calibrate your B1→B2 self-ratings for today&apos;s speaking and writing sessions (1 = Frequent Hesitation, 3 = Solid B1, 5 = Confident B2).
        </CardDescription>

        {/* Activity Type Selector */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "speaking" ? "default" : "outline"}
            onClick={() => setActiveTab("speaking")}
            className="text-xs h-8"
          >
            <Mic className="size-3.5 mr-1.5" />
            Speaking Assessment
            {speakingAssessment && (
              <CheckCircle2 className="size-3 ml-1.5 text-emerald-400" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "writing" ? "default" : "outline"}
            onClick={() => setActiveTab("writing")}
            className="text-xs h-8"
          >
            <PenLine className="size-3.5 mr-1.5" />
            Writing Assessment
            {writingAssessment && (
              <CheckCircle2 className="size-3 ml-1.5 text-emerald-400" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {renderScoreRow(
          activeTab === "speaking"
            ? "Fluency & Spontaneous Pacing"
            : "Flow & Sentence Variety",
          "fluency"
        )}
        {renderScoreRow("Grammatical Control & Tense Accuracy", "grammar")}
        {renderScoreRow("Vocabulary Range & Precision", "vocabulary")}
        {renderScoreRow("Discourse Organization & Cohesive Linkers", "organization")}
        {renderScoreRow(
          activeTab === "speaking"
            ? "Speaking Poise & Delivery Confidence"
            : "Writing Clarity & Argument Confidence",
          "confidence"
        )}

        <div className="space-y-1.5 pt-2">
          <Label htmlFor={`self-assessment-notes-${activeTab}`} className="text-xs font-semibold">
            Self-Reflection Notes ({activeTab === "speaking" ? "Speaking" : "Writing"}):
          </Label>
          <Textarea
            id={`self-assessment-notes-${activeTab}`}
            value={current.notes}
            onChange={(e) => updateCurrent({ notes: e.target.value })}
            placeholder={
              activeTab === "speaking"
                ? "Note any hesitation triggers, filler words, or strong phrases you used while speaking today..."
                : "Note any target structures, connectors, or grammar adjustments you focused on in today's writing..."
            }
            rows={3}
            className="text-xs leading-relaxed"
          />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <span className="text-[11px] text-muted-foreground">
          {existingForTab
            ? `Last updated: ${new Date(existingForTab.updated_at).toLocaleDateString()}`
            : `Not yet logged for Day ${dayNumber} ${activeTab}`}
        </span>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-3.5 mr-1.5" />
              {existingForTab ? "Update Assessment" : "Save Assessment"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
