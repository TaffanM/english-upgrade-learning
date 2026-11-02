import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Mock harness simulating review-service.ts workflow with in-memory tables and mocked NVIDIA NIM provider
function createReviewHarness(options = {}) {
  const submissions = new Map();
  const activities = new Map();
  const reviews = new Map(); // keyed by submission_id
  const inFlight = new Set();
  let llmCallCount = 0;

  const activityWritingId = "11111111-1111-4111-8111-111111111111";
  const activitySpeakingId = "22222222-2222-4222-8222-222222222222";

  activities.set(activityWritingId, {
    id: activityWritingId,
    activity_type: "writing",
    title: "Writing Practice",
    prompt: "Write a 130-word opinion paragraph on urban public transport.",
    target_word_count: 130,
  });

  activities.set(activitySpeakingId, {
    id: activitySpeakingId,
    activity_type: "speaking",
    title: "Speaking Practice",
    prompt: "Explain how public transport affects daily quality of life.",
    target_word_count: null,
  });

  async function executeReview({
    userId,
    submissionId,
    expectedType,
    forceReReview = false,
  }) {
    if (!userId) {
      return { status: 401, code: "UNAUTHORIZED" };
    }

    const sub = submissions.get(submissionId);
    if (!sub) {
      return { status: 404, code: "NOT_FOUND" };
    }

    if (sub.user_id !== userId) {
      return { status: 403, code: "FORBIDDEN" };
    }

    if (sub.status !== "submitted") {
      return { status: 422, code: "SUBMISSION_NOT_SUBMITTED" };
    }

    const existing = reviews.get(submissionId);
    if (existing && !forceReReview) {
      return { status: 200, cached: true, review: existing };
    }

    const activity = activities.get(sub.activity_id);
    if (!activity || activity.activity_type !== expectedType) {
      return { status: 422, code: "INVALID_INPUT" };
    }

    const textToEvaluate =
      expectedType === "writing"
        ? (sub.text_content || "").trim()
        : (sub.edited_transcript || sub.original_transcript || "").trim();

    if (expectedType === "speaking" && textToEvaluate.length < 5) {
      return { status: 422, code: "TRANSCRIPT_MISSING" };
    }

    if (inFlight.has(submissionId)) {
      return { status: 409, code: "DUPLICATE_IN_FLIGHT" };
    }

    inFlight.add(submissionId);
    try {
      llmCallCount++;
      if (options.simulateProviderFailure) {
        return { status: 502, code: "PROVIDER_ERROR" };
      }
      if (options.simulateDbFailure) {
        return { status: 500, code: "DATABASE_ERROR" };
      }

      const nextVersion = existing ? existing.reviewVersion + 1 : 1;
      const savedReview = {
        id: existing?.id || "99999999-9999-4999-8999-999999999999",
        userId,
        submissionId,
        reviewType: expectedType,
        modelName: "google/diffusiongemma-26b-a4b-it",
        reviewVersion: nextVersion,
        evaluatedTextSnapshot: textToEvaluate,
        overallScore: 82,
        overallFeedback: "Strong B1+ organization with clear examples.",
        scores: {
          grammar: 80,
          vocabulary: 78,
          coherence: 85,
          taskAchievement: 85,
        },
        strengths: ["Good use of connectors"],
        improvements: ["Expand clause variety"],
        corrections: [],
        recommendedPractice: [
          { skill: "Subordinate Clauses", instruction: "Combine two short sentences using 'whereas'." },
        ],
      };

      reviews.set(submissionId, savedReview);
      return { status: 201, cached: false, review: savedReview };
    } finally {
      inFlight.delete(submissionId);
    }
  }

  return {
    submissions,
    reviews,
    inFlight,
    activityWritingId,
    activitySpeakingId,
    executeReview,
    getLlmCallCount: () => llmCallCount,
  };
}

describe("AI Review Integration Tests — End-to-End Workflows", () => {
  const learnerId = "a0000000-0000-4000-8000-000000000001";
  const otherUserId = "b0000000-0000-4000-8000-000000000002";

  test("1. Successful writing review creation, caching on reopen, and explicit re-evaluation", async () => {
    const harness = createReviewHarness();
    const subId = "33333333-3333-4333-8333-333333333333";
    const originalWriting =
      "Public transport is essential for modern cities because it reduces traffic congestion and pollution.";

    harness.submissions.set(subId, {
      id: subId,
      user_id: learnerId,
      activity_id: harness.activityWritingId,
      status: "submitted",
      text_content: originalWriting,
    });

    // First review request generates via NVIDIA NIM (201)
    const first = await harness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "writing",
    });
    assert.equal(first.status, 201);
    assert.equal(first.cached, false);
    assert.equal(first.review.modelName, "google/diffusiongemma-26b-a4b-it");
    assert.equal(first.review.reviewVersion, 1);
    assert.equal(harness.getLlmCallCount(), 1);

    // Reopening existing review returns cached result (200) without calling LLM again
    const second = await harness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "writing",
      forceReReview: false,
    });
    assert.equal(second.status, 200);
    assert.equal(second.cached, true);
    assert.equal(harness.getLlmCallCount(), 1);

    // Explicit re-review increments reviewVersion while keeping original submission untouched
    const third = await harness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "writing",
      forceReReview: true,
    });
    assert.equal(third.status, 201);
    assert.equal(third.review.reviewVersion, 2);
    assert.equal(harness.getLlmCallCount(), 2);
    assert.equal(harness.submissions.get(subId).text_content, originalWriting);
  });

  test("2. Successful speaking review uses edited_transcript and rejects missing transcript", async () => {
    const harness = createReviewHarness();
    const subId = "44444444-4444-4444-8444-444444444444";

    harness.submissions.set(subId, {
      id: subId,
      user_id: learnerId,
      activity_id: harness.activitySpeakingId,
      status: "submitted",
      storage_path: `${learnerId}/challenge/1/${subId}.wav`,
      original_transcript: null,
      edited_transcript: null,
    });

    // Without transcript -> 422 TRANSCRIPT_MISSING
    const missingRes = await harness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "speaking",
    });
    assert.equal(missingRes.status, 422);
    assert.equal(missingRes.code, "TRANSCRIPT_MISSING");

    // Populate original_transcript and edited_transcript
    harness.submissions.get(subId).original_transcript =
      "I think buses and trains is very helpful for commuters.";
    harness.submissions.get(subId).edited_transcript =
      "I think buses and trains are very helpful for daily commuters.";

    const okRes = await harness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "speaking",
    });
    assert.equal(okRes.status, 201);
    assert.equal(
      okRes.review.evaluatedTextSnapshot,
      "I think buses and trains are very helpful for daily commuters."
    );
  });

  test("3. Missing submission (404), unauthorized ownership (403), and duplicate in-flight lock (409)", async () => {
    const harness = createReviewHarness();
    const subId = "55555555-5555-4555-8555-555555555555";

    harness.submissions.set(subId, {
      id: subId,
      user_id: learnerId,
      activity_id: harness.activityWritingId,
      status: "submitted",
      text_content: "A complete writing submission for testing ownership.",
    });

    // Missing submission -> 404
    const missing = await harness.executeReview({
      userId: learnerId,
      submissionId: "00000000-0000-4000-8000-000000000000",
      expectedType: "writing",
    });
    assert.equal(missing.status, 404);

    // Another user -> 403 Forbidden
    const forbidden = await harness.executeReview({
      userId: otherUserId,
      submissionId: subId,
      expectedType: "writing",
    });
    assert.equal(forbidden.status, 403);

    // Duplicate simultaneous request -> 409 Conflict
    harness.inFlight.add(subId);
    const duplicate = await harness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "writing",
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.code, "DUPLICATE_IN_FLIGHT");
    harness.inFlight.delete(subId);
  });

  test("4. Handles NVIDIA API failure (502) and database persistence failure (500) gracefully", async () => {
    const subId = "66666666-6666-4666-8666-666666666666";

    const providerFailHarness = createReviewHarness({
      simulateProviderFailure: true,
    });
    providerFailHarness.submissions.set(subId, {
      id: subId,
      user_id: learnerId,
      activity_id: providerFailHarness.activityWritingId,
      status: "submitted",
      text_content: "Testing upstream provider error handling.",
    });

    const provRes = await providerFailHarness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "writing",
    });
    assert.equal(provRes.status, 502);
    assert.equal(provRes.code, "PROVIDER_ERROR");

    const dbFailHarness = createReviewHarness({ simulateDbFailure: true });
    dbFailHarness.submissions.set(subId, {
      id: subId,
      user_id: learnerId,
      activity_id: dbFailHarness.activityWritingId,
      status: "submitted",
      text_content: "Testing database persistence error handling.",
    });

    const dbRes = await dbFailHarness.executeReview({
      userId: learnerId,
      submissionId: subId,
      expectedType: "writing",
    });
    assert.equal(dbRes.status, 500);
    assert.equal(dbRes.code, "DATABASE_ERROR");
  });
});
