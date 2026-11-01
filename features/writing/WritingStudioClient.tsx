"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { countWords, getWordCountStatus } from "@/lib/utils/word-count";
import { saveWritingDraftAction, submitWritingAttemptAction } from "@/app/actions/writing";
import { toggleChecklistItemAction } from "@/app/actions/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  History,
  Info,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { Database } from "@/types/database.types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];
type Submission = Database["public"]["Tables"]["activity_submissions"]["Row"];

interface Props {
  dayNumber: number;
  activity: Activity;
  checklistItems: ChecklistItem[];
  activeDraft: Submission | null;
  submittedAttempts: Submission[];
  completedChecklistIds: string[];
}

export function WritingStudioClient({
  dayNumber,
  activity,
  checklistItems,
  activeDraft,
  submittedAttempts,
  completedChecklistIds,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Content state
  const [content, setContent] = useState<string>(
    activeDraft?.text_content || (submittedAttempts[0]?.text_content ?? "")
  );
  const [saveStatus, setSaveStatus] = useState<string>(
    activeDraft ? "Draft loaded" : submittedAttempts.length ? "Submitted attempt loaded" : "Ready"
  );
  const [lastSavedContent, setLastSavedContent] = useState<string>(content);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // Timer state (15 minutes = 900 seconds)
  const [timerSeconds, setTimerSeconds] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Checklist state
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(completedChecklistIds)
  );

  // Submit modal state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Derived word counts
  const currentWordCount = countWords(content);
  const wordStatus = getWordCountStatus(currentWordCount, activity.target_word_count);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      toast.info("15-minute writing session timer reached!");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Format timer
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-save debouncing
  useEffect(() => {
    if (content === lastSavedContent) return;

    setSaveStatus("Unsaved changes...");
    const timeout = setTimeout(async () => {
      setSaveStatus("Saving draft...");
      const res = await saveWritingDraftAction({
        activityId: activity.id,
        textContent: content,
      });

      if (res.success) {
        setLastSavedContent(content);
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSaveStatus(`Draft saved at ${timeStr}`);
      } else {
        setSaveStatus("Failed to save draft");
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [content, lastSavedContent, activity.id]);

  // Manual save draft handler
  const handleManualSave = async () => {
    setIsSavingDraft(true);
    setSaveStatus("Saving draft...");
    try {
      const res = await saveWritingDraftAction({
        activityId: activity.id,
        textContent: content,
      });

      if (res.success) {
        setLastSavedContent(content);
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSaveStatus(`Draft saved at ${timeStr}`);
        toast.success("Draft saved successfully");
      } else {
        setSaveStatus("Error saving draft");
        toast.error(res.error || "Failed to save draft");
      }
    } catch {
      setSaveStatus("Error saving draft");
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit attempt handler
  const handleConfirmSubmit = () => {
    if (currentWordCount < 10) {
      toast.error("Writing response is too short to submit.");
      return;
    }

    startTransition(async () => {
      const res = await submitWritingAttemptAction({
        activityId: activity.id,
        textContent: content,
        dayNumber,
      });

      setShowConfirmModal(false);

      if (res.success) {
        toast.success(
          res.isDayComplete
            ? "Writing submitted! Day " + dayNumber + " is fully complete! 🎉"
            : "Writing submitted successfully! Complete Speaking to finish the day."
        );
        router.refresh();
      } else {
        toast.error(res.error || "Submission failed");
      }
    });
  };

  // Toggle checklist item
  const handleChecklistToggle = async (itemId: string, checked: boolean) => {
    const updated = new Set(checkedIds);
    if (checked) {
      updated.add(itemId);
    } else {
      updated.delete(itemId);
    }
    setCheckedIds(updated);

    const res = await toggleChecklistItemAction(itemId, checked);
    if (!res.success) {
      // Revert if server update failed
      setCheckedIds((prev) => {
        const reverted = new Set(prev);
        if (checked) reverted.delete(itemId);
        else reverted.add(itemId);
        return reverted;
      });
      toast.error(res.error || "Failed to update checklist item");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="rounded-xl pressable">
          <Link href={`/challenge/${dayNumber}`}>
            <ArrowLeft className="mr-1.5 size-4" /> Back to Day {dayNumber}
          </Link>
        </Button>

        {/* 15-Minute Session Timer */}
        <div className={`flex items-center gap-2 bg-card border rounded-2xl px-3.5 py-1.5 shadow-2xs transition-all ${isTimerRunning ? "border-primary/50 animate-breathe" : "border-border/80"}`}>
          <Clock className={`size-4 ${isTimerRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          <span className="font-mono font-bold text-sm">
            {formatTime(timerSeconds)}
          </span>
          <div className="flex items-center gap-1 border-l border-border/80 pl-2 ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg pressable"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? "Pause Timer" : "Start 15m Timer"}
            >
              {isTimerRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg pressable"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(15 * 60);
              }}
              title="Reset Timer"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pedagogical Banner (FR-039) */}
      <div className="bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed animate-fade-up stagger-1">
        <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <strong>Authentic Practice Rule:</strong> Draft directly in English without using an external translator or automated grammar fixer. Practice retrieving your active vocabulary first. Use tools and checklists only after your first attempt.
        </div>
      </div>

      {/* Task Prompt Card */}
      <Card className="border-2 border-emerald-200/80 dark:border-emerald-900/60 rounded-3xl card-hover-lift animate-fade-up stagger-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="writing" className="font-mono text-xs">
              Day {dayNumber} • Writing Task
            </Badge>
            {activity.target_word_count && (
              <Badge variant="cute" className="font-mono text-xs">
                Target: {activity.target_word_count} words
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl font-bold mt-1">{activity.prompt}</CardTitle>
          {activity.instructions && (
            <CardDescription className="text-xs text-foreground/80 mt-1">
              <strong>Writing Action:</strong> {activity.instructions}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Main Workspace Tabs */}
      <Tabs defaultValue="editor" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="editor">Writing Editor</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <History className="size-3.5" />
              Attempts ({submittedAttempts.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            {saveStatus.includes("Saving") && (
              <Loader2 className="size-3 animate-spin text-primary shrink-0" />
            )}
            <span>{saveStatus}</span>
          </div>
        </div>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4 mt-0">
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin writing your response in English here... (No translators needed)"
              className="min-h-[320px] font-sans text-base leading-relaxed p-4 resize-y bg-background"
              spellCheck
            />

            {/* Word Count & Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground p-2 bg-muted/40 rounded-lg border">
              <div className="flex items-center gap-4">
                <span>
                  Words:{" "}
                  <strong className="text-foreground text-sm font-mono">
                    {currentWordCount}
                  </strong>{" "}
                  {activity.target_word_count && `/ ${activity.target_word_count}`}
                </span>
                {activity.target_word_count && (
                  <span
                    className={
                      wordStatus.isAcceptable ? "text-emerald-600 font-medium" : "text-amber-600"
                    }
                  >
                    ({wordStatus.difference >= 0 ? `+${wordStatus.difference}` : wordStatus.difference} words)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSave}
                  disabled={isPending || isSavingDraft}
                  className="h-8 text-xs rounded-xl"
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5 mr-1.5" /> Save Draft
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isPending || currentWordCount < 10}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="size-3.5 mr-1.5" /> Submit Writing Attempt
                </Button>
              </div>
            </div>
          </div>

          {/* Proofreading Checklist */}
          {checklistItems.length > 0 && (
            <Card className="bg-card">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Proofreading Checklist for Day {dayNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={checkedIds.has(item.id)}
                      onCheckedChange={(checked) =>
                        handleChecklistToggle(item.id, Boolean(checked))
                      }
                      className="mt-0.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-0">
          {submittedAttempts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm">
              No submitted attempts yet. Complete your first draft and click &quot;Submit Writing Attempt&quot;.
            </Card>
          ) : (
            <div className="space-y-4">
              {submittedAttempts.map((attempt) => (
                <Card key={attempt.id} className="border shadow-2xs">
                  <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          Attempt #{attempt.attempt_number}
                        </Badge>
                        <span className="text-muted-foreground">
                          {attempt.submitted_at
                            ? new Date(attempt.submitted_at).toLocaleString()
                            : ""}
                        </span>
                      </div>
                      <span className="font-mono font-medium">
                        {attempt.word_count ?? 0} words
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {attempt.text_content}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Writing Attempt</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm your submission for Day {dayNumber}. Submitting will mark your Writing activity as completed and record this attempt in your history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Current Word Count:</span>
              <strong className="font-mono text-sm">{currentWordCount} words</strong>
            </div>
            {activity.target_word_count && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Target Word Count:</span>
                <span className="font-mono">{activity.target_word_count} words</span>
              </div>
            )}
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              You can always submit revised attempts later without losing this attempt.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={isPending}
            >
              Continue Editing
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSubmit}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm & Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
