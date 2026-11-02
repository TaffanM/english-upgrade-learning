import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { AiReviewServiceError } from "./types";

const inFlightReviews = new Set<string>();

export const MAX_REVIEWS_PER_HOUR = 15;
export const REREVIEW_COOLDOWN_MS = 30_000; // 30 seconds
export const MAX_SUBMISSION_CHAR_LENGTH = 8_000;

export function acquireReviewLock(submissionId: string): void {
  if (inFlightReviews.has(submissionId)) {
    throw new AiReviewServiceError(
      "DUPLICATE_IN_FLIGHT",
      "An AI review is already being generated for this submission. Please wait a moment.",
      409
    );
  }
  inFlightReviews.add(submissionId);
}

export function releaseReviewLock(submissionId: string): void {
  inFlightReviews.delete(submissionId);
}

export async function enforceReviewRateLimits(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  existingReviewUpdatedAt?: string | null;
  forceReReview: boolean;
}): Promise<void> {
  const { supabase, userId, existingReviewUpdatedAt, forceReReview } = params;

  if (forceReReview && existingReviewUpdatedAt) {
    const elapsedMs =
      Date.now() - new Date(existingReviewUpdatedAt).getTime();
    if (elapsedMs < REREVIEW_COOLDOWN_MS) {
      const waitSecs = Math.ceil((REREVIEW_COOLDOWN_MS - elapsedMs) / 1000);
      throw new AiReviewServiceError(
        "RATE_LIMITED",
        `Please wait ${waitSecs}s before requesting another re-evaluation for this submission.`,
        429
      );
    }
  }

  const oneHourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("updated_at", oneHourAgoIso);

  if ((count ?? 0) >= MAX_REVIEWS_PER_HOUR) {
    throw new AiReviewServiceError(
      "RATE_LIMITED",
      "You have reached the hourly limit of 15 AI evaluations. Please take a short break and try again later.",
      429
    );
  }
}
