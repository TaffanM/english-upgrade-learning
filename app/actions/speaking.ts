"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  submitSpeakingSchema,
  submitAlternativeSpeakingSchema,
} from "@/lib/validations";

export async function submitSpeakingAttemptAction(input: {
  activityId: string;
  dayNumber: number;
  storagePath: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  mimeType?: string;
}) {
  const validated = submitSpeakingSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  // Fetch activity for challenge_day_id
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("id, challenge_day_id")
    .eq("id", validated.data.activityId)
    .single();

  if (activityError || !activity) {
    return { success: false, error: "Activity not found" };
  }

  // Determine next attempt number
  const { data: latestAttempt } = await supabase
    .from("activity_submissions")
    .select("attempt_number")
    .eq("user_id", user.id)
    .eq("activity_id", validated.data.activityId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const attemptNumber = (latestAttempt?.attempt_number ?? 0) + 1;
  const now = new Date().toISOString();

  // Insert submission
  const { data: submission, error: submissionError } = await supabase
    .from("activity_submissions")
    .insert({
      user_id: user.id,
      activity_id: validated.data.activityId,
      attempt_number: attemptNumber,
      status: "submitted",
      storage_bucket: "speaking-recordings",
      storage_path: validated.data.storagePath,
      duration_seconds: validated.data.durationSeconds ?? null,
      file_size_bytes: validated.data.fileSizeBytes ?? null,
      mime_type: validated.data.mimeType ?? "audio/webm",
      submitted_at: now,
    })
    .select()
    .single();

  if (submissionError) {
    return { success: false, error: submissionError.message };
  }

  // Update daily progress
  const { data: existingProgress } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_day_id", activity.challenge_day_id)
    .maybeSingle();

  const isWritingDone = Boolean(existingProgress?.writing_completed_at);
  const isDayCompletedNow = isWritingDone;

  if (existingProgress) {
    await supabase
      .from("daily_progress")
      .update({
        speaking_completed_at: now,
        completed_at: isDayCompletedNow ? (existingProgress.completed_at || now) : null,
        updated_at: now,
      })
      .eq("id", existingProgress.id);
  } else {
    await supabase.from("daily_progress").insert({
      user_id: user.id,
      challenge_day_id: activity.challenge_day_id,
      speaking_completed_at: now,
      completed_at: null,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/challenge");
  revalidatePath(`/challenge/${validated.data.dayNumber}`);
  revalidatePath(`/challenge/${validated.data.dayNumber}/speaking`);

  return {
    success: true,
    submission,
    isDayComplete: isDayCompletedNow,
  };
}

export async function submitAlternativeSpeakingAction(input: {
  activityId: string;
  dayNumber: number;
  notes: string;
}) {
  const validated = submitAlternativeSpeakingSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const { data: activity } = await supabase
    .from("activities")
    .select("id, challenge_day_id")
    .eq("id", validated.data.activityId)
    .single();

  if (!activity) {
    return { success: false, error: "Activity not found" };
  }

  const { data: latestAttempt } = await supabase
    .from("activity_submissions")
    .select("attempt_number")
    .eq("user_id", user.id)
    .eq("activity_id", validated.data.activityId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const attemptNumber = (latestAttempt?.attempt_number ?? 0) + 1;
  const now = new Date().toISOString();

  // Insert alternative submission note with [Alternative Completion - No Audio] prefix
  const { data: submission, error: submissionError } = await supabase
    .from("activity_submissions")
    .insert({
      user_id: user.id,
      activity_id: validated.data.activityId,
      attempt_number: attemptNumber,
      status: "submitted",
      text_content: `[Alternative Completion - No Audio Recorded]\n\n${validated.data.notes}`,
      submitted_at: now,
    })
    .select()
    .single();

  if (submissionError) {
    return { success: false, error: submissionError.message };
  }

  // Update daily progress
  const { data: existingProgress } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_day_id", activity.challenge_day_id)
    .maybeSingle();

  const isWritingDone = Boolean(existingProgress?.writing_completed_at);
  const isDayCompletedNow = isWritingDone;

  if (existingProgress) {
    await supabase
      .from("daily_progress")
      .update({
        speaking_completed_at: now,
        completed_at: isDayCompletedNow ? (existingProgress.completed_at || now) : null,
        updated_at: now,
      })
      .eq("id", existingProgress.id);
  } else {
    await supabase.from("daily_progress").insert({
      user_id: user.id,
      challenge_day_id: activity.challenge_day_id,
      speaking_completed_at: now,
      completed_at: null,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/challenge");
  revalidatePath(`/challenge/${validated.data.dayNumber}`);

  return {
    success: true,
    submission,
    isDayComplete: isDayCompletedNow,
  };
}

export async function getSignedAudioUrlAction(storagePath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify that the requested object path begins with the user's UUID
  if (!storagePath.startsWith(`${user.id}/`)) {
    return { error: "Forbidden: You do not own this recording" };
  }

  const { data, error } = await supabase.storage
    .from("speaking-recordings")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error || !data) {
    return { error: error?.message ?? "Failed to create signed URL" };
  }

  return { signedUrl: data.signedUrl };
}
