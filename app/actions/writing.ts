"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countWords } from "@/lib/utils/word-count";
import { saveWritingDraftSchema, submitWritingSchema } from "@/lib/validations";

export async function saveWritingDraftAction(input: {
  activityId: string;
  textContent: string;
}) {
  const validated = saveWritingDraftSchema.safeParse(input);
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

  const wordCount = countWords(validated.data.textContent);

  // Check for existing draft
  const { data: existingDraft } = await supabase
    .from("activity_submissions")
    .select("id, attempt_number")
    .eq("user_id", user.id)
    .eq("activity_id", validated.data.activityId)
    .eq("status", "draft")
    .maybeSingle();

  if (existingDraft) {
    const { error } = await supabase
      .from("activity_submissions")
      .update({
        text_content: validated.data.textContent,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingDraft.id);

    if (error) return { success: false, error: error.message };
    return { success: true, savedAt: new Date().toISOString(), wordCount };
  }

  // Get max attempt number
  const { data: latestSubmission } = await supabase
    .from("activity_submissions")
    .select("attempt_number")
    .eq("user_id", user.id)
    .eq("activity_id", validated.data.activityId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextAttempt = (latestSubmission?.attempt_number ?? 0) + 1;

  const { error: insertError } = await supabase
    .from("activity_submissions")
    .insert({
      user_id: user.id,
      activity_id: validated.data.activityId,
      attempt_number: nextAttempt,
      status: "draft",
      text_content: validated.data.textContent,
      word_count: wordCount,
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, savedAt: new Date().toISOString(), wordCount };
}

export async function submitWritingAttemptAction(input: {
  activityId: string;
  textContent: string;
  dayNumber: number;
}) {
  const validated = submitWritingSchema.safeParse(input);
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

  const wordCount = countWords(validated.data.textContent);

  // Fetch activity to get challenge_day_id
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("id, challenge_day_id")
    .eq("id", validated.data.activityId)
    .single();

  if (activityError || !activity) {
    return { success: false, error: "Activity not found" };
  }

  // Remove any active draft
  await supabase
    .from("activity_submissions")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_id", validated.data.activityId)
    .eq("status", "draft");

  // Determine next attempt number for submitted work
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

  // Insert submitted attempt
  const { data: submission, error: submissionError } = await supabase
    .from("activity_submissions")
    .insert({
      user_id: user.id,
      activity_id: validated.data.activityId,
      attempt_number: attemptNumber,
      status: "submitted",
      text_content: validated.data.textContent,
      word_count: wordCount,
      submitted_at: now,
    })
    .select()
    .single();

  if (submissionError) {
    return { success: false, error: submissionError.message };
  }

  // Atomically update daily progress
  const { data: existingProgress } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_day_id", activity.challenge_day_id)
    .maybeSingle();

  const isSpeakingDone = Boolean(existingProgress?.speaking_completed_at);
  const isDayCompletedNow = isSpeakingDone;

  if (existingProgress) {
    await supabase
      .from("daily_progress")
      .update({
        writing_completed_at: now,
        completed_at: isDayCompletedNow ? (existingProgress.completed_at || now) : null,
        updated_at: now,
      })
      .eq("id", existingProgress.id);
  } else {
    await supabase.from("daily_progress").insert({
      user_id: user.id,
      challenge_day_id: activity.challenge_day_id,
      writing_completed_at: now,
      completed_at: null,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/challenge");
  revalidatePath(`/challenge/${validated.data.dayNumber}`);
  revalidatePath(`/challenge/${validated.data.dayNumber}/writing`);

  return {
    success: true,
    submission,
    isDayComplete: isDayCompletedNow,
  };
}
