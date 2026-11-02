"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitWeeklyReviewAction } from "@/app/actions/progress";
import { getSignedAudioUrlAction } from "@/app/actions/speaking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Loader2, Save, Sparkles, Volume2 } from "lucide-react";
import { Database } from "@/types/database.types";

type Phase = Database["public"]["Tables"]["phases"]["Row"];
type WeeklyReview = Database["public"]["Tables"]["weekly_reviews"]["Row"];

interface Props {
  phase: Phase;
  challengeId: string;
  existingReview: WeeklyReview | null;
  isFinalPhase: boolean;
  day1Writing: string | null;
  day41Writing: string | null;
  day1AudioPath: string | null;
  day41AudioPath: string | null;
}

export function WeeklyReviewClient({
  phase,
  challengeId,
  existingReview,
  isFinalPhase,
  day1Writing,
  day41Writing,
  day1AudioPath,
  day41AudioPath,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [reflection, setReflection] = useState<string>(
    existingReview?.reflection ?? ""
  );
  const [evidenceNotes, setEvidenceNotes] = useState<string>(
    existingReview?.evidence_notes ?? ""
  );

  const [fluency, setFluency] = useState<number>(existingReview?.fluency_score ?? 3);
  const [grammar, setGrammar] = useState<number>(existingReview?.grammar_score ?? 3);
  const [vocabulary, setVocabulary] = useState<number>(
    existingReview?.vocabulary_score ?? 3
  );
  const [organization, setOrganization] = useState<number>(
    existingReview?.organization_score ?? 3
  );
  const [confidence, setConfidence] = useState<number>(
    existingReview?.confidence_score ?? 3
  );

  // Audio signed URLs for comparison
  const [day1AudioUrl, setDay1AudioUrl] = useState<string | null>(null);
  const [day41AudioUrl, setDay41AudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<"day1" | "day41" | null>(null);

  const loadAudio = async (which: "day1" | "day41") => {
    const path = which === "day1" ? day1AudioPath : day41AudioPath;
    if (!path) return;

    setLoadingAudio(which);
    try {
      const res = await getSignedAudioUrlAction(path);
      if (res.signedUrl) {
        if (which === "day1") setDay1AudioUrl(res.signedUrl);
        else setDay41AudioUrl(res.signedUrl);
      } else {
        toast.error(res.error || "Failed to load audio");
      }
    } catch {
      toast.error("Failed to load audio");
    } finally {
      setLoadingAudio(null);
    }
  };

  const handleSubmit = () => {
    if (reflection.trim().length < 20) {
      toast.error("Please provide a reflection of at least 20 characters.");
      return;
    }

    startTransition(async () => {
      const res = await submitWeeklyReviewAction({
        phaseId: phase.id,
        challengeId,
        reflection,
        evidenceNotes,
        fluencyScore: fluency,
        grammarScore: grammar,
        vocabularyScore: vocabulary,
        organizationScore: organization,
        confidenceScore: confidence,
      });

      if (res.success) {
        toast.success("Weekly review saved successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save weekly review");
      }
    });
  };

  const ScoreSelector = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`size-8 rounded-md text-xs font-semibold font-mono transition-colors ${
              value === score
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
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/reviews">
            <ArrowLeft className="mr-1.5 size-4" /> Back to Reviews
          </Link>
        </Button>

        <Badge className="font-mono text-xs">Phase {phase.phase_number} Checkpoint</Badge>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Phase {phase.phase_number}: {phase.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          Curriculum Span: Days {phase.start_day}–{phase.end_day} • {phase.focus}
        </p>
      </div>

      {/* Day 1 vs Day 41 Grand Comparison (On Phase 6 / Final Review) */}
      {isFinalPhase && (
        <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <Sparkles className="size-4" /> Final Comparison Benchmark
            </div>
            <CardTitle className="text-xl">Day 1 vs. Day 41 Growth Audit</CardTitle>
            <CardDescription className="text-xs">
              Directly compare your starting baseline with your final Day 41 responses.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Writing Comparison */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Written Output Comparison
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4 bg-background space-y-2">
                  <Badge variant="outline" className="text-[10px]">Day 1 Baseline Writing</Badge>
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {day1Writing || "No Day 1 submitted writing found."}
                  </p>
                </div>

                <div className="border rounded-xl p-4 bg-background space-y-2 border-primary/30">
                  <Badge className="text-[10px]">Day 41 Benchmark Writing</Badge>
                  <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {day41Writing || "No Day 41 submitted writing found yet."}
                  </p>
                </div>
              </div>
            </div>

            {/* Speaking Comparison */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Speaking Audio Comparison
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4 bg-background space-y-2">
                  <Badge variant="outline" className="text-[10px]">Day 1 Baseline Audio</Badge>
                  {day1AudioUrl ? (
                    <audio src={day1AudioUrl} controls className="w-full h-9" />
                  ) : day1AudioPath ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingAudio !== null}
                      onClick={() => loadAudio("day1")}
                    >
                      {loadingAudio === "day1" ? (
                        <>
                          <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Loading audio...
                        </>
                      ) : (
                        <>
                          <Volume2 className="size-3.5 mr-1.5" /> Listen to Day 1
                        </>
                      )}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">No Day 1 audio recorded.</p>
                  )}
                </div>

                <div className="border rounded-xl p-4 bg-background space-y-2 border-primary/30">
                  <Badge className="text-[10px]">Day 41 Benchmark Audio</Badge>
                  {day41AudioUrl ? (
                    <audio src={day41AudioUrl} controls className="w-full h-9" />
                  ) : day41AudioPath ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingAudio !== null}
                      onClick={() => loadAudio("day41")}
                    >
                      {loadingAudio === "day41" ? (
                        <>
                          <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Loading audio...
                        </>
                      ) : (
                        <>
                          <Volume2 className="size-3.5 mr-1.5" /> Listen to Day 41
                        </>
                      )}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">No Day 41 audio recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Productive Self-Assessment Rubric (1–5)</CardTitle>
            {existingReview?.reviewed_at && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                <CheckCircle2 className="size-3 mr-1" />
                Reviewed {new Date(existingReview.reviewed_at).toLocaleDateString()}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Score your current productive proficiency: 1 = Basic/Frequent Hesitation, 3 = Intermediate B1, 5 = Independent B2 Mastery.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <ScoreSelector label="Fluency & Spontaneous Cadence" value={fluency} onChange={setFluency} />
          <ScoreSelector label="Grammatical Control & Accuracy" value={grammar} onChange={setGrammar} />
          <ScoreSelector label="Vocabulary Range & Agility" value={vocabulary} onChange={setVocabulary} />
          <ScoreSelector label="Discourse Organization & Linkers" value={organization} onChange={setOrganization} />
          <ScoreSelector label="Speaking & Writing Confidence" value={confidence} onChange={setConfidence} />

          <div className="space-y-2 pt-2">
            <Label htmlFor="reflection" className="text-xs font-semibold">
              Weekly Reflection Notes:
            </Label>
            <Textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What linguistic hurdles did you encounter this week? Where did your speaking or writing feel most natural?"
              rows={5}
              className="text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence" className="text-xs font-semibold">
              Evidence Notes & Targeted Next Steps:
            </Label>
            <Textarea
              id="evidence"
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              placeholder="Cite 2-3 specific phrases, discourse connectors, or grammatical patterns you aim to refine in the upcoming phase."
              rows={3}
              className="text-sm leading-relaxed"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button onClick={handleSubmit} disabled={isPending} className="bg-primary text-primary-foreground rounded-xl">
            {isPending ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Saving Weekly Review...
              </>
            ) : (
              <>
                <Save className="size-3.5 mr-1.5" />
                Save Weekly Review
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
