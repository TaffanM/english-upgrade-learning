"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { selfAssessmentSchema, weeklyReviewSchema } from "@/lib/validations";

export async function toggleChecklistItemAction(
  checklistItemId: string,
  isCompleted: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("checklist_completions")
    .upsert(
      {
        user_id: user.id,
        checklist_item_id: checklistItemId,
        is_completed: isCompleted,
        completed_at: isCompleted ? now : null,
        updated_at: now,
      },
      { onConflict: "user_id,checklist_item_id" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveSelfAssessmentAction(input: {
  challengeDayId: string;
  activityType?: "speaking" | "writing";
  fluencyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  organizationScore?: number;
  confidenceScore?: number;
  notes?: string;
}) {
  const validated = selfAssessmentSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("self_assessments").insert({
    user_id: user.id,
    challenge_day_id: validated.data.challengeDayId,
    activity_type: validated.data.activityType ?? null,
    fluency_score: validated.data.fluencyScore ?? null,
    grammar_score: validated.data.grammarScore ?? null,
    vocabulary_score: validated.data.vocabularyScore ?? null,
    organization_score: validated.data.organizationScore ?? null,
    confidence_score: validated.data.confidenceScore ?? null,
    notes: validated.data.notes ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/progress");
  return { success: true };
}

export async function submitWeeklyReviewAction(input: {
  phaseId: string;
  challengeId: string;
  reflection: string;
  fluencyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  organizationScore?: number;
  confidenceScore?: number;
  evidenceNotes?: string;
}) {
  const validated = weeklyReviewSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("weekly_reviews").upsert(
    {
      user_id: user.id,
      phase_id: validated.data.phaseId,
      challenge_id: validated.data.challengeId,
      reflection: validated.data.reflection,
      fluency_score: validated.data.fluencyScore ?? null,
      grammar_score: validated.data.grammarScore ?? null,
      vocabulary_score: validated.data.vocabularyScore ?? null,
      organization_score: validated.data.organizationScore ?? null,
      confidence_score: validated.data.confidenceScore ?? null,
      evidence_notes: validated.data.evidenceNotes ?? null,
      reviewed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,phase_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/reviews");
  revalidatePath("/progress");
  return { success: true };
}
