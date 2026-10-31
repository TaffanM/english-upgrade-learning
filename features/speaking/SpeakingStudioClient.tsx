"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  submitSpeakingAttemptAction,
  submitAlternativeSpeakingAction,
  getSignedAudioUrlAction,
} from "@/app/actions/speaking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  History,
  Info,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Send,
  Square,
  Volume2,
} from "lucide-react";
import { Database } from "@/types/database.types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Submission = Database["public"]["Tables"]["activity_submissions"]["Row"];

interface Props {
  dayNumber: number;
  challengeId: string;
  userId: string;
  activity: Activity;
  submittedAttempts: Submission[];
}

export function SpeakingStudioClient({
  dayNumber,
  challengeId,
  userId,
  activity,
  submittedAttempts,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Recorder states: 'idle' | 'recording' | 'paused' | 'reviewing'
  const [recorderState, setRecorderState] = useState<
    "idle" | "recording" | "paused" | "reviewing"
  >("idle");
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Alternative completion modal
  const [showAltModal, setShowAltModal] = useState<boolean>(false);
  const [altNotes, setAltNotes] = useState<string>("");

  // History audio playback URL cache
  const [playbackUrls, setPlaybackUrls] = useState<Record<string, string>>({});
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);

  // Timer interval for recording
  useEffect(() => {
    if (recorderState === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recorderState]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioDuration(recordingSeconds);
        setRecorderState("reviewing");

        // Stop media stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // Slice data every 250ms
      setRecordingSeconds(0);
      setRecorderState("recording");
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      toast.error(
        "Could not access microphone. You can use the alternative completion path below."
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recorderState === "recording") {
      mediaRecorderRef.current.pause();
      setRecorderState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recorderState === "paused") {
      mediaRecorderRef.current.resume();
      setRecorderState("recording");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (recorderState === "recording" || recorderState === "paused")
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setRecorderState("idle");
  };

  const formatSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Submit audio recording
  const handleSubmitRecording = async () => {
    if (!audioBlob) return;

    startTransition(async () => {
      try {
        toast.info("Uploading audio recording...");

        const supabase = createClient();
        const submissionId = crypto.randomUUID();
        const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
        const storagePath = `${userId}/${challengeId}/${dayNumber}/${submissionId}.${extension}`;

        // Upload to private storage
        const { error: uploadError } = await supabase.storage
          .from("speaking-recordings")
          .upload(storagePath, audioBlob, {
            contentType: audioBlob.type,
            upsert: false,
          });

        if (uploadError) {
          toast.error("Upload failed: " + uploadError.message);
          return;
        }

        // Call server action to record metadata and update daily progress
        const res = await submitSpeakingAttemptAction({
          activityId: activity.id,
          dayNumber,
          storagePath,
          durationSeconds: audioDuration || recordingSeconds,
          fileSizeBytes: audioBlob.size,
          mimeType: audioBlob.type,
        });

        if (res.success) {
          toast.success(
            res.isDayComplete
              ? `Speaking submitted! Day ${dayNumber} is fully complete! 🎉`
              : "Speaking recording submitted successfully!"
          );
          discardRecording();
          router.refresh();
        } else {
          toast.error(res.error || "Failed to submit recording record");
        }
      } catch (err: unknown) {
        toast.error("An unexpected error occurred during submission");
      }
    });
  };

  // Submit alternative completion
  const handleAlternativeSubmit = () => {
    if (altNotes.trim().length < 10) {
      toast.error("Please provide a reflection note about your speaking practice.");
      return;
    }

    startTransition(async () => {
      const res = await submitAlternativeSpeakingAction({
        activityId: activity.id,
        dayNumber,
        notes: altNotes,
      });

      setShowAltModal(false);

      if (res.success) {
        toast.success(
          res.isDayComplete
            ? `Speaking completed! Day ${dayNumber} is fully complete! 🎉`
            : "Speaking activity marked complete (no audio saved)."
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to submit alternative completion");
      }
    });
  };

  // Load signed URL for historical recording
  const loadHistoricalAudio = async (submissionId: string, storagePath: string) => {
    if (playbackUrls[submissionId]) return;

    setLoadingAudioId(submissionId);
    const res = await getSignedAudioUrlAction(storagePath);
    setLoadingAudioId(null);

    if (res.signedUrl) {
      setPlaybackUrls((prev) => ({
        ...prev,
        [submissionId]: res.signedUrl,
      }));
    } else {
      toast.error(res.error || "Could not retrieve audio playback URL");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="rounded-xl pressable">
          <Link href={`/challenge/${dayNumber}`}>
            <ArrowLeft className="mr-1.5 size-4" /> Back to Day {dayNumber}
          </Link>
        </Button>

        <Badge variant="speaking" className="font-mono text-xs">
          Target Duration: 15 minutes
        </Badge>
      </div>

      {/* Speaking Prompt Card */}
      <Card className="border-2 border-blue-200/80 dark:border-blue-900/60 rounded-3xl card-hover-lift">
        <CardHeader>
          <Badge variant="speaking" className="w-fit text-xs font-mono mb-1 animate-scale-in">
            Day {dayNumber} • Speaking Activity
          </Badge>
          <CardTitle className="text-xl font-bold">{activity.prompt}</CardTitle>
          {activity.instructions && (
            <CardDescription className="text-xs text-foreground/80 mt-1">
              <strong>Routine Instruction:</strong> {activity.instructions}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Tabs: Recorder & Attempts */}
      <Tabs defaultValue="recorder" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="recorder" className="rounded-lg">Speaking Studio</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 rounded-lg">
            <History className="size-3.5" />
            Saved Recordings ({submittedAttempts.length})
          </TabsTrigger>
        </TabsList>

        {/* Studio Tab */}
        <TabsContent value="recorder" className="space-y-6 mt-0">
          {/* Recorder Interface Card */}
          <Card className="border-2 border-border/80 rounded-3xl shadow-xs overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
              {/* Duration Counter */}
              <div className="font-mono text-5xl font-black tracking-tight text-foreground transition-all">
                {formatSeconds(recordingSeconds)}
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-xs">
                {recorderState === "recording" && (
                  <span className="flex items-center gap-1.5 text-red-500 font-bold animate-pulse">
                    <span className="size-2.5 rounded-full bg-red-500 inline-block animate-ping" /> Recording live audio...
                  </span>
                )}
                {recorderState === "paused" && (
                  <span className="text-amber-500 font-bold">Recording paused</span>
                )}
                {recorderState === "reviewing" && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Recording ready for playback review
                  </span>
                )}
                {recorderState === "idle" && (
                  <span className="text-muted-foreground">
                    Click &quot;Start Recording&quot; when ready. Speak continuously without reading from a script.
                  </span>
                )}
              </div>

              {/* Controls depending on state */}
              {recorderState === "idle" && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="rounded-full size-22 p-0 bg-blue-600 hover:bg-blue-700 shadow-md pressable animate-breathe"
                >
                  <Mic className="size-9 text-white" />
                </Button>
              )}

              {(recorderState === "recording" || recorderState === "paused") && (
                <div className="flex items-center gap-5 animate-scale-in">
                  {recorderState === "recording" ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-14 rounded-full pressable"
                      onClick={pauseRecording}
                      title="Pause"
                    >
                      <Pause className="size-6" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-14 rounded-full pressable"
                      onClick={resumeRecording}
                      title="Resume"
                    >
                      <Play className="size-6 ml-0.5" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    className="size-16 rounded-full bg-red-600 hover:bg-red-700 shadow-md pressable animate-pulse-recording"
                    onClick={stopRecording}
                    title="Stop & Review"
                  >
                    <Square className="size-7 fill-white text-white" />
                  </Button>
                </div>
              )}

              {/* Reviewing State: Audio Player & Submit */}
              {recorderState === "reviewing" && audioUrl && (
                <div className="w-full max-w-md space-y-4 animate-scale-in">
                  <div className="bg-secondary/60 p-4 rounded-2xl border flex flex-col items-center gap-3">
                    <audio src={audioUrl} controls className="w-full h-10" />
                    <span className="text-xs text-muted-foreground font-mono">
                      Duration: {formatSeconds(audioDuration)}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={discardRecording}
                      disabled={isPending}
                      className="rounded-xl pressable"
                    >
                      <RotateCcw className="size-3.5 mr-1.5" /> Re-record
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSubmitRecording}
                      disabled={isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl pressable shadow-xs font-semibold"
                    >
                      <Send className="size-3.5 mr-1.5" />
                      {isPending ? "Uploading..." : "Submit Recording 🚀"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/20 border-t py-3 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
              <span className="flex items-center gap-1.5">
                <Info className="size-3.5 text-blue-500" />
                Recordings are stored privately in encrypted Supabase Storage.
              </span>
              <button
                type="button"
                onClick={() => setShowAltModal(true)}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Microphone not working? Use fallback path
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-0">
          {submittedAttempts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm">
              No saved recordings yet. Record and submit your first oral response.
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
                      {attempt.duration_seconds && (
                        <span className="font-mono font-medium">
                          {formatSeconds(attempt.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 text-xs">
                    {attempt.storage_path ? (
                      <div className="space-y-2">
                        {playbackUrls[attempt.id] ? (
                          <audio
                            src={playbackUrls[attempt.id]}
                            controls
                            className="w-full h-9"
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loadingAudioId === attempt.id}
                            onClick={() =>
                              loadHistoricalAudio(attempt.id, attempt.storage_path!)
                            }
                          >
                            <Volume2 className="size-3.5 mr-1.5" />
                            {loadingAudioId === attempt.id
                              ? "Loading audio..."
                              : "Play Recording"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {attempt.text_content || "Marked completed via alternative path."}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Alternative Completion Dialog (FR-056 / BR-010) */}
      <Dialog open={showAltModal} onOpenChange={setShowAltModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alternative Speaking Completion</DialogTitle>
            <DialogDescription className="text-xs">
              If your microphone is unsupported or unavailable, you can complete this Speaking activity by practicing offline and providing self-reflection notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 rounded-md">
              <strong className="block mb-0.5">Disclaimer:</strong>
              This will mark the Speaking activity as complete, but will explicitly record that no audio evidence was saved.
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">
                Speaking Self-Reflection Notes:
              </label>
              <Textarea
                value={altNotes}
                onChange={(e) => setAltNotes(e.target.value)}
                placeholder="Describe your offline speaking session: What points did you cover? Did you notice pauses or repetitive vocabulary?"
                rows={4}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAltModal(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAlternativeSubmit}
              disabled={isPending || altNotes.trim().length < 10}
            >
              {isPending ? "Submitting..." : "Submit Alternative Completion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
