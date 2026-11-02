"use client";

import { useState } from "react";
import { toast } from "sonner";
import { countWords } from "@/lib/utils/word-count";
import { TranscriptionRecordDTO } from "@/lib/stt/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

interface Props {
  submissionId: string;
  hasAudioRecording: boolean;
  initialTranscription: TranscriptionRecordDTO;
  onTranscriptionUpdated?: (updated: TranscriptionRecordDTO) => void;
  onContinueToAiReview?: (updated: TranscriptionRecordDTO) => void;
}

export function SpeakingTranscriptPanel({
  submissionId,
  hasAudioRecording,
  initialTranscription,
  onTranscriptionUpdated,
  onContinueToAiReview,
}: Props) {
  const [transcription, setTranscription] =
    useState<TranscriptionRecordDTO>(initialTranscription);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftText, setDraftText] = useState<string>(
    initialTranscription.activeTranscript ?? ""
  );
  const [showOriginalCompare, setShowOriginalCompare] =
    useState<boolean>(false);

  const liveWordCount = countWords(
    isEditing ? draftText : transcription.activeTranscript ?? ""
  );

  const handleTranscribe = async (forceRetranscribe = false) => {
    setIsTranscribing(true);
    try {
      const response = await fetch("/api/speaking/transcriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, forceRetranscribe }),
      });

      const payload = await response.json();
      if (!response.ok) {
        const errMsg =
          payload?.error || "Speech-to-text transcription could not complete.";
        setTranscription((prev) => ({
          ...prev,
          status: prev.activeTranscript ? prev.status : "failed",
          error: errMsg,
        }));
        toast.error(errMsg);
        return;
      }

      const updated: TranscriptionRecordDTO = payload.transcription;
      setTranscription(updated);
      setDraftText(updated.activeTranscript ?? "");
      setIsEditing(false);
      onTranscriptionUpdated?.(updated);

      toast.success(
        payload.cached
          ? "Loaded existing transcript."
          : "Audio transcribed! Review and edit any recognition mistakes before AI evaluation."
      );
    } catch {
      toast.error("Network error while requesting speech transcription.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveEditedTranscript = async () => {
    const trimmed = draftText.trim();
    if (trimmed.length < 5) {
      toast.error("Please enter at least 5 characters for your transcript.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await fetch(
        `/api/speaking/transcriptions/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editedTranscript: trimmed }),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload?.error || "Failed to save edited transcript.");
        return;
      }

      const updated: TranscriptionRecordDTO = payload.transcription;
      setTranscription(updated);
      setDraftText(updated.activeTranscript ?? "");
      setIsEditing(false);
      onTranscriptionUpdated?.(updated);
      toast.success("Corrected transcript saved!");
    } catch {
      toast.error("Network error while saving transcript.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const statusBadge = () => {
    if (isTranscribing || transcription.status === "processing") {
      return (
        <Badge variant="secondary" className="gap-1.5 text-[11px]">
          <Loader2 className="size-3 animate-spin text-primary" />
          Transcribing...
        </Badge>
      );
    }
    if (transcription.status === "edited") {
      return (
        <Badge className="bg-emerald-600 text-white gap-1 text-[11px]">
          <CheckCircle2 className="size-3" />
          Transcript Saved (Edited)
        </Badge>
      );
    }
    if (transcription.status === "completed") {
      return (
        <Badge variant="secondary" className="gap-1 text-[11px]">
          <CheckCircle2 className="size-3 text-emerald-600" />
          Transcript Available
        </Badge>
      );
    }
    if (transcription.status === "failed") {
      return (
        <Badge variant="destructive" className="gap-1 text-[11px]">
          <AlertCircle className="size-3" />
          Transcription Failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[11px]">
        Ready to Transcribe
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-border/80 rounded-2xl shadow-2xs bg-card/95">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold">
              Speaking Transcript
            </CardTitle>
          </div>
          {statusBadge()}
        </div>
        <CardDescription className="text-xs">
          Convert your spoken recording into text and correct any recognition
          mistakes before requesting AI Tutor feedback.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* State: Transcribing */}
        {isTranscribing && (
          <div className="space-y-3 p-4 rounded-xl bg-muted/40 border animate-pulse">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Loader2 className="size-4 animate-spin" />
              <span>
                Transcribing your recording on the server... This usually takes
                3–8 seconds.
              </span>
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        )}

        {/* State: Ready to transcribe (not yet transcribed & not editing) */}
        {!isTranscribing &&
          !isEditing &&
          !transcription.activeTranscript &&
          transcription.status !== "failed" && (
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground">
                  {hasAudioRecording
                    ? "Recording saved — ready to generate transcript"
                    : "No audio file attached to this attempt"}
                </p>
                <p className="text-muted-foreground">
                  {hasAudioRecording
                    ? "Click Transcribe Recording to run speech-to-text, or type your transcript manually."
                    : "Type your spoken transcript manually to enable AI Speaking Review."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasAudioRecording && (
                  <Button
                    size="sm"
                    onClick={() => handleTranscribe(false)}
                    className="rounded-xl font-semibold pressable"
                  >
                    <Wand2 className="size-3.5 mr-1.5" />
                    Transcribe Recording
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraftText("");
                    setIsEditing(true);
                  }}
                  className="rounded-xl text-xs"
                >
                  <Edit3 className="size-3.5 mr-1.5" />
                  Type Manually
                </Button>
              </div>
            </div>
          )}

        {/* State: Transcription Failed */}
        {!isTranscribing && transcription.status === "failed" && !isEditing && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-3 text-xs">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Automatic transcription failed</p>
                <p className="text-destructive/90">
                  {transcription.error ||
                    "The speech-to-text provider could not process this audio."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasAudioRecording && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTranscribe(true)}
                  className="rounded-xl text-xs"
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Retry Transcription
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setDraftText(transcription.activeTranscript ?? "");
                  setIsEditing(true);
                }}
                className="rounded-xl text-xs"
              >
                <Edit3 className="size-3.5 mr-1.5" />
                Enter Transcript Manually
              </Button>
            </div>
          </div>
        )}

        {/* State: Editing Transcript */}
        {!isTranscribing && isEditing && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Edit your transcript (fix misheard words or proper nouns):
              </span>
              <span className="font-mono">
                Words: <strong className="text-foreground">{liveWordCount}</strong>
              </span>
            </div>

            <Textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Enter or correct what you said during your speaking response..."
              rows={5}
              className="text-sm leading-relaxed bg-background rounded-xl"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {transcription.originalTranscript &&
                  draftText.trim() !== transcription.originalTranscript && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDraftText(transcription.originalTranscript ?? "")
                      }
                      className="text-xs h-8 rounded-xl"
                    >
                      <RotateCcw className="size-3.5 mr-1.5" />
                      Reset to Original ASR Transcript
                    </Button>
                  )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSavingEdit}
                  onClick={() => {
                    setDraftText(transcription.activeTranscript ?? "");
                    setIsEditing(false);
                  }}
                  className="h-8 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSavingEdit || draftText.trim().length < 5}
                  onClick={handleSaveEditedTranscript}
                  className="h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5 mr-1.5" />
                      Save Transcript
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* State: Transcript Available / Saved (Read Mode) */}
        {!isTranscribing && !isEditing && transcription.activeTranscript && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-background border text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {transcription.activeTranscript}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Words:{" "}
                  <strong className="font-mono text-foreground">
                    {transcription.wordCount}
                  </strong>
                </span>
                {transcription.model && (
                  <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">
                    ASR: {transcription.model}
                  </span>
                )}
                {transcription.originalTranscript &&
                  transcription.editedTranscript &&
                  transcription.originalTranscript !==
                    transcription.editedTranscript && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowOriginalCompare(!showOriginalCompare)
                      }
                      className="underline hover:text-foreground"
                    >
                      {showOriginalCompare
                        ? "Hide original ASR output"
                        : "Compare with original ASR output"}
                    </button>
                  )}
              </div>
            </div>

            {showOriginalCompare && transcription.originalTranscript && (
              <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
                <span className="font-semibold text-muted-foreground block">
                  Original Unedited ASR Output:
                </span>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {transcription.originalTranscript}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer Actions when Transcript is Available / Saved */}
      {!isTranscribing && !isEditing && transcription.activeTranscript && (
        <CardFooter className="border-t pt-3 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDraftText(transcription.activeTranscript ?? "");
                setIsEditing(true);
              }}
              className="h-8 text-xs rounded-xl"
            >
              <Edit3 className="size-3.5 mr-1.5" />
              Edit Transcript
            </Button>

            {hasAudioRecording && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleTranscribe(true)}
                className="h-8 text-xs rounded-xl text-muted-foreground"
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Retry Transcription
              </Button>
            )}
          </div>

          {onContinueToAiReview && (
            <Button
              type="button"
              size="sm"
              onClick={() => onContinueToAiReview(transcription)}
              className="h-8 text-xs rounded-xl font-semibold pressable"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              Continue to AI Review
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
