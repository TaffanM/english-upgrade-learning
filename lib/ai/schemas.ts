import { z } from "zod";
import { AiEvaluationResult, AiReviewServiceError } from "./types";

export const createAiReviewRequestSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  forceReReview: z.boolean().optional().default(false),
});

export type CreateAiReviewRequest = z.infer<typeof createAiReviewRequestSchema>;

const correctionCategoryValues = [
  "grammar",
  "vocabulary",
  "coherence",
  "style",
  "word_choice",
  "sentence_structure",
  "filler_repetition",
] as const;

export const aiCorrectionSchema = z.object({
  original: z.string().trim().min(1, "Original text is required"),
  corrected: z.string().trim().min(1, "Corrected text is required"),
  explanation: z.string().trim().min(3, "Explanation is required"),
  category: z
    .string()
    .transform((val) => {
      const normalized = val.toLowerCase().trim().replace(/[\s-]+/g, "_");
      if (
        (correctionCategoryValues as readonly string[]).includes(normalized)
      ) {
        return normalized as (typeof correctionCategoryValues)[number];
      }
      if (normalized.includes("vocab") || normalized.includes("lexical")) {
        return "vocabulary";
      }
      if (normalized.includes("coher") || normalized.includes("link")) {
        return "coherence";
      }
      if (normalized.includes("styl") || normalized.includes("tone")) {
        return "style";
      }
      if (normalized.includes("filler") || normalized.includes("repetit")) {
        return "filler_repetition";
      }
      if (normalized.includes("struct") || normalized.includes("complex")) {
        return "sentence_structure";
      }
      return "grammar";
    }),
});

const scoreValueSchema = z
  .number()
  .int("Score must be an integer")
  .min(0, "Score cannot be less than 0")
  .max(100, "Score cannot exceed 100");

export const aiReviewScoresSchema = z.object({
  grammar: scoreValueSchema,
  vocabulary: scoreValueSchema,
  coherence: scoreValueSchema,
  taskAchievement: scoreValueSchema,
});

export const aiRecommendedPracticeSchema = z.object({
  skill: z.string().trim().min(2, "Skill name is required"),
  instruction: z.string().trim().min(5, "Practice instruction is required"),
});

export const aiReviewResultSchema = z.object({
  overallFeedback: z.string().trim().min(10, "Overall feedback is required"),
  strengths: z.array(z.string().trim().min(2)).min(1).max(8),
  improvements: z.array(z.string().trim().min(2)).min(1).max(8),
  corrections: z.array(aiCorrectionSchema).max(12),
  scores: aiReviewScoresSchema,
  recommendedPractice: z.array(aiRecommendedPracticeSchema).min(1).max(6),
});

/**
 * Extracts and validates a structured JSON evaluation from raw LLM text.
 * Safely strips <think>...</think> blocks or markdown ```json fences if present.
 */
export function parseAndValidateModelEvaluation(
  rawContent: string
): AiEvaluationResult {
  if (!rawContent || !rawContent.trim()) {
    throw new AiReviewServiceError(
      "INVALID_MODEL_OUTPUT",
      "The AI tutor returned an empty response. Please try again.",
      502
    );
  }

  // Strip reasoning tags (<think>...</think>) emitted by reasoning models like gpt-oss-20b
  let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Extract JSON block if wrapped in markdown fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  } else {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    throw new AiReviewServiceError(
      "INVALID_MODEL_OUTPUT",
      "The AI tutor returned malformed JSON output. Please retry the evaluation.",
      502
    );
  }

  const validated = aiReviewResultSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new AiReviewServiceError(
      "INVALID_MODEL_OUTPUT",
      `AI evaluation output did not match the expected schema (${validated.error.issues[0]?.message || "validation error"}).`,
      502
    );
  }

  return validated.data;
}

export function computeOverallScore(scores: {
  grammar: number;
  vocabulary: number;
  coherence: number;
  taskAchievement: number;
}): number {
  return Math.round(
    (scores.grammar +
      scores.vocabulary +
      scores.coherence +
      scores.taskAchievement) /
      4
  );
}
