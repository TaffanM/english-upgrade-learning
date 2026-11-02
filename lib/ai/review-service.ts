import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/database.types";
import { countWords } from "@/lib/utils/word-count";
import {
  AiCorrectionItem,
  AiEvaluationProvider,
  AiRecommendedPracticeItem,
  AiReviewRecordDTO,
  AiReviewScores,
  AiReviewServiceError,
  AiReviewType,
  CurriculumEvaluationContext,
} from "./types";
import {
  computeOverallScore,
  createAiReviewRequestSchema,
  parseAndValidateModelEvaluation,
} from "./schemas";
import {
  buildSpeakingEvaluationMessages,
  buildWritingEvaluationMessages,
} from "./prompts";
import {
  acquireReviewLock,
  enforceReviewRateLimits,
  MAX_SUBMISSION_CHAR_LENGTH,
  releaseReviewLock,
} from "./rate-limit";
import { getConfiguredAiEvaluationProvider } from "./nvidia-provider";

type AiReviewRow = Database["public"]["Tables"]["ai_reviews"]["Row"];

export function mapRowToAiReviewDTO(row: AiReviewRow): AiReviewRecordDTO {
  const scoresObj = (row.scores ?? {}) as Record<string, unknown>;
  const scores: AiReviewScores = {
    grammar: Number(scoresObj.grammar ?? 0),
    vocabulary: Number(scoresObj.vocabulary ?? 0),
    coherence: Number(scoresObj.coherence ?? 0),
    taskAchievement: Number(scoresObj.taskAchievement ?? 0),
  };

  const strengths = Array.isArray(row.strengths)
    ? (row.strengths as unknown as string[])
    : [];
  const improvements = Array.isArray(row.improvements)
    ? (row.improvements as unknown as string[])
    : [];
  const corrections = Array.isArray(row.corrections)
    ? (row.corrections as unknown as AiCorrectionItem[])
    : [];
  const recommendedPractice = Array.isArray(row.recommended_practice)
    ? (row.recommended_practice as unknown as AiRecommendedPracticeItem[])
    : [];

  return {
    id: row.id,
    submissionId: row.submission_id,
    reviewType: row.review_type,
    modelName: row.model_name,
    reviewVersion: row.review_version ?? 1,
    overallScore: computeOverallScore(scores),
    overallFeedback: row.overall_feedback,
    scores,
    strengths,
    improvements,
    corrections,
    recommendedPractice,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAiReviewByIdForUser(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  reviewId: string;
}): Promise<AiReviewRecordDTO> {
  const { supabase, userId, reviewId } = params;

  const { data: review, error } = await supabase
    .from("ai_reviews")
    .select("*")
    .eq("id", reviewId)
    .maybeSingle();

  if (error || !review) {
    throw new AiReviewServiceError("NOT_FOUND", "AI review not found.", 404);
  }

  if (review.user_id !== userId) {
    throw new AiReviewServiceError(
      "FORBIDDEN",
      "You do not have permission to view this AI review.",
      403
    );
  }

  return mapRowToAiReviewDTO(review);
}

export async function generateOrGetAiReview(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  expectedType: AiReviewType;
  rawInput: unknown;
  providerOverride?: AiEvaluationProvider;
}): Promise<{ review: AiReviewRecordDTO; cached: boolean }> {
  const { supabase, userId, expectedType, rawInput, providerOverride } = params;

  const parsedInput = createAiReviewRequestSchema.safeParse(rawInput);
  if (!parsedInput.success) {
    throw new AiReviewServiceError(
      "INVALID_INPUT",
      parsedInput.error.issues[0]?.message || "Invalid AI review request.",
      400
    );
  }

  const { submissionId, forceReReview } = parsedInput.data;

  // 1. Fetch existing submission
  const { data: submission, error: subError } = await supabase
    .from("activity_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError || !submission) {
    throw new AiReviewServiceError(
      "NOT_FOUND",
      "Submission not found.",
      404
    );
  }

  // 2. Verify submission ownership
  if (submission.user_id !== userId) {
    throw new AiReviewServiceError(
      "FORBIDDEN",
      "You do not have permission to review this submission.",
      403
    );
  }

  // 3. Ensure submission is finalized ('submitted'), not a draft
  if (submission.status !== "submitted") {
    throw new AiReviewServiceError(
      "SUBMISSION_NOT_SUBMITTED",
      "Please submit your attempt before requesting AI Tutor feedback.",
      422
    );
  }

  // 4. Check if an active review already exists for this submission
  const { data: existingReview } = await supabase
    .from("ai_reviews")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (existingReview && !forceReReview) {
    return {
      review: mapRowToAiReviewDTO(existingReview),
      cached: true,
    };
  }

  // 5. Fetch activity, challenge_day, phase, challenge, and checklist items
  const { data: activity, error: actError } = await supabase
    .from("activities")
    .select("*")
    .eq("id", submission.activity_id)
    .maybeSingle();

  if (actError || !activity) {
    throw new AiReviewServiceError(
      "NOT_FOUND",
      "Curriculum activity not found for this submission.",
      404
    );
  }

  if (activity.activity_type !== expectedType) {
    throw new AiReviewServiceError(
      "INVALID_INPUT",
      `This submission is a ${activity.activity_type} task and cannot be evaluated by the ${expectedType} review endpoint.`,
      422
    );
  }

  // 6. Extract and validate learner text (writing content vs speaking transcript)
  let learnerText = "";
  if (expectedType === "writing") {
    learnerText = (submission.text_content ?? "").trim();
    if (learnerText.length < 10) {
      throw new AiReviewServiceError(
        "INVALID_INPUT",
        "Writing submission is too short to evaluate (minimum 10 characters).",
        422
      );
    }
  } else {
    // Speaking evaluation uses edited_transcript first, then original_transcript
    const transcriptCandidate = (
      submission.edited_transcript ||
      submission.original_transcript ||
      ""
    ).trim();

    if (transcriptCandidate.length < 5) {
      throw new AiReviewServiceError(
        "TRANSCRIPT_MISSING",
        "A speaking transcript is required before requesting AI Speaking Review. Please transcribe your recording or enter your transcript first.",
        422
      );
    }
    learnerText = transcriptCandidate;
  }

  if (learnerText.length > MAX_SUBMISSION_CHAR_LENGTH) {
    throw new AiReviewServiceError(
      "SUBMISSION_TOO_LONG",
      `Submission exceeds the maximum length of ${MAX_SUBMISSION_CHAR_LENGTH} characters for AI evaluation.`,
      422
    );
  }

  // 7. Acquire in-flight lock and check rate limits
  acquireReviewLock(submissionId);

  try {
    await enforceReviewRateLimits({
      supabase,
      userId,
      existingReviewUpdatedAt: existingReview?.updated_at,
      forceReReview,
    });

    // Fetch challenge day, phase, challenge, and checklists
    const [{ data: day }, { data: checklistItems }] = await Promise.all([
      supabase
        .from("challenge_days")
        .select("*, phases(*), challenges(*)")
        .eq("id", activity.challenge_day_id)
        .maybeSingle(),
      supabase
        .from("checklist_items")
        .select("label")
        .eq("challenge_day_id", activity.challenge_day_id)
        .order("sort_order", { ascending: true }),
    ]);

    if (!day) {
      throw new AiReviewServiceError(
        "NOT_FOUND",
        "Challenge day curriculum context not found.",
        404
      );
    }

    const phase = (day as unknown as { phases?: Database["public"]["Tables"]["phases"]["Row"] | null }).phases ?? null;
    const challenge = (day as unknown as { challenges?: Database["public"]["Tables"]["challenges"]["Row"] | null }).challenges ?? null;

    const actualWordCount = countWords(learnerText);
    const evalContext: CurriculumEvaluationContext = {
      reviewType: expectedType,
      dayNumber: day.day_number,
      dayTitle: day.title,
      dayIntro: day.intro,
      phaseNumber: phase?.phase_number ?? null,
      phaseTitle: phase?.title ?? null,
      phaseFocus: phase?.focus ?? null,
      sourceLevel: challenge?.source_level || "B1",
      targetLevel: challenge?.target_level || "B2",
      activityTitle: activity.title,
      prompt: activity.prompt,
      instructions: activity.instructions,
      targetWordCount: activity.target_word_count,
      minimumWordCount: activity.minimum_word_count,
      maximumWordCount: activity.maximum_word_count,
      checklistLabels: (checklistItems ?? []).map((c) => c.label),
      learnerText,
      actualWordCount,
      durationSeconds: submission.duration_seconds,
    };

    // 8. Build evaluation messages
    const messages =
      expectedType === "writing"
        ? buildWritingEvaluationMessages(evalContext)
        : buildSpeakingEvaluationMessages(evalContext);

    // 9. Call NVIDIA NIM Provider
    const provider = providerOverride ?? getConfiguredAiEvaluationProvider();
    const { rawContent, modelName } =
      await provider.generateEvaluation(messages);

    // 10. Parse and validate structured evaluation output with Zod
    const validatedResult = parseAndValidateModelEvaluation(rawContent);

    // 11. Persist result via atomic UPSERT on submission_id
    const nextVersion = existingReview
      ? (existingReview.review_version ?? 1) + 1
      : 1;
    const nowIso = new Date().toISOString();

    const { data: savedRow, error: saveError } = await supabase
      .from("ai_reviews")
      .upsert(
        {
          user_id: userId,
          submission_id: submissionId,
          review_type: expectedType,
          model_name: modelName,
          review_version: nextVersion,
          overall_feedback: validatedResult.overallFeedback,
          scores: validatedResult.scores as unknown as Json,
          strengths: validatedResult.strengths as unknown as Json,
          improvements: validatedResult.improvements as unknown as Json,
          corrections: validatedResult.corrections as unknown as Json,
          recommended_practice:
            validatedResult.recommendedPractice as unknown as Json,
          updated_at: nowIso,
        },
        { onConflict: "submission_id" }
      )
      .select("*")
      .single();

    if (saveError || !savedRow) {
      throw new AiReviewServiceError(
        "DATABASE_ERROR",
        "Failed to save AI evaluation to the database.",
        500
      );
    }

    return {
      review: mapRowToAiReviewDTO(savedRow),
      cached: false,
    };
  } finally {
    releaseReviewLock(submissionId);
  }
}
